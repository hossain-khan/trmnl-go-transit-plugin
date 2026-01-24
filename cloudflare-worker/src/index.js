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
const worker = {
  async fetch(request, env, ctx) {
    try {
      // 0. Health check endpoint
      const url = new URL(request.url)
      if (url.pathname === '/health') {
        const healthResponse = new Response(
          JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            env: {
              ORIGIN_BASE_URL: env.ORIGIN_BASE_URL ? '***' : 'missing',
              ORIGIN_AUTH_TOKEN: env.ORIGIN_AUTH_TOKEN ? '***' : 'missing',
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
        addCorsHeaders(healthResponse)
        return healthResponse
      }

      // Validate environment configuration
      if (!env.ORIGIN_BASE_URL || !env.ORIGIN_AUTH_TOKEN) {
        return createErrorResponse(
          500,
          'Server Configuration Error - Missing environment variables',
          env
        )
      }

      // 1. Validate request
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

      // Log cache miss
      logEvent(env, 'CACHE_MISS', {
        path: `${url.pathname}${url.search}`,
      })

      // 4. Cache MISS - fetch from origin
      const originStart = Date.now()
      let originResponse

      try {
        originResponse = await fetchOrigin(url, env, ctx)
      } catch (err) {
        // Log error and return appropriate response
        if (err.name === 'AbortError') {
          const timeoutMs = env.ORIGIN_TIMEOUT_MS || 3000
          logEvent(env, 'ORIGIN_TIMEOUT', {
            timeout_ms: timeoutMs,
            path: url.pathname,
          })

          // Check for stale cached response
          const staleResponse = await cache.match(cacheKey)
          if (staleResponse) {
            // Calculate age of stale response
            const cacheDate = staleResponse.headers.get('Date')
            const ageSeconds = cacheDate
              ? Math.floor((Date.now() - new Date(cacheDate).getTime()) / 1000)
              : null

            logEvent(env, 'STALE_FALLBACK', {
              path: url.pathname,
              age_seconds: ageSeconds,
              reason: 'timeout',
            })
            const response = new Response(staleResponse.body, staleResponse)
            response.headers.set('X-Cache', 'STALE')
            addCorsHeaders(response)
            return response
          }

          // No stale cache available, return 504
          return createErrorResponse(504, 'Gateway Timeout', env)
        }

        logEvent(env, 'ORIGIN_FETCH_ERROR', {
          error: err.message,
          path: url.pathname,
        })
        // Return error with details for debugging
        const response = new Response(
          JSON.stringify({
            error: 'Bad Gateway',
            details: err.message,
            status: 502,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 502,
            statusText: 'Bad Gateway',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        addCorsHeaders(response)
        return response
      }

      // 5. Process origin response
      const originTime = Date.now() - originStart

      // Log successful origin fetch
      if (originResponse.ok) {
        logEvent(env, 'ORIGIN_FETCH_SUCCESS', {
          status: originResponse.status,
          time_ms: originTime,
          path: url.pathname,
        })
      }

      // Handle 5xx errors with stale fallback
      if (originResponse.status >= 500) {
        logEvent(env, 'ORIGIN_ERROR', {
          status: originResponse.status,
          origin: env.ORIGIN_BASE_URL,
          path: url.pathname,
        })

        // Check for stale cached response
        const staleResponse = await cache.match(cacheKey)
        if (staleResponse) {
          // Calculate age of stale response
          const cacheDate = staleResponse.headers.get('Date')
          const ageSeconds = cacheDate
            ? Math.floor((Date.now() - new Date(cacheDate).getTime()) / 1000)
            : null

          logEvent(env, 'STALE_FALLBACK', {
            path: url.pathname,
            age_seconds: ageSeconds,
            reason: 'origin_5xx',
          })
          const response = new Response(staleResponse.body, staleResponse)
          response.headers.set('X-Cache', 'STALE')
          addCorsHeaders(response)
          return response
        }

        // No stale cache available, cache the error response with short TTL
        logEvent(env, 'CACHE_ERROR_RESPONSE', {
          path: url.pathname,
          status: originResponse.status,
          ttl_seconds: 10,
        })
      }

      // Clone response before reading body (body can only be consumed once)
      const clonedResponse = originResponse.clone()

      // 6. Set cache headers based on response status
      const cacheHeaders = getCacheHeaders(
        originResponse.status,
        env.BROWSER_TTL,
        env.EDGE_TTL,
        env.STALE_WHILE_REVALIDATE_TTL
      )

      // 7. Create new response with modified headers
      const responseHeaders = new Headers(clonedResponse.headers)
      responseHeaders.set('Cache-Control', cacheHeaders)

      // 8. Add observability headers
      if (env.ENABLE_OBSERVABILITY_HEADERS !== 'false') {
        responseHeaders.set('X-Cache', 'MISS')
        responseHeaders.set('X-Proxy-Version', '1.0')
        responseHeaders.set('X-Proxy-Time-Ms', originTime.toString())
      }

      // 9. Add CORS headers
      responseHeaders.set('Access-Control-Allow-Origin', '*')
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type')
      responseHeaders.set('Access-Control-Max-Age', '86400') // 24 hours

      // Create new response with updated headers
      const finalResponse = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: responseHeaders,
      })

      // 10. Cache response asynchronously in background
      // Only cache successful responses (2xx) and errors (5xx for short TTL)
      if (finalResponse.ok || finalResponse.status >= 500) {
        ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()))
        logEvent(env, 'CACHE_MISS_STORED', {
          status: finalResponse.status,
          path: url.pathname,
        })
      }

      return finalResponse
    } catch (error) {
      logEvent(env, 'WORKER_ERROR', {
        message: error.message,
        stack: error.stack,
      })
      return createErrorResponse(500, 'Internal Server Error', env)
    }
  },
}

/**
 * Validate incoming request
 * - Only GET and OPTIONS methods allowed (security best practice)
 * - Handles CORS preflight OPTIONS requests with 204 No Content
 * - Returns error response if validation fails, null if valid
 *
 * CORS Policy:
 * - All responses include CORS headers for web client compatibility
 * - Restricted to safe HTTP methods: GET (data fetching), OPTIONS (preflight)
 * - Allow-Origin: * (public API, no authentication required)
 */
function validateRequest(request, _url) {
  // Handle CORS preflight requests (OPTIONS)
  // Browser sends OPTIONS before actual request to check CORS policy
  if (request.method === 'OPTIONS') {
    const response = new Response(null, { status: 204 })
    addCorsHeaders(response)
    return response
  }

  // Only allow GET requests for data fetching
  if (request.method !== 'GET') {
    const response = new Response(null, {
      status: 405,
      statusText: 'Method Not Allowed',
    })
    addCorsHeaders(response)
    return response
  }

  return null
}

/**
 * Create deterministic cache key
 * Includes path and normalized query parameters (allowlist)
 * Cache key does NOT include origin domain (proxy always uses same origin)
 */
function createCacheKey(originBaseUrl, url) {
  if (!originBaseUrl) {
    throw new Error('ORIGIN_BASE_URL is not defined')
  }

  const normalizedParams = normalizeParams(url.searchParams)
  const cacheKeyUrl = `${originBaseUrl}${url.pathname}${normalizedParams ? '?' + normalizedParams : ''}`

  // Validate the cache key URL
  try {
    new URL(cacheKeyUrl)
    // eslint-disable-next-line no-unused-vars
  } catch (_err) {
    throw new Error(`Invalid cache key URL: ${cacheKeyUrl}`)
  }

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
 * Metrolinx API uses query parameter 'key' for authentication
 * Throws AbortError on timeout, Error on other failures
 */
async function fetchOrigin(url, env, _ctx) {
  if (!env.ORIGIN_BASE_URL || !env.ORIGIN_AUTH_TOKEN) {
    throw new Error('Missing required environment variables: ORIGIN_BASE_URL or ORIGIN_AUTH_TOKEN')
  }

  const controller = new AbortController()
  const timeoutMs = parseInt(env.ORIGIN_TIMEOUT_MS) || 3000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    // Construct origin URL carefully to avoid double slashes
    // ORIGIN_BASE_URL is: https://api.openmetrolinx.com/OpenDataAPI/
    // url.pathname is: /api/V1/ServiceataGlance/Trains/All
    // We want: https://api.openmetrolinx.com/OpenDataAPI/api/V1/...

    let baseUrl = env.ORIGIN_BASE_URL
    let pathName = url.pathname

    // Remove trailing slash from base
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1)
    }

    // Remove leading slash from path if it exists
    if (pathName.startsWith('/')) {
      pathName = pathName.slice(1)
    }

    const fullUrl = `${baseUrl}/${pathName}${url.search}`

    // Add authentication key to query params
    const originUrlObj = new URL(fullUrl)
    originUrlObj.searchParams.set('key', env.ORIGIN_AUTH_TOKEN)
    const originUrl = originUrlObj.toString()

    const response = await fetch(originUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'TRMNL-GO-Transit-Proxy/1.0',
      },
      signal: controller.signal,
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
 * Add CORS (Cross-Origin Resource Sharing) headers to response
 *
 * Purpose:
 * - Enables web browsers to make requests from any origin (domain)
 * - Required for web clients (React, Vue, etc.) to call the Worker API directly
 * - Without CORS headers, browsers block cross-origin requests (security policy)
 *
 * CORS Headers Explained:
 * - Access-Control-Allow-Origin: '*'
 *   Allows requests from any domain (public API, no authentication)
 *
 * - Access-Control-Allow-Methods: 'GET, OPTIONS'
 *   Restricts to safe HTTP methods only (GET for data, OPTIONS for preflight)
 *   Prevents modification operations (POST, PUT, DELETE, PATCH)
 *
 * - Access-Control-Allow-Headers: 'Content-Type'
 *   Allows client to specify Content-Type header in requests
 *
 * - Access-Control-Max-Age: '86400' (24 hours)
 *   Browsers cache preflight response for 24h to reduce OPTIONS requests
 *
 * Applied to ALL responses:
 * - Successful responses (2xx)
 * - Error responses (4xx, 5xx)
 * - Cached responses (HIT, MISS, STALE)
 * - Preflight OPTIONS requests (204 No Content)
 * - Health check endpoint
 *
 * Security Considerations:
 * - Allow-Origin: * is safe because this is a public, read-only API
 * - No credentials (cookies, auth tokens) are sent with requests
 * - Methods restricted to GET and OPTIONS only (no data modification)
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
  const response = new Response(
    JSON.stringify({
      error: statusText,
      status: status,
      timestamp: new Date().toISOString(),
    }),
    {
      status: status,
      statusText: statusText,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  addCorsHeaders(response)

  if (env.ENABLE_OBSERVABILITY_HEADERS !== 'false') {
    response.headers.set('X-Cache', 'ERROR')
    response.headers.set('X-Proxy-Version', '1.0')
  }

  return response
}

export default worker

/**
 * Log event for monitoring and debugging
 * Format: [TIMESTAMP] [LEVEL] [EVENT] - {context}
 * In production, logs are sent to Cloudflare Logpush → Axiom
 *
 * Logging Destinations:
 * - Development: console.log() → Cloudflare Worker dashboard logs
 * - Staging/Production: Cloudflare Logpush → Axiom (primary) + S3 (backup)
 *
 * Event Types and Levels:
 * - ERROR level: ORIGIN_ERROR, ORIGIN_TIMEOUT, ORIGIN_FETCH_ERROR, WORKER_ERROR
 * - WARN level: STALE_FALLBACK, CACHE_ERROR_RESPONSE
 * - INFO level: CACHE_MISS, ORIGIN_FETCH_SUCCESS, CACHE_MISS_STORED
 */
function logEvent(env, eventType, context = {}) {
  const logLevel = env.LOG_LEVEL || 'info'

  // Determine event level based on event type
  let eventLevel
  let levelName

  if (eventType.includes('ERROR')) {
    eventLevel = 3 // error
    levelName = 'ERROR'
  } else if (eventType.includes('TIMEOUT') || eventType.includes('STALE_FALLBACK')) {
    eventLevel = 2 // warn
    levelName = 'WARN'
  } else {
    eventLevel = 1 // info
    levelName = 'INFO'
  }

  // Only log at appropriate level
  const levels = { debug: 0, info: 1, warn: 2, error: 3 }
  const currentLevel = levels[logLevel] || 1

  if (eventLevel < currentLevel) {
    return
  }

  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] [${levelName}] [${eventType}] - ${JSON.stringify(context)}`

  if (eventLevel >= 3) {
    console.error(message)
  } else if (eventLevel >= 2) {
    console.warn(message)
  } else {
    console.log(message)
  }
}
