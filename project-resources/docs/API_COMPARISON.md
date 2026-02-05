# API Comparison Report: Metrolinx Open Data vs. Public Schedule API

**Date**: February 5, 2026  
**Author**: Technical Analysis  
**Status**: Complete

---

## Executive Summary

The GO Transit plugin currently uses the **Metrolinx Open Data API**, which provides real-time predictions for departures at a specific station. A newer **GO Transit Public Schedule API** was discovered that provides scheduled timetables between origin and destination stops.

**Key Finding**: These are fundamentally different APIs serving different use cases. The current API is better suited for the plugin's real-time display needs.

---

## 1. Endpoint Comparison

### Current API (Metrolinx Open Data)

| Aspect | Details |
|--------|---------|
| **Base URL** | `https://api.openmetrolinx.com/OpenDataAPI/` |
| **Endpoint** | `/api/V1/Stop/NextService/{StopCode}.json` |
| **Full URL Example** | `https://api.openmetrolinx.com/OpenDataAPI/api/V1/Stop/NextService/OS.json?key=...` |
| **Authentication** | Required - API key parameter: `?key={ACCESS_KEY}` |
| **HTTP Method** | GET |
| **Response Format** | JSON or XML (configurable) |
| **Purpose** | Real-time predictions at a specific station |

**Sample Request**:
```bash
curl 'https://api.openmetrolinx.com/OpenDataAPI/api/V1/Stop/NextService/OS.json?key=DA2B8FB0-CBAF-...'
```

### New API (GO Transit Public Schedule)

| Aspect | Details |
|--------|---------|
| **Base URL** | `https://api.metrolinx.com/external/go/schedules/` |
| **Endpoint** | `/en/timetable/all` |
| **Full URL Example** | `https://api.metrolinx.com/external/go/schedules/en/timetable/all?fromStop=OS&toStop=UN&date=2026-02-05` |
| **Authentication** | None required - public endpoint |
| **HTTP Method** | GET |
| **Response Format** | JSON (gzip compressed) |
| **Purpose** | Scheduled timetables between two stops on a specific date |

**Sample Request**:
```bash
curl 'https://api.metrolinx.com/external/go/schedules/en/timetable/all?fromStop=OS&toStop=UN&date=2026-02-05' | gunzip
```

---

## 2. Request Parameters Comparison

### Current API (Open Data)

**Path Parameters**:
- `{StopCode}` - Station code (e.g., "OS" for Oshawa, "UN" for Union)

**Query Parameters**:
- `key` - API authentication key (required)
- Response format: Configured in URL `.json` or `.xml`

**Example**:
```
/api/V1/Stop/NextService/OS.json?key=YOUR_KEY
```

### New API (Public Schedule)

**Query Parameters**:
- `fromStop` - Origin station code (required)
- `toStop` - Destination station code (required)
- `date` - Date in ISO 8601 format: `YYYY-MM-DD` (required)
- Language: Configured in URL path `/en/` or `/fr/`

**Example**:
```
/en/timetable/all?fromStop=OS&toStop=UN&date=2026-02-05
```

**Key Difference**: Current API shows departures from a single station for all directions. New API shows journey options between two specific stops on a specific date.

---

## 3. Response Structure Comparison

### Current API (Open Data)

```json
{
  "Metadata": {
    "TimeStamp": "2026-01-24 17:35:50",
    "ErrorCode": "200",
    "ErrorMessage": "OK"
  },
  "NextService": {
    "Lines": [
      {
        "StopCode": "OS",
        "LineCode": "LE",
        "LineName": "Lakeshore East",
        "ServiceType": "T",
        "DirectionCode": "LE",
        "DirectionName": "LE - Union Station",
        "ScheduledDepartureTime": "2026-01-24 18:09:00",
        "ComputedDepartureTime": "2026-01-24 18:09:00",
        "DepartureStatus": "E",
        "ScheduledPlatform": "2",
        "ActualPlatform": "",
        "TripOrder": 2,
        "TripNumber": "9031",
        "UpdateTime": "2026-01-24 16:39:14",
        "Status": "S",
        "Latitude": 43.8706930,
        "Longitude": -78.8853200
      }
    ]
  }
}
```

**Structure Characteristics**:
- Metadata wrapper with timestamp and error code
- `NextService.Lines` array containing upcoming departures
- Shows multiple lines (bus, train) from a single station
- Real-time fields: `DepartureStatus`, `ComputedDepartureTime`, `Latitude/Longitude`
- Platform information
- Trip order and trip number

### New API (Public Schedule)

```json
{
  "serviceCode": "09",
  "serviceName": "Lakeshore East",
  "date": "2026-02-05T00:00:00-05:00",
  "departureDisplay": "Durham College Oshawa GO",
  "departureStopId": "OS",
  "arrivalDisplay": "Union Station GO",
  "arrivalStopId": "UN",
  "trips": [
    {
      "departureTimeDisplay": "04:00",
      "arrivalTimeDisplay": "05:00",
      "transfers": 0,
      "durationMinutes": 60,
      "duration": "01:07:00",
      "orderTime": "2026-02-05T04:00:00",
      "transitType": 0,
      "serviceCode": "09",
      "serviceName": "Lakeshore East",
      "lines": [
        {
          "lineDisplay": "90B",
          "tripNumber": "90001",
          "transitType": 0,
          "transitTypeName": "BUS",
          "fromStopCode": "OS",
          "fromStopTime": "04:00",
          "fromStopDisplay": "Durham College Oshawa GO",
          "toStopCode": "02300",
          "toStopTime": "05:00",
          "toStopDisplay": "Union Station Bus Terminal",
          "headSign": "90B - Union Station Bus Terminal",
          "blockNumber": null,
          "isExpress": false,
          "stops": [
            {
              "name": "Durham College Oshawa GO",
              "code": "OS",
              "time": "04:00",
              "transitType": 0
            },
            {
              "name": "Victoria St @ Thickson Ridge Power Cntr",
              "code": "02572",
              "time": "04:02",
              "transitType": 0
            }
          ]
        }
      ]
    },
    // ... more trips ...
  ]
}
```

**Structure Characteristics**:
- Trip-based organization from origin to destination
- No metadata wrapper - direct data
- Each trip contains complete journey including all intermediate stops
- Supports connections/transfers (multiple `lines` per trip)
- Full stop-by-stop itinerary
- No real-time status information
- Contains 28 trips for OS→UN on 2026-02-05
- No platform or vehicle location data

---

## 4. Data Fields Comparison

### Current API: Key Fields

| Field | Type | Real-time | Example |
|-------|------|-----------|---------|
| `DepartureStatus` | Enum | ✅ Yes | "E" (Estimated), "D" (Delayed) |
| `ComputedDepartureTime` | DateTime | ✅ Yes | "2026-01-24 18:09:00" |
| `ScheduledDepartureTime` | DateTime | ❌ No | "2026-01-24 18:09:00" |
| `TripOrder` | Integer | ❌ No | 1, 2, 3 (departure sequence) |
| `Latitude/Longitude` | Float | ✅ Yes | 43.8706930, -78.8853200 |
| `ScheduledPlatform` | String | ❌ No | "2" |
| `LineCode` | String | ❌ No | "LE", "LSW" |
| `DirectionName` | String | ❌ No | "LE - Union Station" |
| `UpdateTime` | DateTime | ✅ Yes | "2026-01-24 16:39:14" |

**Total Fields**: ~15 per departure

### New API: Key Fields

| Field | Type | Real-time | Example |
|-------|------|-----------|---------|
| `departureTimeDisplay` | String | ❌ No | "04:00" |
| `arrivalTimeDisplay` | String | ❌ No | "05:00" |
| `durationMinutes` | Integer | ❌ No | 60 |
| `transfers` | Integer | ❌ No | 0 |
| `transitTypeName` | Enum | ❌ No | "BUS", "RAIL" |
| `headSign` | String | ❌ No | "90B - Union Station" |
| `isExpress` | Boolean | ❌ No | true/false |
| `stops` | Array | ❌ No | Full itinerary |
| `lineDisplay` | String | ❌ No | "90B", "LE" |
| `blockNumber` | String | ❌ No | "21A" |

**Total Fields**: ~20+ per trip (with stop details)

---

## 5. Real-Time Capabilities

### Current API ✅ Real-Time
- **Delay Status**: Shows if departure is delayed
- **Computed Time**: Latest prediction vs. scheduled
- **Vehicle Location**: Latitude/Longitude of vehicle
- **Update Time**: When prediction was last updated
- **Current Status**: Indicates vehicle status

### New API ❌ Scheduled Only
- **No Delay Information**: Shows scheduled times only
- **No Vehicle Location**: No GPS coordinates
- **No Real-Time Updates**: Static schedule information
- **Date-Specific**: Only for requested date
- **Complete Itinerary**: All intermediate stops included

---

## 6. Data Volume & Performance

### Current API
- **Response Size**: ~2-5 KB per request
- **Data Scope**: 3-10 departures per station
- **Update Frequency**: Every few minutes (real-time)
- **Caching Strategy**: Short TTL (60-300s) due to real-time nature

### New API
- **Response Size**: ~50-100 KB per request (28 trips OS→UN)
- **Data Scope**: 20-30+ complete journeys with all stops
- **Update Frequency**: Daily (schedules change daily)
- **Caching Strategy**: Long TTL (24h) - schedules are predictable

**Performance Impact**: Current API is significantly lighter and more efficient for real-time display.

---

## 7. Use Case Comparison

### Current API: Best For
✅ Real-time departure displays  
✅ "What's the next bus/train?" interface  
✅ Vehicle delay tracking  
✅ Platform/gate information  
✅ Vehicle location visualization  
✅ Showing arriving/next/later pattern  

**Plugin Context**: This is what the GO Transit Dashboard plugin needs.

### New API: Best For
✅ Journey planning / trip planner  
✅ "How do I get from A to B?" interface  
✅ Lowest-fare route recommendations  
✅ Connection/transfer information  
✅ Detailed stop-by-stop itinerary  
✅ Scheduled arrival time lookup  

**Plugin Context**: This would be useful for a journey planner, not a real-time dashboard.

---

## 8. Authentication & Accessibility

### Current API
- **Authentication**: Required - API key needed
- **Public Access**: No - key registration required
- **Rate Limits**: May apply based on key tier
- **CORS**: May vary by configuration
- **Status**: Documented and actively maintained

### New API
- **Authentication**: None - completely public
- **Public Access**: Yes - anyone can call
- **Rate Limits**: May apply, but not documented
- **CORS**: Appears to support CORS (gzip compressed)
- **Status**: Undocumented public API (reverse engineered from gotransit.com)

---

## 9. Detailed Response Comparison: Same Journey

### Scenario
**Station**: Oshawa GO (OS) to Union Station (UN)

### Current API Response
Shows next departures from Oshawa on **all** lines:
- LE (Lakeshore East) - 5:03 PM
- LE (Lakeshore East) - 6:09 PM  
- LE (Lakeshore East) - 7:09 PM

**Missing**: What happens after departure, intermediate stops, connections

### New API Response
Shows all scheduled journeys for **today**:
- Trip 1: Bus 90B at 04:00 → Union at 05:00 (60 min)
- Trip 2: LE at 05:03 → Union at 06:10 (67 min)
- Trip 3: Bus 95 at 05:30 → Union at 06:45 (75 min)
- ... (25 more trips)

**Includes**: Every intermediate stop, transfer information, duration, transit type

### Key Insight
- **Current API**: "When's the next train?" (Real-time, minimal)
- **New API**: "Show me all ways to get there today" (Scheduled, exhaustive)

---

## 10. Recommendations

### ✅ Recommendation: Keep Current API

The current Metrolinx Open Data API is the correct choice for the GO Transit Dashboard plugin because:

1. **Real-Time Data**: Shows actual predictions, not just schedules
2. **Delay Tracking**: Can display "Delayed" status  
3. **Compact Response**: Efficient for frequent polling
4. **Vehicle Location**: Can show where vehicles are
5. **Low Bandwidth**: Better for IoT/TRMNL devices
6. **Established Integration**: Already working in proxy
7. **Use Case Fit**: Dashboard needs "arriving/next/later", not journey plans

### ⚠️ Potential Future Enhancement

The new API could be valuable as a **future feature** for:
- **Journey Planner plugin**: Separate plugin showing multi-leg journeys
- **Schedule Lookup**: What if user wants to know "All trains today from OS to UN?"
- **Trip Planning**: Mobile app features for planning trips

However, it would **not** replace the current API for the real-time dashboard.

---

## 11. Technical Integration Comparison

### Current API Integration (✅ Recommended)

```javascript
// Proxy: Fetch next departures at station
const nextServiceUrl = `${env.ORIGIN_BASE_URL}api/V1/Stop/NextService/${station}.json?key=${authKey}`
const nextServiceData = await fetch(nextServiceUrl)

// Result: Quick, real-time, lean response
// Ideal for TRMNL update cycles (5-15 minutes)
```

### New API Integration (❌ Not Recommended for Current Plugin)

```javascript
// Would need to fetch: journeys from origin to destination
const journeyUrl = `https://api.metrolinx.com/external/go/schedules/en/timetable/all?fromStop=${from}&toStop=${to}&date=${date}`
const journeyData = await fetch(journeyUrl) // ~50-100 KB

// Result: Large response, scheduled data, no real-time info
// Not suitable for "What's arriving now?" dashboard
```

---

## 12. Conclusion

| Aspect | Current API | New API |
|--------|------------|---------|
| **Real-Time Data** | ✅ Yes | ❌ No |
| **Public Access** | ❌ Key Required | ✅ Public |
| **For Dashboard** | ✅ Perfect Fit | ❌ Wrong Use Case |
| **Performance** | ✅ Lightweight | ❌ Heavy |
| **Authentication** | ⚠️ Maintenance Burden | ✅ None |
| **Delay Tracking** | ✅ Supported | ❌ Not Supported |
| **Journey Planning** | ❌ Single Station | ✅ Origin→Destination |

**Final Verdict**: The current Metrolinx Open Data API (`/Stop/NextService/{StopCode}`) is the correct and optimal choice for the GO Transit Dashboard plugin. The new API serves a different purpose and would be unsuitable for this real-time arrival display use case.

---

## Appendix: API Response Sizes

### Current API (Open Data)
```json
{
  "Metadata": { /* ~50 bytes */ },
  "NextService": {
    "Lines": [
      { /* ~300 bytes per departure */ },
      { /* ~300 bytes */ },
      { /* ~300 bytes */ }
    ]
  }
}
// Total: ~1,050 bytes ≈ 1 KB
```

### New API (Public Schedule)
```json
{
  "serviceCode": "09",
  "serviceName": "Lakeshore East",
  "trips": [
    {
      "lines": [
        {
          "stops": [
            { /* Multiple stops */ }
          ]
        }
      ]
    },
    // ... 27 more trips like above
  ]
}
// Total: ~50-100 KB for 28 trips
```

---

**Report Generated**: February 5, 2026  
**API Comparison Version**: 1.0
