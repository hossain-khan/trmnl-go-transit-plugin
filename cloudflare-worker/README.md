# Cloudflare Worker - GO Transit Proxy API

This is the Cloudflare Workers implementation of the GO Transit proxy API service. It provides intelligent caching, timeout handling, and resilience features for the Metrolinx Open Data API.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (free tier works)
- Metrolinx API key (obtain from [Metrolinx Developer Portal](http://api.openmetrolinx.com/OpenDataAPI/Help/Registration/Register))

### Setup

1. **Install Wrangler CLI** (Cloudflare's development tool)

```bash
npm install -g wrangler
# or use npx wrangler if you prefer not to install globally
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure secrets** (for production)

```bash
# Set API key secret in Cloudflare
wrangler secret put ORIGIN_AUTH_TOKEN
# When prompted, paste your Metrolinx API key

# Verify deployment configuration
wrangler deploy --dry-run
```

4. **Deploy**

```bash
npm run deploy
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

| Variable            | Purpose                | Default                                      |
| ------------------- | ---------------------- | -------------------------------------------- |
| `ORIGIN_BASE_URL`   | Metrolinx API base URL | `https://api.openmetrolinx.com/OpenDataAPI/` |
| `ORIGIN_AUTH_TOKEN` | Metrolinx API key      | Required                                     |
| `ORIGIN_TIMEOUT_MS` | Origin fetch timeout   | `3000`                                       |
| `EDGE_TTL`          | Cloudflare cache TTL   | `300`                                        |
| `BROWSER_TTL`       | Client-side cache TTL  | `60`                                         |
| `LOG_LEVEL`         | Logging verbosity      | `info`                                       |

### wrangler.toml

The `wrangler.toml` file contains:

- Worker name and main entry point
- Environment configurations (dev, staging, prod)
- Build settings
- Future bindings (KV, D1, etc.)

## Development Workflow

### Local Development

⚠️ **IMPORTANT**: Do NOT use `wrangler dev` (local development server) for testing the proxy. The local wrangler dev environment has limitations with external HTTPS requests and may return `502 Bad Gateway` errors even when the origin API is working correctly.

**Recommended workflow:**

1. **Make code changes** to `src/index.js`
2. **Run quality checks locally**:
   ```bash
   npm run quality  # Runs Prettier + ESLint
   ```
3. **Deploy directly to production**:
   ```bash
   npm run deploy   # Deploys to Cloudflare
   ```
4. **Test from production URL**:

   ```bash
   # Health check
   curl https://trmnl-go-transit-proxy.hk-c91.workers.dev/health

   # Real API test
   curl "https://trmnl-go-transit-proxy.hk-c91.workers.dev/api/V1/ServiceataGlance/Trains/All?station_id=OS"
   ```

**Why not local dev server?**

- `wrangler dev` on some systems cannot make external HTTPS requests to the Metrolinx API
- Returns internal `502 "internal error"` that don't reflect real issues
- Cloudflare production environment handles fetch requests correctly
- Production testing gives accurate results for both functionality and performance

**Why this is safe:**

- Cloudflare Workers deploys are instant (typically <2 seconds)
- Can roll back or fix issues immediately
- No risk to existing users - new code deploys atomically
- All CI checks run before code reaches main branch
- Easy to verify each change works in real environment

### Testing

⚠️ **Note**: Local testing with `wrangler dev` is not recommended (see Development Workflow above).

**Production testing:**

```bash
# Test after deployment
curl -i "https://trmnl-go-transit-proxy.hk-c91.workers.dev/health"
curl -i "https://trmnl-go-transit-proxy.hk-c91.workers.dev/api/V1/ServiceataGlance/Trains/All?station_id=OS"
```

**Pre-deployment checks:**

```bash
# Check code with linter
npm run lint

# Format code
npm run format

# Run all quality checks
npm run quality

# Dry-run deployment (validate config)
npx wrangler publish --dry-run
```

### Deployment

**Automated Deployment (Recommended):**

The repository has CI/CD configured via GitHub Actions (`.github/workflows/ci.yml`):

- Automatic deployment on push to `main` branch
- Quality checks (Prettier, ESLint) run before deployment
- Validates `wrangler.toml` configuration

**Manual Deployment:**

```bash
# Deploy to production
npm run deploy
# or
wrangler deploy

# Check deployment status
wrangler deployments list
```

**First-time Setup:**

```bash
# Authenticate with Cloudflare
wrangler login

# Set production secrets (API key)
wrangler secret put ORIGIN_AUTH_TOKEN

# Verify configuration
wrangler deploy --dry-run
```

## API Endpoints

The Worker proxies requests to the Metrolinx API. The worker automatically adds your API key from environment variables.

### Example Requests

```bash
# Service at a glance (train departures)
curl "https://trmnl-go-transit-proxy.hk-c91.workers.dev/api/V1/ServiceataGlance/Trains/All?station_id=OS"

# Service alerts
curl "https://trmnl-go-transit-proxy.hk-c91.workers.dev/api/V1/ServiceUpdate/ServiceAlert/All"

# Health check
curl "https://trmnl-go-transit-proxy.hk-c91.workers.dev/health"
```

**Note**: The API key is automatically added by the Worker from the `ORIGIN_AUTH_TOKEN` environment variable. Client requests do not need to include the key.

### Supported Endpoints

See [METROLINX_API.md](../project-resources/docs/METROLINX_API.md) for full API documentation.

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

- Cache-Control headers not set properly
- Query parameters not normalized
- Different request variations create different cache keys

**Solutions**:

- Check `EDGE_TTL` and `BROWSER_TTL` env vars are set
- Verify requests use same URL format: `?station_id=OS` should HIT on second request
- Check cache headers in response: `X-Cache: HIT` or `MISS`
- Note: First request to any URL will always be MISS

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

| Metric                  | Target | Acceptable |
| ----------------------- | ------ | ---------- |
| Median TTFB (cache HIT) | < 50ms | < 100ms    |
| P95 origin fetch        | < 3s   | < 5s       |
| Cache hit ratio         | > 85%  | > 75%      |

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

- [Main README](../README.md) - Plugin overview and installation
- [PROXY_API_SERVER_PRD.md](../project-resources/docs/PROXY_API_SERVER_PRD.md) - Detailed requirements
- [METROLINX_API.md](../project-resources/docs/METROLINX_API.md) - API endpoint docs
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)

## Status

✅ **Production Ready** - The Cloudflare Worker proxy is fully implemented and deployed.

**Implemented Features:**

- ✅ API proxying with Hono framework
- ✅ Intelligent caching with Cache API
- ✅ CORS support for all origins
- ✅ Comprehensive error handling
- ✅ Request logging and debugging
- ✅ Environment-based configuration
- ✅ CI/CD via GitHub Actions
- ✅ Production deployment
