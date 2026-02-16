# External Public API Integration Guide

**Purpose**: Document the GO Transit External Public API discovery, capabilities, and recommendations for integration.

**Status**: Reverse-engineered, working, but undocumented  
**Last Updated**: February 5, 2026

---

## Discovery

The external public API was discovered while reverse-engineering network requests from the official GO Transit website (www.gotransit.com). When users search for "Schedule" between two stations, the website calls:

```
https://api.metrolinx.com/external/go/schedules/en/timetable/all?fromStop=OS&toStop=UN&date=2026-02-05
```

This endpoint is:
- ✅ Public (no authentication)
- ✅ Undocumented
- ✅ Used by the official website
- ❓ Not guaranteed to remain stable

---

## Why This API Exists

Metrolinx likely operates two separate APIs for different purposes:

1. **Metrolinx Open Data API** (`api.openmetrolinx.com`)
   - Official, authenticated API
   - Real-time transit data
   - Real-time predictions and alerts
   - For third-party developers and agencies
   - Requires API key registration

2. **External Public API** (`api.metrolinx.com/external/`)
   - Serves www.gotransit.com website
   - Scheduled journey planning
   - Public, no auth needed
   - Powers the official journey planner
   - Undocumented (never meant to be reversed)

---

## Two-API Architecture

### Current Plugin Uses
- **Open Data API** (Authenticated)
- Real-time departures from a single station
- Perfect for "arriving/next/later" dashboard

```
TRMNL Device → Settings (Proxy URL) → Cloudflare Worker → Open Data API → Dashboard
              Real-time predictions
```

### Could Add
- **External Public API** (Public)
- Complete daily schedule between two stations
- Perfect for "journey planner" plugin

```
Journey Planner Widget → No Auth Needed → External Public API → List all options
                         Direct fetch possible (CORS enabled)
```

---

## Integration Patterns

### Pattern 1: Keep Current Approach (Recommended)
**Continue using Metrolinx Open Data API via proxy**

```javascript
// Current - Real-time dashboard
const dashboardUrl = `https://gta-go-transit.gohk.xyz/api/V1/Stop/NextService/${station}`;
const dashboard = await fetch(dashboardUrl);
```

**Pros**:
- Official, documented API
- Real-time data with delays
- Authenticated, reliable
- Already working in production

**Cons**:
- Requires API key management
- Only shows next 3 departures
- No complete schedule view

### Pattern 2: Add External API for Future Features
**Use external public API for journey planner feature**

```javascript
// New feature - Journey planner
const journeyUrl = `https://api.metrolinx.com/external/go/schedules/en/timetable/all?fromStop=${from}&toStop=${to}&date=${date}`;
const journey = await fetch(journeyUrl);
```

**Pros**:
- No authentication needed
- Complete daily schedule
- Full itineraries with stops
- Powerful journey planning capabilities

**Cons**:
- Undocumented, reverse-engineered
- Could break without notice
- No real-time delays
- Larger response size
- Not officially supported

### Pattern 3: Use Proxied External API (NEW - February 2026)
**Use Cloudflare Worker proxy for external public API**

```javascript
// Station departures via proxy (no auth required, but with caching benefits)
const departuresUrl = `https://gta-go-transit.gohk.xyz/api/V1/external/departures/${station}`;
const departures = await fetch(departuresUrl);
```

**Pros**:
- No authentication needed (public API)
- Intelligent edge caching (60s/300s/30s SWR)
- Consistent proxy infrastructure
- CORS handled by worker
- Monitoring and observability headers
- Real-time departures with full itineraries
- Perfect for departure boards

**Cons**:
- Undocumented source API (could change)
- Depends on proxy availability
- Limited to departures endpoint currently

**Use Cases**:
- Union Station departure boards
- Multi-line station displays
- Alternative to authenticated API for public stations

### Pattern 4: Hybrid Approach
**Combine both APIs for rich functionality**

```javascript
// Real-time status + available options
const current = await fetch(`https://api.openmetrolinx.com/.../Stop/NextService/${station}`);
const allTrips = await fetch(`https://api.metrolinx.com/external/go/...?from=${from}&to=${to}&date=${date}`);

// Show "Next 3" from real-time API (small bandwidth)
// Show "See all options" link to journey planner (large bandwidth, on demand)
```

---

## Risks & Mitigation

### Risk 1: API Endpoint Changes
**Risk**: Metrolinx could change the URL structure or shut down the public endpoint  
**Probability**: Medium (it's undocumented)  
**Mitigation**:
- Wrap in try-catch
- Gracefully degrade if unavailable
- Keep fallback to Open Data API
- Monitor for changes in CI

```javascript
try {
  const schedule = await fetch(publicApiUrl);
  if (!schedule.ok) throw new Error('API unavailable');
  return parseSchedule(schedule);
} catch (error) {
  console.warn('Public API unavailable, using fallback');
  return fallbackOpenDataAPI();
}
```

### Risk 2: Rate Limiting Introduced
**Risk**: Metrolinx adds rate limits that weren't documented  
**Probability**: Low (public endpoint, no auth)  
**Mitigation**:
- Implement request caching (24h for schedules)
- Add exponential backoff retry logic
- Monitor response headers for rate limit indicators

### Risk 3: Data Format Changes
**Risk**: API changes JSON structure without notice  
**Probability**: Low (used by official website)  
**Mitigation**:
- Validate response schema
- Handle missing fields gracefully
- Add version detection if possible

### Risk 4: Service Disruptions
**Risk**: API downtime affects functionality  
**Probability**: Medium (all external services risk)  
**Mitigation**:
- Fall back to cached schedules
- Show "data as of" timestamp
- Recommend Open Data API as primary method

---

## Caching Strategy

### Real-Time API (Open Data)
```
Browser Cache: 60 seconds (data changes frequently)
Edge Cache: 300 seconds (Cloudflare)
Max-Age: 60s
SWR: 30s stale-while-revalidate
```

### Scheduled API (External Public)
```
Browser Cache: 24 hours (schedules don't change during day)
Edge Cache: 24 hours
Max-Age: 86400s (1 day)
Validate: Regenerate daily at midnight
```

---

## Recommendations

### ✅ For Immediate Use
1. **Keep current approach**: Use Open Data API via proxy for real-time dashboard
2. **Do not use external API yet**: It's undocumented and could break
3. **Monitor the endpoint**: Track if it changes or becomes unavailable

### 📋 For Future Enhancement
1. **Consider external API** for a separate "Journey Planner" plugin
2. **Implement graceful fallback**: If external API fails, recommend Open Data API
3. **Use as read-only supplement**: Enhance, don't replace, the official API
4. **Document assumptions**: Clearly note that it's reverse-engineered

### 🔒 For Production Use
1. **Prefer Open Data API**: Always use the documented, authenticated API for production
2. **Use external API only for**: Non-critical features, with robust error handling
3. **Get official API access**: Contact Metrolinx if you need undocumented endpoints
4. **Plan for deprecation**: Assume external API could disappear anytime

---

## Legal & Ethical Considerations

⚠️ **This is a reverse-engineered API**

**Considerations**:
- The endpoint is public and has CORS enabled (used by www.gotransit.com)
- No explicit ToS violation (it's public HTTP)
- But it's undocumented, so use at your own risk
- Metrolinx could:
  - Change the endpoint
  - Add rate limiting
  - Add authentication
  - Shut it down entirely

**Recommendation**: If this becomes critical for your project, contact Metrolinx:
- Request official API documentation
- Ask for rate limit guarantees
- Get support commitment
- Sign proper agreement

---

## Testing

Sample response provided: `sample-response/Timetable-OS-UN-2026-02-05.json`

### Unit Tests
```javascript
describe('External Journey Planner', () => {
  const sampleResponse = require('./sample-response/Timetable-OS-UN-2026-02-05.json');
  
  it('should parse journey response', () => {
    const trips = parseJourneys(sampleResponse);
    expect(trips).toHaveLength(28);
  });
  
  it('should extract times correctly', () => {
    const first = sampleResponse.trips[0];
    expect(first.departureTimeDisplay).toBe('04:00');
    expect(first.arrivalTimeDisplay).toBe('05:00');
  });
});
```

### Integration Tests
```javascript
describe('External API Health', () => {
  it('should fetch live data successfully', async () => {
    const response = await fetch(externalApiUrl);
    expect(response.status).toBe(200);
  });
  
  it('should return valid journey data', async () => {
    const data = await fetchJourneys('OS', 'UN', today);
    expect(data.trips).toBeDefined();
    expect(data.trips.length).toBeGreaterThan(0);
  });
});
```

---

## Migration Path

If external API becomes critical:

1. **Phase 1** (Current): Use only Open Data API
2. **Phase 2** (Enhancement): Add external API as supplement
3. **Phase 3** (If deprecated): Switch to official alternative
4. **Phase 4** (If unavailable): Implement fallback cache system

---

## References

- **API Documentation**: [README.md](README.md)
- **Sample Responses**: `sample-response/`
- **Comparison with Open Data API**: `../../docs/API_COMPARISON.md`
- **API Access Guide**: `../../docs/API_ACCESS_GUIDE.md`
- **Official Metrolinx API**: `../API-access/`
- **Official GO Transit**: https://www.gotransit.com/

---

## Contact & Updates

**Discovery**: 2026-02-05  
**Last Tested**: 2026-02-05  
**Status**: Working ✅

For updates or issues:
1. Check if endpoint structure changed
2. Verify response format hasn't shifted
3. Test in isolation from main application
4. Monitor Metrolinx announcements for API changes

