# PLUGIN FEASIBILITY ASSESSMENT: External Public APIs vs Current Architecture

**Date**: February 5, 2026  
**Assessment Scope**: Can the discovered external public APIs replace or supplement the current Cloudflare Worker proxy for the GO Transit Dashboard plugin?  
**Conclusions**: ⚠️ **Partial Feasibility** - External APIs can handle some features but have critical gaps for core functionality

---

## Executive Summary

| Aspect | Verdict | Details |
|--------|---------|---------|
| **Real-time Departures** | ❌ Not Feasible | External APIs lack `/Stop/NextService` equivalent |
| **Service Alerts** | ✅ Feasible | Service Updates General/All available and working |
| **Fare Information** | ✅ Feasible | Fare Calculator API available |
| **Journey Planning** | ⚠️ Limited | Timetable API provides schedules, not predictions |
| **Overall Plugin** | ⚠️ Partial | Can supplement, cannot replace Cloudflare Worker proxy |

---

## 1. Plugin Requirements Analysis

### 1.1 Core Data Needs

The GO Transit Dashboard plugin requires the following data to render its layouts:

```liquid
{
  "station": "Oshawa GO",                    // Station name
  "line_name": "Lakeshore East",             // Line name
  "line_code": "LE",                         // Line code
  
  "direction_1": {
    "label": "To Union Station",             // Text direction
    "arriving": "9:34 PM",                   // ⚡ REAL-TIME
    "arriving_status": "On Time",            // ⚡ REAL-TIME
    "next": "9:44 PM",                       // ⚡ REAL-TIME
    "next_status": "On Time",                // ⚡ REAL-TIME
    "later": "10:14 PM",                     // ⚡ REAL-TIME
    "later_status": "On Time"                // ⚡ REAL-TIME
  },
  
  "direction_2": {
    "label": "To Oshawa",
    "arriving": "9:42 PM",                   // ⚡ REAL-TIME
    "arriving_status": "On Time",            // ⚡ REAL-TIME
    "next": "10:12 PM",                      // ⚡ REAL-TIME (may be Delayed)
    "next_status": "Delayed",                // ⚡ REAL-TIME status
    "later": "10:42 PM",                     // ⚡ REAL-TIME
    "later_status": "On Time"                // ⚡ REAL-TIME
  },
  
  "alerts": "Starting Dec 22, maintenance...", // Service alerts (optional)
  "has_alerts": true,                          // Whether to show alerts section
  "station_position": 1,                       // Current position in route (1-8)
  "total_stations": 8                          // For route visualization
}
```

### 1.2 Critical Features

| Feature | Importance | Requirement |
|---------|-----------|------------|
| **Real-time Departures** | 🔴 Critical | Must have actual predicted times, not scheduled times |
| **Status Updates** | 🟠 High | Must show "On Time", "Delayed", "Cancelled" |
| **Service Alerts** | 🟢 Medium | Optional but important for commuter experience |
| **Fare Information** | 🟢 Medium | Could be display-only feature, not core to departures dashboard |
| **Two Directions** | 🟡 Important | Must distinguish "To Union" vs "From Union" |
| **Multiple Departures** | 🟡 Important | Must show 3 upcoming trips (arriving, next, later) |

---

## 2. External Public APIs Capability Matrix

### 2.1 Timetable API (`/schedules/en/timetable/all`)

**Status**: ✅ Available | **Data Size**: ~73 KB | **Response Time**: ~500ms

```
Endpoint:  POST https://api.metrolinx.com/external/go/schedules/en/timetable/all
Parameters: fromStop=OS, toStop=UN, date=2026-02-05
Sample Data: 28 journeys from Oshawa to Union Station
```

| Capability | Available? | Details |
|-----------|-----------|---------|
| Trip times | ✅ Yes | Scheduled departure/arrival times |
| **Real-time predictions** | ❌ **NO** | Only scheduled times, not live predictions |
| Status (On Time/Delayed) | ❌ **NO** | Scheduled times don't include status |
| Line information | ✅ Yes | Route code, type (Bus/Rail) |
| Stop details | ✅ Yes | All stops on the journey |
| Multiple journeys | ✅ Yes | Returns all available trips for the day |

**Assessment**: ❌ **Not Suitable for Core Feature**
- Provides *scheduled* times, not *predicted* times
- Predictions for "arriving", "next", "later" require real-time tracking
- No status information (Delayed, Cancelled, etc.)
- Example: Shows "9:34 PM" is the scheduled time, but actual REAL-TIME prediction might be "9:38 PM"

---

### 2.2 Fare Calculator API (`/farecalculator/all-concessions-fare`)

**Status**: ✅ Available | **Data Size**: ~2.5 KB | **Response Time**: ~200ms

```
Endpoint:  POST https://api.metrolinx.com/external/go/farecalculator/all-concessions-fare
Parameters: stations[0].fromStopCode=OS, stations[0].toStopCode=UN
Sample Data: 5 fare types (Full, Student, Senior, Child, Presto)
```

| Capability | Available? | Details |
|-----------|-----------|---------|
| Fare quotes | ✅ Yes | Full, Student, Senior, Child, Presto pricing |
| Discount percentages | ✅ Yes | Shows concession discounts |
| Validity info | ✅ Yes | When the fare is valid |
| Real-time | ✅ Yes | Current applicable fares |

**Assessment**: ✅ **Suitable for Supplementary Feature**
- Could add a "Fare Info" section to the dashboard
- Not required for core departures display
- Could be optional user-selectable feature

---

### 2.3 Service Updates General API (`/serviceupdate/en/general`)

**Status**: ✅ Available | **Data Size**: ~3.6 KB | **Response Time**: ~200ms

```
Endpoint:  GET https://api.metrolinx.com/external/go/serviceupdate/en/general
Sample Data: 1 general system-wide alert
```

| Capability | Available? | Details |
|-----------|-----------|---------|
| System-wide alerts | ✅ Yes | General service announcements |
| Alert text | ✅ Yes | HTML-formatted message body |
| Alert timestamp | ✅ Yes | When alert was posted |
| **Line-specific alerts** | ❌ **NO** | Only system-wide, not per-line |
| **Station-specific alerts** | ❌ **NO** | Only system-wide, not per-station |

**Assessment**: ⚠️ **Limited**
- Good for general announcements (e.g., "Union Station platform closure")
- Cannot replace `/ServiceUpdate/ServiceAlert/All` for comprehensive alerts
- Missing line and station-specific alerts that commuters need

---

### 2.4 Service Updates All API (`/serviceupdate/en/all`)

**Status**: ✅ Available | **Data Size**: ~18 KB | **Response Time**: ~300ms

```
Endpoint:  GET https://api.metrolinx.com/external/go/serviceupdate/en/all
Sample Data: 
  - 1 general alert
  - 23 line-specific updates (Lakeshore East trains, buses 94/96)
  - 14 station-specific updates (elevator outages, accessibility)
```

| Capability | Available? | Details |
|-----------|-----------|---------|
| System-wide alerts | ✅ Yes | General service announcements |
| **Line-specific alerts** | ✅ **Yes** | Route-specific delays, cancellations |
| **Station-specific alerts** | ✅ **Yes** | Elevator outages, accessibility issues |
| Alert text | ✅ Yes | HTML-formatted messages |
| Alert timestamp | ✅ Yes | Posted date/time |
| Service categories | ✅ Yes | Train/Bus subcategories |

**Assessment**: ✅ **Suitable for Alert Display**
- Much more comprehensive than `/general` endpoint
- Can filter for specific line (LE) or station (OS) alerts
- Matches what the Cloudflare worker calls: `/ServiceUpdate/ServiceAlert/All`
- Can replace the alerts functionality

---

## 3. Critical Gap Analysis

### 3.1 The Real-Time Prediction Gap

**Problem**: The external APIs lack the equivalent of the internal Metrolinx `/Stop/NextService/` endpoint.

#### What the Cloudflare Worker Currently Calls:

```javascript
// From cloudflare-worker/src/index.js
const nextServiceUrl = 
  `${env.ORIGIN_BASE_URL}api/V1/Stop/NextService/${station}.json?key=${authKey}`
```

**Returns**:
```json
{
  "NextService": {
    "Lines": [
      {
        "LineCode": "LE",
        "DirectionName": "To Union Station",
        "TripOrder": 1,
        "EstimatedTime": "2026-02-05T21:34:00",    // ⚡ REAL-TIME PREDICTION
        "Status": "On Time",                        // ⚡ REAL-TIME STATUS
        "Schedules": [...]
      },
      {
        "LineCode": "LE",
        "TripOrder": 2,
        "EstimatedTime": "2026-02-05T21:44:00",    // ⚡ NEXT DEPARTURE
        "Status": "On Time"
      },
      {
        "LineCode": "LE",
        "TripOrder": 3,
        "EstimatedTime": "2026-02-05T22:14:00",    // ⚡ LATER DEPARTURE
        "Status": "On Time"
      }
    ]
  }
}
```

#### What External Timetable API Provides:

```json
{
  "Trips": [
    {
      "TripNumber": "1001",
      "ScheduledDeparture": "21:34",              // ❌ SCHEDULED ONLY
      "ScheduledArrival": "22:05",                // ❌ NOT REAL-TIME
      "Type": "Rail",
      "Stops": [
        {
          "Code": "OS",
          "ScheduledArrival": "21:34",            // ❌ SCHEDULED
          "ScheduledDeparture": "21:34"
        }
      ]
    }
  ]
}
```

**Key Differences**:
| Aspect | Cloudflare Worker (Current) | External Timetable API |
|--------|--------|----------------------|
| **Predicted Time** | 21:34 (ETA with live data) | 21:34 (Static schedule) |
| **Real-time Status** | "On Time", "Delayed", "Cancelled" | N/A (no status) |
| **System Updated** | Every 30-60 seconds | Not applicable |
| **Accuracy** | ±1-2 minutes | Exact schedule only |

**Impact**: ❌ **Plugin Cannot Function Without Real-Time Data**

The plugin's entire value proposition is showing "arriving in 5 minutes" not "scheduled to depart at 9:34 PM". A commuter at the station needs to know "the train is arriving NOW" not "it's scheduled for this time."

---

### 3.2 API Availability Gaps

| Required Feature | Current Worker | External API |
|-----------------|----------------|-------------|
| Real-time predictions | ✅ `/Stop/NextService` | ❌ Not available |
| Line-specific alerts | ✅ `/ServiceUpdate/ServiceAlert/All` | ✅ `/serviceupdate/en/all` |
| Station info | ✅ Static stations.js | ✅ `/schedules` + `/all` |
| Fares | ❌ Not provided | ✅ `/farecalculator/all-concessions-fare` |
| Schedules (backup) | Could use internal | ✅ `/schedules/en/timetable/all` |

---

## 4. Current Architecture Analysis

### 4.1 Cloudflare Worker Proxy (Current)

```
TRMNL Device
    ↓ (HTTP Request)
Cloudflare Worker (gta-go-transit.gohk.xyz)
    ↓ (Proxy to internal API)
Metrolinx Internal API (requires auth key)
    ├─ /api/V1/Stop/NextService/{station}     ← Real-time predictions
    └─ /api/V1/ServiceUpdate/ServiceAlert/All ← Service alerts
    ↓
Cloudflare Cache (60s browser, 300s edge, 30s SWR)
    ↓ (HTTP Response)
TRMNL Device renders dashboard with real-time data
```

**Advantages**:
- ✅ Real-time predictions (core feature)
- ✅ Intelligent caching at edge
- ✅ Single cacheable endpoint (`/dashboard`)
- ✅ Privacy: API credentials hidden
- ✅ Works reliably with proven internal APIs

**Disadvantages**:
- ❌ Requires auth token (internal API)
- ❌ Requires infrastructure maintenance
- ❌ Depends on Cloudflare worker availability
- ❌ Auth token could expire/be revoked

---

### 4.2 Hypothetical External API Only (Not Feasible)

```
TRMNL Device
    ↓ (HTTP Requests)
Metrolinx External Public API Gateway
    ├─ /schedules/en/timetable/all           ← Scheduled times (not real-time!)
    ├─ /serviceupdate/en/all                 ← Alerts ✅
    └─ /farecalculator/all-concessions-fare  ← Fares (nice-to-have)
    ↓
TRMNL Device renders dashboard
```

**Advantages**:
- ✅ No auth required
- ✅ No infrastructure to maintain
- ✅ Completely public API
- ✅ Simple direct calls

**Disadvantages**:
- ❌ Cannot show real-time predictions (only schedules)
- ❌ Shows "departing at 9:34 PM" when it might depart at 9:38 PM
- ❌ No status updates (Delayed, Cancelled)
- ❌ Would need to guess which trip is "arriving" vs "next"
- ❌ Missing "arriving in X minutes" feature (core value)
- ❌ Poor user experience for commuters

---

## 5. Hybrid Architecture Proposal

### 5.1 Best-of-Both Approach

```
TRMNL Device
    ↓ (HTTP Request to)
Cloudflare Worker (gta-go-transit.gohk.xyz/api/V1/dashboard)
    ├─ Internal API: /Stop/NextService/{station}        ← Real-time (critical)
    │  └─ Returns: arriving, next, later with status
    │
    └─ External API: /serviceupdate/en/all              ← Alerts (comprehensive)
       └─ Returns: line + station specific alerts
```

**Benefits**:
- ✅ Uses external alert API when internal is unavailable
- ✅ Fallback: Shows schedules from external API if predictions fail
- ✅ Could add fares from external API as bonus feature
- ✅ Maintains real-time core functionality
- ✅ Improves reliability with multiple sources

**Implementation**:
```javascript
// In cloudflare-worker/src/index.js
const nextServiceData = await fetch(env.ORIGIN_BASE_URL + ...) // Primary
const alertsData = await fetch('https://api.metrolinx.com/external/go/serviceupdate/en/all') // External

// If primary fails, fallback to external timetable (degraded mode)
if (!nextServiceData.ok) {
  const timetableData = await fetch('https://api.metrolinx.com/external/go/schedules/en/timetable/all')
  // Use scheduled times as fallback (less accurate but better than nothing)
}
```

---

## 6. Risk & Reliability Assessment

### 6.1 Current Architecture Risks

| Risk | Likelihood | Severity | Mitigation |
|------|-----------|----------|-----------|
| Auth token expiration | Medium | High | Store in Cloudflare secret, refresh policy |
| Internal API deprecation | Low | Critical | Monitor Metrolinx documentation |
| Cloudflare worker downtime | Low | High | Monitoring, fallback to external APIs |
| Rate limiting | Low | High | Use Cache API, edge caching |

### 6.2 External API Only Risks

| Risk | Likelihood | Severity | Mitigation |
|------|-----------|----------|-----------|
| API structure change | High | Critical | **BLOCKER**: Would break core feature |
| No auth = no priority | High | Medium | Expect rate limiting, degradation |
| Public API deprecation | Medium | High | No API SLA promised |
| Real-time predictions unavailable | **Critical** | **Critical** | **Cannot mitigate**: Data doesn't exist |

---

## 7. Feasibility Assessment by Feature

### 7.1 Feature-by-Feature Breakdown

#### Core Feature: Real-Time Departures

| Component | External API | Feasibility |
|-----------|--------------|------------|
| Arriving time | ❌ Timetable (scheduled only) | ❌ **NOT FEASIBLE** |
| Next time | ❌ Timetable (scheduled only) | ❌ **NOT FEASIBLE** |
| Later time | ❌ Timetable (scheduled only) | ❌ **NOT FEASIBLE** |
| Status (On Time/Delayed) | ❌ Not provided | ❌ **NOT FEASIBLE** |

**Verdict**: ❌ **Cannot Replace Current System**

#### Supplementary Feature: Service Alerts

| Component | External API | Feasibility |
|-----------|--------------|------------|
| Line alerts | ✅ /serviceupdate/en/all | ✅ **FEASIBLE** |
| Station alerts | ✅ /serviceupdate/en/all | ✅ **FEASIBLE** |
| General alerts | ✅ /serviceupdate/en/all | ✅ **FEASIBLE** |
| Alert text | ✅ /serviceupdate/en/all | ✅ **FEASIBLE** |

**Verdict**: ✅ **Can Supplement or Replace** (currently calls `/ServiceUpdate/ServiceAlert/All`)

#### Optional Feature: Fare Information

| Component | External API | Feasibility |
|-----------|--------------|------------|
| Fare quotes | ✅ /farecalculator/all-concessions-fare | ✅ **FEASIBLE** |
| Discount info | ✅ /farecalculator/all-concessions-fare | ✅ **FEASIBLE** |

**Verdict**: ✅ **Can Add as Optional Widget**

#### Reference Feature: Scheduled Times (degraded mode)

| Component | External API | Feasibility |
|-----------|--------------|------------|
| Scheduled departure | ✅ /schedules/en/timetable/all | ⚠️ **POSSIBLE BUT LIMITED** |
| Trip details | ✅ /schedules/en/timetable/all | ✅ **FEASIBLE** |

**Verdict**: ⚠️ **Can Use as Fallback Only** (when real-time unavailable)

---

## 8. Code Changes Required

### 8.1 If Using External APIs as Primary (Not Recommended)

**Changes Required**: ~300+ lines

```javascript
// Cloudflare Worker changes needed:

// 1. Remove internal API calls
- const nextServiceUrl = `${env.ORIGIN_BASE_URL}api/V1/Stop/NextService/...`

// 2. Add external API calls  
+ const timetableUrl = 'https://api.metrolinx.com/external/go/schedules/en/timetable/all'
+ const alertsUrl = 'https://api.metrolinx.com/external/go/serviceupdate/en/all'

// 3. Rewrite prediction logic (uses scheduled times instead of predicted)
- // Compare EstimatedTime with current timestamp
+ // Use ScheduledDeparture from timetable (less accurate)

// 4. Add status handling (external API doesn't provide, invent status?)
- status = nextServiceData.Status  // "On Time", "Delayed"
+ status = "Scheduled"               // Lost information

// 5. Update caching strategy
- 60s browser cache (real-time data)
+ 24h browser cache (schedules don't change)

// 6. Update templates (optional: show "Scheduled 9:34 PM" not "Arriving 9:34 PM")
```

### 8.2 If Using External APIs as Fallback (Recommended)

**Changes Required**: ~50-100 lines

```javascript
// Add fallback logic to existing worker:

const nextServiceData = await fetch(primaryUrl).catch(() => null)

if (nextServiceData?.ok) {
  // Use existing real-time logic
  useRealTimePredictions(nextServiceData)
} else {
  // Fallback to external timetable
  const timetable = await fetch('https://api.metrolinx.com/external/go/schedules/...')
  useScheduledTimes(timetable) // Degraded mode
}

// External alerts could replace internal:
- const alertsUrl = `${env.ORIGIN_BASE_URL}api/V1/ServiceUpdate/ServiceAlert/All`
+ const alertsUrl = 'https://api.metrolinx.com/external/go/serviceupdate/en/all'
```

---

## 9. Recommendations

### 9.1 Primary Recommendation: Keep Current Architecture + Enhance with External APIs

**Decision**: ✅ **MAINTAIN Cloudflare Worker Proxy for Real-Time Departures**

**Rationale**:
1. Real-time predictions are the core value proposition
2. External API lacks `/Stop/NextService` equivalent
3. Current system is reliable and proven
4. Auth token dependency is manageable

**Enhancement Options** (Low Risk, High Value):

1. **Replace Alerts API** (Low Risk, ✅ Do This)
   - Use external `/serviceupdate/en/all` instead of internal
   - More comprehensive alerts (line + station specific)
   - Reduces server load slightly

2. **Add Fares Feature** (Optional, ✅ Consider This)
   - Use external `/farecalculator/all-concessions-fare`
   - Add optional "Fare Info" card to dashboard
   - No impact on core departures feature

3. **Add Fallback Logic** (Optional, ✅ Consider This)
   - If real-time API fails, show scheduled times from external API
   - Better than showing "No service" error
   - Degraded but still useful

4. **Add Monitoring** (Important, ✅ Do This Soon)
   - Monitor external API availability
   - Alert if external sources become unavailable
   - Helps plan for API migrations

---

### 9.2 If You Must Use Only External APIs (Not Recommended)

**If**: Auth tokens are revoked or internal API is unavailable

**Then**: Implement fallback with clear limitations:

```html
<!-- Warning indicator for degraded mode -->
<div class="alert alert-warning">
  ⚠️ Showing scheduled times, not live predictions.
  Data may be up to 24 hours old.
</div>

<!-- Or just use scheduled times silently -->
<span class="value">Departing 9:34 PM</span> <!-- Not "Arriving" -->
```

**Expected User Impact**:
- Commuters see scheduled times, not live predictions
- Cannot determine if train is delayed or coming soon
- Significantly reduced utility for real-time commuting
- Users will complain: "I came to the station and the train wasn't there!"

---

## 10. Implementation Roadmap

### Phase 1: No Changes (Current State)
- **Status**: ✅ Working
- **Keep**: Cloudflare worker with real-time predictions
- **Keep**: Internal API auth token strategy

### Phase 2: Enhanced (Recommended, 1-2 weeks)
- **Add**: External alerts API integration
- **Reason**: More comprehensive, replaces internal `/ServiceAlert/All`
- **Effort**: ~50 lines of code
- **Benefit**: Better alerts for users

### Phase 3: Optional (3-4 weeks)
- **Add**: Fares feature from external API
- **Add**: Graceful fallback to scheduled times
- **Add**: API monitoring and health checks
- **Effort**: ~200 lines of code
- **Benefit**: Better reliability and user experience

### Phase 4: Long-term (If Internal API Goes Away)
- **Evaluate**: Alternatives for real-time predictions
  - Metrolinx GTFS-RT feed (if published)
  - Other transit data sources
  - Direct station data (if available)
- **Effort**: Major rewrite
- **Benefit**: Independence from internal API

---

## 11. Conclusion

| Question | Answer | Confidence |
|----------|--------|-----------|
| **Can external APIs replace the current system?** | ❌ No | 95% |
| **Can external APIs supplement the current system?** | ✅ Yes | 98% |
| **Should we migrate entirely to external APIs?** | ❌ No | 99% |
| **Should we use external APIs for alerts instead of internal?** | ✅ Yes | 90% |
| **Should we add fares from external API?** | ✅ Maybe | 70% |

### Bottom Line

**The external public APIs are useful for:**
- ✅ Service alerts (more comprehensive than internal)
- ✅ Fares information (new feature potential)
- ✅ Fallback when internal API unavailable
- ✅ Journey planning (advanced feature)

**The external public APIs cannot provide:**
- ❌ Real-time departure predictions (core feature)
- ❌ Live status updates (Delayed/On Time)
- ❌ "Arriving in X minutes" accuracy

**Recommendation**: Keep the Cloudflare Worker proxy for real-time predictions, but integrate external APIs for alerts and optional features. This gives you the best of both worlds: reliable real-time data for commuters, comprehensive alerts, and optional fare information.

---

## Appendix: API Comparison Table

| Capability | Internal `/Stop/NextService` | External `/schedules/timetable` | External `/serviceupdate/all` |
|-----------|------|------|------|
| Real-time predictions | ✅ EstimatedTime | ❌ ScheduledTime only | N/A |
| Status (On Time/Delayed) | ✅ Yes | ❌ No | ✅ (for alerts) |
| Multiple departures | ✅ Yes (arriving/next/later) | ✅ Yes (all daily trips) | N/A |
| Line info | ✅ Yes | ✅ Yes | ✅ Yes |
| Station info | ✅ Yes | ✅ Yes | ✅ Yes |
| Alert info | ❌ No | ❌ No | ✅ Yes (comprehensive) |
| Requires auth | ✅ Yes | ❌ No | ❌ No |
| Caching TTL | 60s (real-time) | 24h (static) | 1h (updates) |
| Reliability | High (internal) | Unknown (public) | Unknown (public) |
| Update frequency | 30-60s | 1x daily | ~hourly |
| Data freshness | 1-2 min lag | Exact schedule | Posted at change |

