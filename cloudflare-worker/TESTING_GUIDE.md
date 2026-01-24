# Testing Guide for Timeout & Error Handling

This document describes how to test the timeout and error handling features with stale fallback.

## Test Scenarios

### 1. Timeout Returns 504 When No Stale Cache

**Setup:**

- Clear cache
- Mock origin to take >3s to respond

**Expected Result:**

- Worker returns 504 Gateway Timeout
- Log shows: `ORIGIN_TIMEOUT: Exceeded 3000ms`
- No X-Cache: STALE header

**How to Test:**

```bash
# Deploy to Cloudflare Workers
npm run deploy:staging

# Call API and verify response
curl -v https://your-worker.workers.dev/api/V1/ServiceataGlance/Trains/All?station_id=1234

# Check logs
npm run tail
```

---

### 2. Timeout Returns Stale Response When Available

**Setup:**

1. First request: Normal response (caches data)
2. Wait for cache to become stale (after TTL expires)
3. Mock origin to take >3s to respond
4. Second request: Should return stale cache

**Expected Result:**

- Worker returns cached response (200 OK)
- Log shows: `ORIGIN_TIMEOUT: Exceeded 3000ms`
- Log shows: `STALE_FALLBACK: Returning stale cache for /path (timeout)`
- Response has header: `X-Cache: STALE`

**How to Test:**

```bash
# 1. Make first request (caches response)
curl https://your-worker.workers.dev/api/V1/ServiceataGlance/Trains/All?station_id=1234

# 2. Wait for stale-while-revalidate window (30s)
sleep 35

# 3. Trigger timeout (by modifying origin URL to invalid endpoint temporarily)
# Edit wrangler.toml: ORIGIN_BASE_URL = "https://invalid-url.com/"
npm run deploy:staging

# 4. Make second request - should return stale cache
curl -v https://your-worker.workers.dev/api/V1/ServiceataGlance/Trains/All?station_id=1234

# 5. Check for X-Cache: STALE header
# 6. Check logs for STALE_FALLBACK message
npm run tail
```

---

### 3. 5xx Errors Return Stale Response When Available

**Setup:**

1. First request: Normal response (caches data)
2. Mock origin to return 500 error
3. Second request: Should return stale cache

**Expected Result:**

- Worker returns cached response (200 OK)
- Log shows: `ORIGIN_ERROR: 500 from https://api.openmetrolinx.com/OpenDataAPI/`
- Log shows: `STALE_FALLBACK: Returning stale cache for /path (origin 5xx)`
- Response has header: `X-Cache: STALE`

**How to Test:**

```bash
# 1. Make first request (caches response)
curl https://your-worker.workers.dev/api/V1/ServiceataGlance/Trains/All?station_id=1234

# 2. Modify origin to trigger 5xx (use invalid API key)
# Edit wrangler.toml: ORIGIN_AUTH_TOKEN = "invalid_key"
npm run deploy:staging

# 3. Make second request - should return stale cache
curl -v https://your-worker.workers.dev/api/V1/ServiceataGlance/Trains/All?station_id=1234

# 4. Check for X-Cache: STALE header
# 5. Check logs for ORIGIN_ERROR and STALE_FALLBACK
npm run tail
```

---

### 4. 5xx Errors Cached for 10 Seconds When No Stale Cache

**Setup:**

- Clear cache
- Mock origin to return 500 error

**Expected Result:**

- Worker returns 500 error
- Log shows: `ORIGIN_ERROR: 500 from https://api.openmetrolinx.com/OpenDataAPI/`
- Log shows: `Caching 5xx error response for /path with 10s TTL`
- Response has header: `Cache-Control: public, max-age=10, s-maxage=10`
- Response has header: `X-Cache: MISS`

**How to Test:**

```bash
# 1. Clear cache (deploy new version)
# 2. Use invalid API key to trigger 5xx
# Edit wrangler.toml: ORIGIN_AUTH_TOKEN = "invalid_key"
npm run deploy:staging

# 3. Make request - should get 5xx with caching
curl -v https://your-worker.workers.dev/api/V1/ServiceataGlance/Trains/All?station_id=1234

# 4. Check Cache-Control header
# 5. Make second request within 10s - should get cached 5xx (X-Cache: HIT)
curl -v https://your-worker.workers.dev/api/V1/ServiceataGlance/Trains/All?station_id=1234

# 6. Check logs
npm run tail
```

---

### 5. 4xx Errors Not Cached

**Setup:**

- Mock origin to return 400 error

**Expected Result:**

- Worker returns 400 error
- Response has header: `Cache-Control: no-store`
- No caching occurs
- Subsequent requests also return 400 (not cached)

**How to Test:**

```bash
# 1. Send invalid request (e.g., missing required params)
curl -v https://your-worker.workers.dev/api/V1/ServiceataGlance/Trains/All

# 2. Check Cache-Control: no-store
# 3. Make second request - should NOT be cached
curl -v https://your-worker.workers.dev/api/V1/ServiceataGlance/Trains/All

# 4. Both should have X-Cache: MISS (not cached)
```

---

## Logging Verification

Check logs for these exact formats:

### Timeout Log Format

```
ORIGIN_TIMEOUT: Exceeded 3000ms
```

### Origin Error Log Format

```
ORIGIN_ERROR: 500 from https://api.openmetrolinx.com/OpenDataAPI/
```

### Stale Fallback Log Format

```
STALE_FALLBACK: Returning stale cache for /api/V1/ServiceataGlance/Trains/All (timeout)
STALE_FALLBACK: Returning stale cache for /api/V1/ServiceataGlance/Trains/All (origin 5xx)
```

---

## Observability Headers

Check for these response headers:

- `X-Cache`: `HIT` | `MISS` | `STALE` | `ERROR`
- `X-Proxy-Version`: `1.0`
- `X-Proxy-Time-Ms`: Origin fetch duration
- `Cache-Control`: Varies by status code
  - 2xx: `public, max-age=60, s-maxage=300, stale-while-revalidate=30`
  - 4xx: `no-store`
  - 5xx: `public, max-age=10, s-maxage=10`

---

## Local Testing Notes

**⚠️ Warning**: Local testing with `wrangler dev` has limitations:

- HTTPS fetch may fail with "internal error" (Miniflare limitation)
- Stale cache behavior may not work correctly locally
- Timeout behavior may differ from production

**Recommendation**: Deploy to Cloudflare staging environment for accurate testing.

---

## Automated Testing (Future)

For automated testing, consider:

- **Vitest** with `@cloudflare/workers-types`
- **Miniflare** mocks for Cache API
- **MSW (Mock Service Worker)** for origin mocking
- **Playwright** for end-to-end tests

Example test structure:

```javascript
import { describe, it, expect, vi } from 'vitest'
import worker from './src/index.js'

describe('Timeout handling', () => {
  it('should return stale cache on timeout', async () => {
    // Mock cache.match to return stale response
    // Mock fetch to timeout
    // Assert response is stale
  })
})
```
