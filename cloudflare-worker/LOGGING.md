# Logging & Observability

This document describes the logging and observability features of the TRMNL GO Transit Proxy API.

## Overview

The proxy implements comprehensive logging and observability headers to monitor cache performance, origin health, and errors. All logs follow a structured format for easy parsing and analysis.

## Observability Headers

All responses include the following headers for monitoring and debugging:

| Header             | Values                          | Description                          |
| ------------------ | ------------------------------- | ------------------------------------ |
| `X-Cache`          | `HIT`, `MISS`, `STALE`, `ERROR` | Cache status of the response         |
| `X-Proxy-Version`  | `1.0`                           | Proxy implementation version         |
| `X-Proxy-Time-Ms`  | `{milliseconds}`                | Origin fetch duration (only on MISS) |
| `CF-Cache-Status`  | Various                         | Cloudflare automatic cache status    |
| `Access-Control-*` | Various                         | CORS headers for web clients         |

### Cache Status Values

- **HIT**: Response served from cache (fast path)
- **MISS**: Response fetched from origin and cached
- **STALE**: Response served from expired cache due to origin error/timeout
- **ERROR**: Error response (4xx/5xx)

## Log Format

All logs follow a consistent structured format:

```
[TIMESTAMP] [LEVEL] [EVENT] - {context}
```

### Components

- **TIMESTAMP**: ISO 8601 format (e.g., `2026-01-24T09:30:45.123Z`)
- **LEVEL**: Log severity (`INFO`, `WARN`, `ERROR`)
- **EVENT**: Event type identifier (see Event Types below)
- **context**: JSON object with event-specific details

### Example Logs

```
[2026-01-24T09:30:45.123Z] [INFO] [CACHE_MISS] - {"path":"/api/V1/ServiceataGlance/Trains/All?station_id=1234"}
[2026-01-24T09:30:45.234Z] [INFO] [ORIGIN_FETCH_SUCCESS] - {"status":200,"time_ms":98,"path":"/api/V1/ServiceataGlance/Trains/All"}
[2026-01-24T09:30:45.345Z] [ERROR] [ORIGIN_TIMEOUT] - {"timeout_ms":3000,"path":"/api/V1/ServiceataGlance/Trains/All"}
[2026-01-24T09:30:45.456Z] [WARN] [STALE_FALLBACK] - {"path":"/api/V1/ServiceataGlance/Trains/All","age_seconds":120,"reason":"timeout"}
[2026-01-24T09:31:12.789Z] [ERROR] [ORIGIN_ERROR] - {"status":502,"origin":"https://api.openmetrolinx.com/OpenDataAPI/","path":"/api/V1/ServiceataGlance/Trains/All"}
```

## Event Types

### INFO Level Events

| Event                  | Description                                | Context Fields              |
| ---------------------- | ------------------------------------------ | --------------------------- |
| `CACHE_MISS`           | Cache miss occurred, origin fetch required | `path`                      |
| `ORIGIN_FETCH_SUCCESS` | Successful origin response                 | `status`, `time_ms`, `path` |
| `CACHE_MISS_STORED`    | Response cached successfully               | `status`, `path`            |

### WARN Level Events

| Event                  | Description                               | Context Fields                  |
| ---------------------- | ----------------------------------------- | ------------------------------- |
| `STALE_FALLBACK`       | Returning stale cache due to origin issue | `path`, `age_seconds`, `reason` |
| `CACHE_ERROR_RESPONSE` | Caching error response with short TTL     | `path`, `status`, `ttl_seconds` |

### ERROR Level Events

| Event                | Description                         | Context Fields             |
| -------------------- | ----------------------------------- | -------------------------- |
| `ORIGIN_TIMEOUT`     | Origin request exceeded timeout     | `timeout_ms`, `path`       |
| `ORIGIN_ERROR`       | Origin returned 5xx error           | `status`, `origin`, `path` |
| `ORIGIN_FETCH_ERROR` | Origin fetch failed (network/other) | `error`, `path`            |
| `WORKER_ERROR`       | Unexpected worker error             | `message`, `stack`         |

## Logging Destinations

### Development

- **Method**: `console.log()`, `console.warn()`, `console.error()`
- **Destination**: Cloudflare Worker dashboard logs (real-time)
- **Access**: Cloudflare Dashboard → Workers → Your Worker → Logs
- **Retention**: ~1 hour (ephemeral)

### Staging

- **Primary**: Cloudflare Logpush → AWS S3
- **Purpose**: Cost-effective log archival for testing
- **Retention**: 30 days (configurable)
- **Setup**: Cloudflare Dashboard → Logs → Logpush

### Production

- **Primary**: Cloudflare Logpush → Axiom
  - Real-time log streaming
  - Advanced query and analytics
  - APM dashboards
  - Alerting capabilities
- **Secondary**: Cloudflare Logpush → AWS S3
  - Long-term retention (90+ days)
  - Backup and compliance
  - Cost-effective storage

- **Optional**: PagerDuty alerts for critical errors
  - Trigger on 5xx error rate spikes
  - Setup separately via Axiom or Cloudflare Workers

## Configuration

### Environment Variables

| Variable                       | Default       | Description                                         |
| ------------------------------ | ------------- | --------------------------------------------------- |
| `LOG_LEVEL`                    | `info`        | Minimum log level: `debug`, `info`, `warn`, `error` |
| `ENVIRONMENT`                  | `development` | Environment name (included in logs)                 |
| `ENABLE_OBSERVABILITY_HEADERS` | `true`        | Enable/disable observability headers                |

### Log Level Filtering

Logs are filtered based on the `LOG_LEVEL` environment variable:

- `debug`: All logs (most verbose)
- `info`: INFO, WARN, ERROR logs
- `warn`: WARN, ERROR logs only
- `error`: ERROR logs only

**Recommended Settings:**

- Development: `debug` or `info`
- Staging: `info`
- Production: `warn` or `error`

## Monitoring Metrics

### Key Performance Indicators (KPIs)

1. **Cache Hit Ratio**
   - Formula: `HIT / (HIT + MISS) * 100%`
   - Target: > 90% in steady state
   - Low ratio indicates cache issues or high traffic variance

2. **Origin Fetch Duration**
   - Metric: `X-Proxy-Time-Ms` header
   - Target: P95 < 3000ms (timeout threshold)
   - High duration indicates origin performance issues

3. **Stale Fallback Rate**
   - Formula: `STALE_FALLBACK / total_requests * 100%`
   - Target: < 1% in normal conditions
   - High rate indicates origin reliability issues

4. **Error Rate**
   - Formula: `(ORIGIN_ERROR + ORIGIN_TIMEOUT) / total_requests * 100%`
   - Target: < 0.1%
   - Spikes indicate origin outages

### Alert Thresholds

**Recommended PagerDuty alerts:**

- Origin error rate > 5% for 5 minutes
- Cache miss rate > 50% for 10 minutes (cache invalidation?)
- Stale fallback rate > 10% for 5 minutes (origin degraded)

## Setup Instructions

### Cloudflare Logpush to Axiom

1. **Create Axiom Dataset**

   ```bash
   # In Axiom dashboard
   # Create new dataset: "trmnl-go-transit-logs"
   ```

2. **Configure Logpush**

   ```bash
   # Via Cloudflare API or Dashboard
   # Destination: Axiom
   # Dataset: trmnl-go-transit-logs
   # Fields: All worker fields
   ```

3. **Create Axiom Monitors**
   - Origin error rate alert
   - Cache miss rate alert
   - Response time percentile dashboard

### Cloudflare Logpush to S3

1. **Create S3 Bucket**

   ```bash
   aws s3 mb s3://trmnl-go-transit-logs
   ```

2. **Configure Logpush**

   ```bash
   # Via Cloudflare Dashboard → Logs → Logpush
   # Destination: AWS S3
   # Bucket: trmnl-go-transit-logs
   # Path: logs/{DATE}/
   ```

3. **Setup Lifecycle Policy**
   ```json
   {
     "Rules": [
       {
         "Id": "DeleteOldLogs",
         "Status": "Enabled",
         "ExpirationInDays": 90
       }
     ]
   }
   ```

## Troubleshooting

### Common Issues

**High Cache Miss Rate**

- Check if query parameters are being properly normalized
- Verify cache TTL configuration
- Look for cache purges or invalidations

**Frequent Stale Fallbacks**

- Origin experiencing high latency or errors
- Check `ORIGIN_TIMEOUT_MS` configuration
- Review origin service health

**Missing Observability Headers**

- Verify `ENABLE_OBSERVABILITY_HEADERS` is not set to `false`
- Check CORS configuration isn't stripping headers
- Confirm response isn't from Cloudflare automatic cache

### Viewing Logs

**Local Development**

```bash
# Real-time logs
wrangler tail

# Specific environment
wrangler tail --env production
```

**Production (via Axiom)**

```
# Query examples
_time > ago(1h) | where event == "ORIGIN_ERROR"
_time > ago(24h) | summarize count() by event
_time > ago(1h) | where level == "ERROR" | sort by _time desc
```

## References

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Logpush](https://developers.cloudflare.com/logs/logpush/)
- [Axiom Documentation](https://axiom.co/docs)
- [PROXY_API_SERVER.md](../project-resources/docs/PROXY_API_SERVER.md) - Section 9: Observability
- [PROXY_API_SERVER_PRD.md](../project-resources/docs/PROXY_API_SERVER_PRD.md) - Section 7: Observability & Debugging
