# Cloudflare Worker - GO Transit Proxy API

This is the Cloudflare Workers implementation of the GO Transit proxy API service. It provides intelligent caching, timeout handling, and resilience features for the Metrolinx Open Data API.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (free tier works)
- Metrolinx API key (obtain from [GO Transit Open Data Portal](https://www.gotransit.com/en/open-data))

### Setup

1. **Install Wrangler CLI** (Cloudflare's development tool)

```bash
npm install -g @cloudflare/wrangler
# or use npx wrangler if you prefer not to install globally
```

2. **Configure environment variables**

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your values
# IMPORTANT: Never commit .env to git!
nano .env
```

3. **Set API secrets** (for production/staging)

Secrets should not be stored in `.env` for security. Instead, use Wrangler's secret management:

```bash
# Development (read from .env file)
# No action needed - Wrangler will load from .env

# Staging
wrangler secret put ORIGIN_AUTH_TOKEN --env staging

# Production  
wrangler secret put ORIGIN_AUTH_TOKEN --env production
```

4. **Install dependencies**

```bash
npm install
```

5. **Start local development server**

```bash
wrangler dev
# Server will start on http://localhost:8787

# Test the Worker
curl "http://localhost:8787/api/V1/ServiceataGlance/Trains/All?station_id=OS"
```

## Project Structure

```
cloudflare-worker/
├── src/
│   ├── index.js           # Main Worker entry point
│   └── [future modules]   # Cache, transform, API integration
├── wrangler.toml          # Cloudflare Worker configuration
├── package.json           # npm dependencies
├── .env.example           # Environment variables template
├── .env                   # Local environment (NOT in git)
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## Configuration

### Environment Variables

See `.env.example` for all available variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `ORIGIN_BASE_URL` | Metrolinx API base URL | `https://api.openmetrolinx.com/OpenDataAPI/` |
| `ORIGIN_AUTH_TOKEN` | Metrolinx API key | Required |
| `ORIGIN_TIMEOUT_MS` | Origin fetch timeout | `3000` |
| `EDGE_TTL` | Cloudflare cache TTL | `300` |
| `BROWSER_TTL` | Client-side cache TTL | `60` |
| `LOG_LEVEL` | Logging verbosity | `info` |

### wrangler.toml

The `wrangler.toml` file contains:
- Worker name and main entry point
- Environment configurations (dev, staging, prod)
- Build settings
- Future bindings (KV, D1, etc.)

## Development Workflow

### Local Development

```bash
# Start dev server with hot reload
wrangler dev

# In another terminal, test the API
curl -i "http://localhost:8787/api/V1/ServiceataGlance/Trains/All?station_id=OS&key=YOUR_KEY"
```

### Testing

```bash
# Run tests (configure in package.json)
npm test

# Check code with linter
npm run lint

# Format code
npm run format
```

### Deployment

```bash
# Deploy to staging
wrangler deploy --env staging

# Deploy to production
wrangler deploy --env production

# Check deployment status
wrangler status
```

## API Endpoints

The Worker proxies requests to the Metrolinx API. All requests must include query parameters:

### Example Request

```bash
curl "https://your-worker.workers.dev/api/V1/ServiceataGlance/Trains/All?station_id=OS"
```

### Supported Endpoints

See [METROLINX_API.md](../../project-resources/docs/METROLINX_API.md) for full API documentation.

**Key endpoints:**
- `/api/V1/ServiceataGlance/Trains/All` - Real-time train departures
- `/api/V1/ServiceUpdate/ServiceAlert/All` - Service alerts
- `/api/V1/Stop/NextService/{StopCode}` - Predictions for a specific stop

### Query Parameters

Only allowlisted parameters are included in cache keys:
- `station_id` - GO Transit stop ID
- `limit` - Maximum results
- `direction` - Inbound/outbound filter

Other parameters (like tracking `utm_*`) are stripped for security.

## Monitoring & Observability

### Response Headers

The Worker adds observability headers to all responses:

```
X-Cache: HIT | MISS | STALE | ERROR
X-Proxy-Version: 1.0
X-Proxy-Time-Ms: 123  (origin fetch latency)
CF-Cache-Status: HIT | MISS | EXPIRED | etc.
```

### Logging

Development logs go to stdout via `console.log()`:

```bash
# View logs while running wrangler dev
[2026-01-23T14:30:45Z] [development] [ORIGIN_FETCH] - {"status":200,"time_ms":542,"path":"/api/V1/ServiceataGlance/Trains/All"}
```

Production logs are sent to Cloudflare Logpush. See the deployment issue for setup.

### Testing Cache

```bash
# First request (cache MISS)
curl -i "http://localhost:8787/api/..." | grep X-Cache
# X-Cache: MISS

# Second request (cache HIT)
curl -i "http://localhost:8787/api/..." | grep X-Cache
# X-Cache: HIT
```

## Troubleshooting

### `Error: ORIGIN_AUTH_TOKEN is not defined`

**Solution**: Make sure `.env` file exists and contains `ORIGIN_AUTH_TOKEN`:

```bash
cp .env.example .env
nano .env  # Add your API key
```

### `504 Gateway Timeout`

**Causes**:
- Origin API is unreachable
- Timeout is too short (default 3s)
- Network issues

**Solutions**:
- Check `ORIGIN_BASE_URL` is correct
- Verify API key is valid
- Increase `ORIGIN_TIMEOUT_MS` temporarily
- Check Metrolinx API status

### Cache not working (always MISS)

**Causes**:
- Cache-Control headers not set
- Query parameters not normalized
- Different parameters create different cache keys

**Solutions**:
- Check `EDGE_TTL` and `BROWSER_TTL` env vars
- Verify parameter allowlist includes your params
- Test with same URL twice: `?station_id=OS` should HIT on second request

### CORS errors in browser

**Solution**: The Worker includes CORS headers by default. If you still get CORS errors:

```bash
# Check response headers
curl -i "http://localhost:8787/api/..." | grep -i access-control
```

Should see:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
```

## Performance Targets

Based on PROXY_API_SERVER_PRD.md:

| Metric | Target | Acceptable |
|--------|--------|-----------|
| Median TTFB (cache HIT) | < 50ms | < 100ms |
| P95 origin fetch | < 3s | < 5s |
| Cache hit ratio | > 85% | > 75% |

## Security

**Never commit sensitive data:**

```bash
# Make sure these are in .gitignore
.env
.env.*.local
node_modules/
dist/
```

**API key protection:**
- Use `wrangler secret put` for production keys
- Rotate keys regularly
- Monitor API usage in Metrolinx dashboard

## Related Documentation

- [PROXY_API_SERVER.md](../../project-resources/docs/PROXY_API_SERVER.md) - Code examples and best practices
- [PROXY_API_SERVER_PRD.md](../../project-resources/docs/PROXY_API_SERVER_PRD.md) - Detailed requirements
- [METROLINX_API.md](../../project-resources/docs/METROLINX_API.md) - API endpoint docs
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)

## Next Steps

1. ✅ [Issue #3] Setup: Initialize project (YOU ARE HERE)
2. [ ] [Issue #4] Implement core Worker proxy logic
3. [ ] [Issue #5] Implement timeout & error handling
4. [ ] [Issue #6] Implement CORS support
5. [ ] [Issue #7] Implement logging & observability
6. [ ] [Issue #8-10] API integration
7. [ ] [Issue #11] Testing & validation
8. [ ] [Issue #12] Production deployment

See [GITHUB_ISSUES_CREATED.md](../../project-resources/docs/GITHUB_ISSUES_CREATED.md) for the full roadmap.
