# Product Requirements Document (PRD)

## Cloudflare Proxy Cache Service

### Document Version

v1.0

### Owner

TBD

### Stakeholders

* Platform / Backend Engineering
* Client Application Teams
* DevOps / SRE

---

## 1. Overview

### 1.1 Purpose

Build a **high-performance proxy API service** running on **Cloudflare Workers** that forwards requests to an origin API while providing **edge caching**, **request normalization**, and **resilience features** (timeouts, fallback, safety limits).

The service is intended to:

* Reduce origin load
* Improve latency
* Provide consistent caching behavior
* Act as a secure gateway to internal or third-party APIs

---

## 2. Goals & Non-Goals

### 2.1 Goals

* Edge-cached proxy with predictable behavior
* Explicit and controllable cache logic
* Safe defaults (timeouts, size limits)
* Extensible design for future features
* Low operational overhead (no servers)

### 2.2 Non-Goals

* Full API gateway replacement
* User-specific caching
* Real-time streaming responses
* Heavy request transformation (beyond normalization)

---

## 3. High-Level Architecture

```
Client
  ↓
Cloudflare Worker
  - Request validation
  - Cache key normalization
  - Edge cache lookup
  - Origin fetch
  - Response caching
  ↓
Cloudflare Edge Cache
  ↓
Origin API (internal or third-party)
```

---

## 4. Functional Requirements

### 4.1 Request Handling

* Accept HTTP `GET` requests (initial scope)
* Forward requests to a configured origin base URL
* Preserve allowed query parameters
* Strip tracking or irrelevant query parameters
* Reject unsupported methods with `405 Method Not Allowed`

---

### 4.2 Cache Behavior

#### 4.2.1 Cache Location

* Use **Cloudflare Cache API (`caches.default`)**
* Do NOT rely on implicit Cloudflare caching

#### 4.2.2 Cache Key Rules

* Cache key must include:

  * Path
  * Normalized query parameters
* Cache key must exclude:

  * Tracking parameters (e.g., `utm_*`)
  * Random or session parameters
* Query parameters must be:

  * Allow-listed
  * Sorted deterministically

#### 4.2.3 Cache Headers

Responses must include:

```
Cache-Control:
  public,
  max-age=<browser_ttl>,
  s-maxage=<edge_ttl>,
  stale-while-revalidate=<swr_ttl>
```

Default values:

* `max-age`: 60 seconds
* `s-maxage`: 300 seconds
* `stale-while-revalidate`: 30 seconds

---

### 4.3 Cache Read / Write Flow

1. Normalize request
2. Attempt cache lookup
3. If cache HIT → return cached response
4. If cache MISS:

   * Fetch from origin
   * Validate response
   * Store in cache asynchronously
   * Return response

---

### 4.4 Origin Fetching

* Origin base URL configured via environment variable
* Attach required authentication headers (e.g. API token)
* Apply request timeout (default: 3 seconds)
* Abort request on timeout
* Do not retry origin requests within the same execution

---

### 4.5 Error Handling

| Scenario           | Behavior                                    |
| ------------------ | ------------------------------------------- |
| Origin timeout     | Return `504 Gateway Timeout`                |
| Origin 5xx         | Return cached response if available (stale) |
| Invalid request    | `400 Bad Request`                           |
| Unsupported method | `405 Method Not Allowed`                    |

Optional:

* Cache error responses for a short TTL (e.g. 10s)

---

### 4.6 Safety & Limits

* Max request size: 5MB
* Max response size: configurable (default 5MB)
* Enforced execution timeout (Cloudflare Worker limits)
* Reject non-HTTP(S) origins

---

## 5. Non-Functional Requirements

### 5.1 Performance

* Median TTFB < 50ms on cache HIT
* P95 origin fetch latency < 3s

### 5.2 Availability

* No single point of failure
* Origin outages should degrade gracefully using stale cache

### 5.3 Scalability

* Must handle burst traffic without origin amplification
* Cache should absorb traffic spikes

---

## 6. Configuration

### 6.1 Environment Variables

| Name                | Description            |
| ------------------- | ---------------------- |
| `ORIGIN_BASE_URL`   | Base URL of origin API |
| `ORIGIN_AUTH_TOKEN` | Authentication token   |
| `EDGE_TTL`          | Edge cache TTL         |
| `BROWSER_TTL`       | Browser cache TTL      |
| `ORIGIN_TIMEOUT_MS` | Origin fetch timeout   |

---

## 7. Observability & Debugging

### 7.1 Response Headers

Include debug headers:

* `CF-Cache-Status`
* `X-Cache: HIT | MISS | STALE`
* `X-Proxy-Version`

### 7.2 Logging

* Log cache misses
* Log origin timeouts
* Log error responses (status ≥ 500)

---

## 8. Security Considerations

* No client-provided Authorization headers forwarded by default
* Only allow outbound requests to configured origin
* Avoid caching personalized or authenticated data
* Validate incoming request size

---

## 9. Extensibility (Future Scope)

* Cache tagging & selective purge
* Per-route TTL configuration
* Support for POST with cache keys
* Rate limiting
* KV-based cache versioning
* Canary rollout support

---

## 10. Acceptance Criteria

* Cache HIT ratio measurable via headers
* Deterministic cache keys verified
* Origin not called on cache HIT
* Timeout behavior validated
* Cache invalidation strategy documented

---

## 11. Open Questions

* Which query parameters should be allow-listed?
* Do we need regional cache bypass?
* Should error responses be cached?

---

## 12. Appendix

### Reference Technologies

* Cloudflare Workers
* Cloudflare Cache API
* Cloudflare Cache Rules (not Page Rules)

---
