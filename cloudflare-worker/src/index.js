/**
 * GO Transit Proxy API Worker
 * 
 * High-performance, edge-cached proxy for the Metrolinx Open Data API
 * Running on Cloudflare Workers
 * 
 * Architecture:
 * Client → Cloudflare Worker (proxy + caching) → Cloudflare Cache → Metrolinx API
 * 
 * Key Features:
 * - Deterministic cache key normalization
 * - Stale-while-revalidate with fallback
 * - Timeout handling (3s default)
 * - CORS support for web clients
 * - Comprehensive observability headers and logging
 * 
 * References:
 * - PROXY_API_SERVER.md - Code examples and best practices
 * - PROXY_API_SERVER_PRD.md - Detailed requirements
 * - METROLINX_API.md - API endpoint documentation
 */

/**
 * Main fetch handler for the Worker
 * Processes all incoming requests and returns cached or origin responses
 */
export default {
  async fetch(request, env, ctx) {
    // 1. Validate request
    const url = new URL(request.url)
    const validationError = validateRequest(request, url)
    if (validationError) {
      return validationError
    }

    // 2. Normalize cache key
    const cacheKey = createCacheKey(env.ORIGIN_BASE_URL, url)
    const cache = caches.default

    // 3. Try cache lookup
    let response = await cache.match(cacheKey)
    if (response) {
      // Cache HIT
      response = new Response(response.body, response)
      response.headers.set('X-Cache', 'HIT')
      addCorsHeaders(response)
      return response
    }

    // 4. Cache MISS - fetch from origin
    const originStart = Date.now()
    let originResponse

    try {
      originResponse = await fetchOrigin(url, env, ctx)
    } catch (err) {
      // Log error and return appropriate response
      if (err.name === 'AbortError') {
        logEvent(env, 'ORIGIN_TIMEOUT', {
          path: url.pathname,
          timeout_ms: env.ORIGIN_TIMEOUT_MS || 3000,
        })
        return createErrorResponse(504, 'Gateway Timeout', env)
      }
      
      logEvent(env, 'ORIGIN_FETCH_ERROR', {
        error: err.message,
        path: url.pathname,
      })
      return createErrorResponse(502, 'Bad Gateway', env)
    }

    // 5. Process origin response
    const originTime = Date.now() - originStart
    logEvent(env, 'ORIGIN_FETCH', {
      status: originResponse.status,
      time_ms: originTime,
      path: url.pathname,
    })

    // Clone response before reading body (body can only be consumed once)
    const clonedResponse = originResponse.clone()

    // 6. Set cache headers based on response status
    const cacheHeaders = getCacheHeaders(
      clonedResponse.status,
      env.BROWSER_TTL,
      env.EDGE_TTL,
      env.STALE_WHILE_REVALIDATE_TTL
    )
    clonedResponse.headers.set('Cache-Control', cacheHeaders)

    // 7. Add observability headers
    if (env.ENABLE_OBSERVABILITY_HEADERS !== 'false') {
      clonedResponse.headers.set('X-Cache', 'MISS')
      clonedResponse.headers.set('X-Proxy-Version', '1.0')
      clonedResponse.headers.set('X-Proxy-Time-Ms', originTime.toString())
    }

    // 8. Add CORS headers
    addCorsHeaders(clonedResponse)

    // 9. Cache response asynchronously in background
    // Only cache successful responses (2xx) and errors (5xx for short TTL)
    if (clonedResponse.ok || clonedResponse.status >= 500) {
      ctx.waitUntil(cache.put(cacheKey, clonedResponse.clone()))
      logEvent(env, 'CACHE_MISS_STORED', {
        status: clonedResponse.status,
        path: url.pathname,
      })
    }

    return clonedResponse
  },
}

/**
 * Validate incoming request
 * - Only GET and OPTIONS methods allowed
 * - Request size within limits
 * Returns error response if validation fails, null if valid
 */
function validateRequest(request, url) {
  // Check method
  if (request.method === 'OPTIONS') {
    const response = new Response(null, { status: 204 })
    addCorsHeaders(response)
    return response
  }

  if (request.method !== 'GET') {
    return new Response(null, {
      status: 405,
      statusText: 'Method Not Allowed',
    })
  }

  return null
}

/**
 * Create deterministic cache key
 * Includes path and normalized query parameters (allowlist)
 * Cache key does NOT include origin domain (proxy always uses same origin)
 */
function createCacheKey(originBaseUrl, url) {
  const normalizedParams = normalizeParams(url.searchParams)
  const cacheKeyUrl = `${originBaseUrl}${url.pathname}${normalizedParams ? '?' + normalizedParams : ''}`
  
  return new Request(cacheKeyUrl, { method: 'GET' })
}

/**
 * Normalize query parameters for cache key
 * - Only include allowlisted parameters
 * - Sort alphabetically for deterministic keys
 * - Exclude tracking and session parameters
 */
function normalizeParams(params) {
  // GO Transit API parameter allowlist
  const allowlist = ['station_id', 'limit', 'direction']
  
  return [...params.entries()]
    .filter(([key]) => allowlist.includes(key))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

/**
 * Fetch from origin API with timeout and authentication
 * Throws AbortError on timeout, Error on other failures
 */
async function fetchOrigin(url, env, ctx) {
  const controller = new AbortController()
  const timeoutMs = parseInt(env.ORIGIN_TIMEOUT_MS) || 3000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const originUrl = `${env.ORIGIN_BASE_URL}${url.pathname}${url.search}`
    
    const response = await fetch(originUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.ORIGIN_AUTH_TOKEN}`,
        'User-Agent': 'TRMNL-GO-Transit-Proxy/1.0',
      },
      signal: controller.signal,
      cf: {
        cacheTtl: 0, // Disable automatic Cloudflare caching
        mirage: false,
      },
    })

    clearTimeout(timeout)
    return response
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}

/**
 * Get appropriate Cache-Control header based on response status
 * - 2xx: Full cache with SWR
 * - 4xx: No cache (bad requests should fail fast)
 * - 5xx: Short cache (10s) to prevent origin hammering
 */
function getCacheHeaders(status, browserTtl, edgeTtl, swrTtl) {
  browserTtl = parseInt(browserTtl) || 60
  edgeTtl = parseInt(edgeTtl) || 300
  swrTtl = parseInt(swrTtl) || 30

  if (status >= 500) {
    // Error response - short cache only
    return 'public, max-age=10, s-maxage=10'
  }

  if (status >= 400) {
    // Client error - don't cache
    return 'no-store'
  }

  // Success response - full cache with SWR
  return `public, max-age=${browserTtl}, s-maxage=${edgeTtl}, stale-while-revalidate=${swrTtl}`
}

/**
 * Add CORS headers to response
 * Allows web clients to make requests to the Worker
 */
function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
}

/**
 * Create error response with appropriate status code
 */
function createErrorResponse(status, statusText, env) {
  const response = new Response(JSON.stringify({
    error: statusText,
    status: status,
    timestamp: new Date().toISOString(),
  }), {
    status: status,
    statusText: statusText,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  addCorsHeaders(response)
  
  if (env.ENABLE_OBSERVABILITY_HEADERS !== 'false') {
    response.headers.set('X-Cache', 'ERROR')
    response.headers.set('X-Proxy-Version', '1.0')
  }

  return response
}

/**
 * Log event for monitoring and debugging
 * Format: [TIMESTAMP] [LEVEL] [EVENT] - {context}
 * In production, logs are sent to Cloudflare Logpush → Axiom
 */
function logEvent(env, eventType, context = {}) {
  const logLevel = env.LOG_LEVEL || 'info'
  const environment = env.ENVIRONMENT || 'development'
  
  // Only log at appropriate level
  const levels = { debug: 0, info: 1, warn: 2, error: 3 }
  const currentLevel = levels[logLevel] || 1
  const eventLevel = eventType.includes('ERROR') ? 3 : 1

  if (eventLevel < currentLevel) {
    return
  }

  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] [${environment}] [${eventType}] - ${JSON.stringify(context)}`
  
  if (eventType.includes('ERROR')) {
    console.error(message)
  } else {
    console.log(message)
  }
}
