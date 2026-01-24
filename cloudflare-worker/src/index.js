/**
 * GO Transit Proxy API - Powered by Hono
 *
 * High-performance, edge-cached proxy for the Metrolinx Open Data API
 * Running on Cloudflare Workers with Hono framework
 *
 * Features:
 * - Intelligent caching with Cache API
 * - CORS support for web clients
 * - Comprehensive error handling
 * - Request logging and debugging
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors())

/**
 * Health check endpoint
 */
app.get('/health', (c) => {
  return c.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0',
    },
    200
  )
})

/**
 * Proxy all API requests to Metrolinx
 */
app.get('/api/V1/*', async (c) => {
  const env = c.env

  // Validate environment
  if (!env.ORIGIN_BASE_URL || !env.ORIGIN_AUTH_TOKEN) {
    console.error('[Proxy] Missing environment variables')
    return c.json({ error: 'Server Configuration Error', status: 500 }, 500)
  }

  try {
    // Get request path and query
    const path = c.req.path
    const searchParams = new URLSearchParams(c.req.query())

    // Add authentication key
    searchParams.set('key', env.ORIGIN_AUTH_TOKEN)

    // Construct origin URL
    const originUrl = `${env.ORIGIN_BASE_URL}${path}?${searchParams.toString()}`

    // Log with masked key for security
    const maskedUrl = originUrl.replace(/key=[^&]*/, 'key=***')
    console.log(`[Proxy] Request URL: ${maskedUrl}`)
    console.log(`[Proxy] Base URL: ${env.ORIGIN_BASE_URL}`)
    console.log(`[Proxy] Path: ${path}`)

    // Check cache
    const cache = caches.default
    const cacheKey = new Request(originUrl, { method: 'GET' })
    const cachedResponse = await cache.match(cacheKey)

    if (cachedResponse) {
      console.log(`[Proxy] Cache HIT: ${path}`)
      const response = new Response(cachedResponse.body, cachedResponse)
      response.headers.set('X-Cache', 'HIT')
      return response
    }

    console.log(`[Proxy] Cache MISS: ${path}`)

    // Fetch from origin
    const originStart = Date.now()
    const originResponse = await fetch(originUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'TRMNL-GO-Transit-Proxy/1.0',
      },
    })

    const originTime = Date.now() - originStart

    console.log(`[Proxy] Origin response: ${originResponse.status} (${originTime}ms)`)

    // Clone the response body immediately before doing anything else
    const responseClone = originResponse.clone()

    if (!originResponse.ok) {
      console.error(`[Proxy] Origin error: ${originResponse.status}`)
      return c.json(
        {
          error: 'Origin API Error',
          status: originResponse.status,
        },
        originResponse.status
      )
    }

    // Read the body as text to avoid body stream issues
    const bodyText = await responseClone.text()

    // Create new response with proper headers
    const headers = new Headers(responseClone.headers)
    headers.set('X-Cache', 'MISS')
    headers.set('X-Proxy-Version', '1.0')
    headers.set('X-Proxy-Time-Ms', originTime.toString())
    headers.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=30')

    // Return the response with the text body
    const finalResponse = new Response(bodyText, {
      status: responseClone.status,
      statusText: responseClone.statusText,
      headers: headers,
    })

    // Cache the response in background (using original fetch response for cache)
    c.executionCtx.waitUntil(cache.put(cacheKey, finalResponse.clone()))

    return finalResponse
  } catch (error) {
    console.error('[Proxy] Error:', error.message)
    return c.json(
      {
        error: 'Proxy Error',
        details: error.message,
      },
      502
    )
  }
})

/**
 * 404 handler
 */
app.notFound((c) => {
  return c.json({ error: 'Not Found', status: 404 }, 404)
})

/**
 * Error handler
 */
app.onError((err, c) => {
  console.error('[Error]', err)
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  )
})

export default app
