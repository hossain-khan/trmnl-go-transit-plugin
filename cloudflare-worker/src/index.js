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
import { LINES_AND_STATIONS } from './stations.js'

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
 * Get all GO Transit lines
 * Used for xhrSelect in plugin configuration
 *
 * Handles both GET and POST requests
 * Returns: [{ "Lakeshore East": "LE" }, { "Stouffville": "ST" }, ...]
 */
const linesHandler = (c) => {
  const lines = Object.entries(LINES_AND_STATIONS).map(([code, data]) => ({
    [data.name]: code,
  }))
  return c.json(lines, 200)
}

app.get('/api/V1/lines', linesHandler)
app.post('/api/V1/lines', linesHandler)

/**
 * Get stations for a specific GO Transit line
 * Used for xhrSelect dependent dropdown in plugin configuration
 *
 * Handles both GET and POST requests (xhrSelect sends POST by default)
 * Example: GET /api/V1/stations-by-line/LE
 * Returns: [{ "Union Station": "UN" }, { "Exhibition GO": "EX" }, ...]
 */
const stationsHandler = (c) => {
  // Get line code from URL parameter (for GET requests)
  let lineCode = c.req.param('line_code')

  // If not in URL, try to get from POST body (xhrSelect sends it as sibling setting)
  if (!lineCode && c.req.method === 'POST') {
    // For POST requests, check the request body for the line value
    // This is a fallback in case URL interpolation doesn't work
    try {
      // The body might contain settings_custom_fields_values_line
      // For now, we'll just use the URL param approach
    } catch {
      // Ignore parse errors
    }
  }

  // Normalize and validate
  if (!lineCode || lineCode === 'undefined') {
    return c.json(
      {
        error: 'Line code is required',
        message: 'Please select a line first',
        available_lines: Object.keys(LINES_AND_STATIONS),
      },
      400
    )
  }

  lineCode = lineCode.toUpperCase()

  // Check if line exists
  if (!LINES_AND_STATIONS[lineCode]) {
    return c.json(
      {
        error: 'Line not found',
        available_lines: Object.keys(LINES_AND_STATIONS),
      },
      404
    )
  }

  // Return stations for this line
  const stations = LINES_AND_STATIONS[lineCode].stations
  return c.json(stations, 200)
}

app.get('/api/V1/stations-by-line/:line_code', stationsHandler)
app.post('/api/V1/stations-by-line/:line_code', stationsHandler)

// Catch-all for empty line code (e.g., when ##{{line}} is not yet interpolated)
app.get('/api/V1/stations-by-line/', (c) => {
  return c.json(
    {
      error: 'Line code is required',
      message: 'Please select a line first',
      available_lines: Object.keys(LINES_AND_STATIONS),
    },
    400
  )
})

app.post('/api/V1/stations-by-line/', (c) => {
  return c.json(
    {
      error: 'Line code is required',
      message: 'Please select a line first',
      available_lines: Object.keys(LINES_AND_STATIONS),
    },
    400
  )
})

/**
 * Format time string based on user preference
 */
const formatTime = (dateString, format) => {
  const date = new Date(dateString)
  if (format === '24h') {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  } else {
    // 12h format
    let hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    return `${hours}:${minutes} ${ampm}`
  }
}

/**
 * Dashboard endpoint - Returns all data needed for template rendering
 *
 * Combines ServiceataGlance/Trains/All, ServiceUpdate/ServiceAlert/All,
 * and Stop/All to provide a complete dataset for the GO Transit Dashboard
 *
 * Query Parameters:
 * - line: GO Transit line code (e.g., "LE")
 * - station: Origin station code (e.g., "OS")
 * - time_format: "12h" or "24h"
 * - show_alerts: "true" or "false"
 * - departures: Number of departures to show (2 or 3)
 *
 * Example: /api/V1/dashboard?line=LE&station=OS&time_format=12h&show_alerts=true&departures=3
 */
app.get('/api/V1/dashboard', async (c) => {
  try {
    const line = c.req.query('line')?.toUpperCase()
    const station = c.req.query('station')?.toUpperCase()
    const timeFormat = c.req.query('time_format') || '12h'
    const showAlerts = c.req.query('show_alerts') !== 'false'
    const departuresCount = parseInt(c.req.query('departures') || '3')

    // Validate parameters
    if (!line) {
      return c.json({ error: 'Missing required parameter: line' }, 400)
    }
    if (!station) {
      return c.json({ error: 'Missing required parameter: station' }, 400)
    }

    // Check if line and station exist
    if (!LINES_AND_STATIONS[line]) {
      return c.json({ error: 'Invalid line code', status: 404 }, 404)
    }

    const stationData = LINES_AND_STATIONS[line].stations.find(
      (s) => Object.values(s)[0] === station
    )
    if (!stationData) {
      return c.json({ error: 'Station not found for this line', status: 404 }, 404)
    }

    const stationName = Object.keys(stationData)[0]
    const lineName = LINES_AND_STATIONS[line].name
    const allStations = LINES_AND_STATIONS[line].stations.map((s) => Object.keys(s)[0])
    const stationPosition = allStations.findIndex((s) => s === stationName) + 1

    // Fetch data from Metrolinx APIs via proxy
    const env = c.env
    const authKey = env.ORIGIN_AUTH_TOKEN

    // Fetch stop/next service to get predictions for this station on this line
    const nextServiceUrl = `${env.ORIGIN_BASE_URL}api/V1/Stop/NextService/${station}.json?key=${authKey}`
    const nextServiceResponse = await fetch(nextServiceUrl)
    const nextServiceData = await nextServiceResponse.json()

    // Fetch alerts
    const alertsUrl = `${env.ORIGIN_BASE_URL}api/V1/ServiceUpdate/ServiceAlert/All.json?key=${authKey}`
    const alertsResponse = await fetch(alertsUrl)
    const alertsData = await alertsResponse.json()

    // Filter next service data for this line
    const lineServices =
      nextServiceData?.NextService?.Lines?.filter((service) => service.LineCode === line) || []

    // Separate by direction (to Union vs from Union)
    const toUnion = lineServices.filter((s) => s.DirectionCode.includes('UN'))
    const fromUnion = lineServices.filter((s) => !s.DirectionCode.includes('UN'))

    // Sort by trip order
    toUnion.sort((a, b) => a.TripOrder - b.TripOrder)
    fromUnion.sort((a, b) => a.TripOrder - b.TripOrder)

    // Extract arriving/next/later times
    const extractTimes = (services, count) => {
      const times = {
        arriving: 'No service',
        arriving_status: 'On Time',
        next: 'No service',
        next_status: 'On Time',
      }

      if (count > 2) {
        times.later = 'No service'
        times.later_status = 'On Time'
      }

      if (services.length > 0) {
        times.arriving = formatTime(services[0].ComputedDepartureTime, timeFormat)
        times.arriving_status = services[0].DepartureStatus === 'D' ? 'Delayed' : 'On Time'
      }

      if (services.length > 1) {
        times.next = formatTime(services[1].ComputedDepartureTime, timeFormat)
        times.next_status = services[1].DepartureStatus === 'D' ? 'Delayed' : 'On Time'
      }

      if (count > 2 && services.length > 2) {
        times.later = formatTime(services[2].ComputedDepartureTime, timeFormat)
        times.later_status = services[2].DepartureStatus === 'D' ? 'Delayed' : 'On Time'
      }

      return times
    }

    // Extract alerts for this line
    let alertText = ''
    let hasAlerts = false
    if (showAlerts && alertsData?.ServiceAlerts?.Alert) {
      const alerts = Array.isArray(alertsData.ServiceAlerts.Alert)
        ? alertsData.ServiceAlerts.Alert
        : [alertsData.ServiceAlerts.Alert]

      const lineAlerts = alerts.filter((a) => a.LineCode === line)
      if (lineAlerts.length > 0) {
        alertText =
          lineAlerts
            .map((a) => a.AlertMessage)
            .join(' | ')
            .substring(0, 200) + (lineAlerts.length > 1 ? '...' : '')
        hasAlerts = true
      }
    }

    const dashboardData = {
      station: stationName,
      line_name: lineName,
      line_code: line,
      station_position: stationPosition,
      total_stations: allStations.length,
      stations: allStations,
      direction_1: {
        label: 'To Union Station',
        ...extractTimes(toUnion, departuresCount),
      },
      direction_2: {
        label: `To ${stationName}`,
        ...extractTimes(fromUnion, departuresCount),
      },
      alerts: alertText || 'No active alerts',
      has_alerts: hasAlerts,
      updated_at: new Date().toISOString(),
      time_format: timeFormat,
      departures_count: departuresCount,
    }

    return c.json(dashboardData, 200)
  } catch (error) {
    console.error('[Dashboard] Error:', error.message)
    return c.json(
      {
        error: 'Dashboard Error',
        details: error.message,
      },
      500
    )
  }
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
