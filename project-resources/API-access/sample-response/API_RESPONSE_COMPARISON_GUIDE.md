# API Response Comparison Guide

**Purpose**: Manual side-by-side comparison of real-time proxy API vs. scheduled public API responses

**Date**: February 5, 2026

---

## Quick Reference

| Aspect | Real-Time Proxy | Scheduled Public |
|--------|-----------------|------------------|
| **Files** | `Stop-NextService-OS.json` + `Stop-NextService-UN.json` | `PublicSchedule-Timetable-OS-UN.json` |
| **Data Points** | ~3 departures per station | 28 complete journeys for the day |
| **Response Size** | ~2 KB per station | ~73 KB for entire day |
| **Real-time Info** | ✅ Delays, vehicle location, status updates | ❌ Scheduled times only |
| **Use Case** | Dashboard widget (arriving/next/later) | Journey planner (all options) |

---

## Real-Time Proxy API Structure

### Source Files
- `Stop-NextService-OS.json` - Departures from Oshawa station
- `Stop-NextService-UN.json` - Departures from Union station

### Combined View (What the Plugin Uses)

```json
{
  // Direction 1: Oshawa → Union (from Stop-NextService-OS.json)
  "direction_1": {
    "label": "To Union Station",
    "departures": [
      // Filtered for LE line, sorted by TripOrder
      {
        "time": "5:39 PM",        // ComputedDepartureTime
        "status": "On Time",       // DepartureStatus = 'E'
        "trip": 1,                 // TripOrder
        "platform": "2"            // ScheduledPlatform
      },
      {
        "time": "6:09 PM",
        "status": "On Time",
        "trip": 2,
        "platform": "2"
      },
      {
        "time": "6:39 PM",
        "status": "On Time",
        "trip": 3,
        "platform": "2"
      }
    ]
  },
  
  // Direction 2: Union → Oshawa (from Stop-NextService-UN.json)
  "direction_2": {
    "label": "To Oshawa GO",
    "departures": [
      // Filtered for LE line going towards Oshawa
      // Note: Stop-NextService-UN.json shows departures FROM Union
      // This API doesn't natively show return trips at Oshawa
    ]
  }
}
```

### Key Characteristics
- **Sparse Data**: Only next 3-10 departures
- **Real-time Fields**: `DepartureStatus`, `ComputedDepartureTime`, `UpdateTime`, `Latitude/Longitude`
- **Station-Centric**: Knows departures from a single station, not journey routes
- **Live Updates**: Timestamps show when data was last updated
- **Minimal Payload**: ~500 bytes per departure

### Example Departure Structure
```json
{
  "StopCode": "OS",
  "LineCode": "LE",
  "LineName": "Lakeshore East",
  "DirectionName": "LE - Union Station",
  "ComputedDepartureTime": "2026-01-24 17:39:00",
  "DepartureStatus": "E",              // 'E' = Estimated, 'D' = Delayed
  "ScheduledDepartureTime": "2026-01-24 17:39:00",
  "ScheduledPlatform": "2",
  "TripOrder": 1,
  "TripNumber": "9229",
  "UpdateTime": "2026-01-24 17:35:08", // Last update time
  "Latitude": 43.8706930,              // Current vehicle location
  "Longitude": -78.8853200
}
```

---

## Scheduled Public API Structure

### Source File
- `PublicSchedule-Timetable-OS-UN.json` - All trips Oshawa → Union on Feb 5, 2026

### Journey-Centric View

```json
{
  "serviceCode": "09",
  "serviceName": "Lakeshore East",
  "date": "2026-02-05T00:00:00-05:00",
  "departureDisplay": "Durham College Oshawa GO",
  "arrivalDisplay": "Union Station GO",
  "trips": [
    // 28 complete journeys for the day
    {
      "departureTimeDisplay": "04:00",
      "arrivalTimeDisplay": "05:00",
      "durationMinutes": 60,
      "transfers": 0,
      "transitType": 0,  // 0 = Bus, 1 = Rail
      "lines": [
        {
          "lineDisplay": "90B",     // Bus line
          "departureTime": "04:00",
          "arrivalTime": "05:00",
          "stops": [
            {
              "name": "Durham College Oshawa GO",
              "code": "OS",
              "time": "04:00"
            },
            // ... intermediate stops ...
            {
              "name": "Union Station Bus Terminal",
              "code": "02300",
              "time": "05:00"
            }
          ]
        }
      ]
    },
    // ... 27 more trips ...
  ]
}
```

### Key Characteristics
- **Comprehensive**: All 28 trips for the entire day
- **Journey-Focused**: Each trip is a complete origin→destination journey
- **Static Data**: No real-time status, only scheduled times
- **Detailed Routes**: All intermediate stops included
- **Connection Info**: Shows transfers/connections within trips
- **Large Payload**: ~2.5 KB per trip average

### Example Trip Structure
```json
{
  "departureTimeDisplay": "05:03",
  "arrivalTimeDisplay": "06:10",
  "durationMinutes": 67,
  "transfers": 0,
  "transitType": 1,           // 1 = Rail
  "serviceCode": "09",
  "serviceName": "Lakeshore East",
  "lines": [
    {
      "lineDisplay": "LE",
      "tripNumber": "9005",
      "transitTypeName": "RAIL",
      "headSign": "LE - Union Station",
      "blockNumber": "21A",
      "stops": [
        {
          "name": "Durham College Oshawa GO",
          "code": "OS",
          "time": "05:03"
        },
        {
          "name": "Whitby GO",
          "code": "WH",
          "time": "05:08"
        },
        // ... all intermediate stops ...
        {
          "name": "Union Station",
          "code": "UN",
          "time": "06:10"
        }
      ]
    }
  ]
}
```

---

## Comparison: Same Time Period

### Scenario: February 5, 2026, 5:00 PM onwards

#### Real-Time Proxy API View
**What the user sees if they check departure board right now:**

```json
// Stop-NextService-OS.json response at time of check
{
  "ScheduledDepartureTime": "2026-01-24 17:39:00",  // Next departure
  "ComputedDepartureTime": "2026-01-24 17:39:00",    // Actual prediction
  "DepartureStatus": "E",                              // On time
  "TripOrder": 1
},
{
  "ScheduledDepartureTime": "2026-01-24 18:09:00",
  "ComputedDepartureTime": "2026-01-24 18:09:00",
  "DepartureStatus": "E",
  "TripOrder": 2
},
{
  "ScheduledDepartureTime": "2026-01-24 18:39:00",
  "ComputedDepartureTime": "2026-01-24 18:39:00",
  "DepartureStatus": "E",
  "TripOrder": 3
}
```

**Rendered on Dashboard:**
```
Oshawa GO → Union Station

ARRIVING
5:39 PM  ✓ On Time, Platform 2

NEXT
6:09 PM  ✓ On Time, Platform 2

LATER
6:39 PM  ✓ On Time, Platform 2
```

#### Scheduled Public API View
**What all options available that day look like:**

```json
// PublicSchedule-Timetable-OS-UN.json
[
  { "departureTimeDisplay": "04:00", "arrivalTimeDisplay": "05:00", "transitType": 0 },  // Bus
  { "departureTimeDisplay": "05:03", "arrivalTimeDisplay": "06:10", "transitType": 1 },  // Rail
  { "departureTimeDisplay": "05:30", "arrivalTimeDisplay": "06:45", "transitType": 0 },  // Bus
  // ... continuing through the day ...
  { "departureTimeDisplay": "17:09", "arrivalTimeDisplay": "18:15", "transitType": 1 },  // Rail ← Current time
  { "departureTimeDisplay": "17:39", "arrivalTimeDisplay": "18:45", "transitType": 1 },  // Rail ← Next
  { "departureTimeDisplay": "18:09", "arrivalTimeDisplay": "19:15", "transitType": 1 },  // Rail ← Later
  // ... continuing to end of day ...
  { "departureTimeDisplay": "23:40", "arrivalTimeDisplay": "00:40", "transitType": 0 }   // Bus
]

// Total: 28 options
```

**Rendered as Journey Planner:**
```
Trips from Oshawa GO to Union Station (Feb 5, 2026)

04:00 → 05:00 (1h 0m)  🚌 Bus 90B
05:03 → 06:10 (1h 7m)  🚂 LE Rail
05:30 → 06:45 (1h 15m) 🚌 Bus 95
...
17:09 → 18:15 (1h 6m)  🚂 LE Rail [DEPART SOON]
17:39 → 18:45 (1h 6m)  🚂 LE Rail
18:09 → 19:15 (1h 6m)  🚂 LE Rail
...
23:40 → 00:40 (1h 0m)  🚌 Bus 90B

[All 28 options shown]
```

---

## Manual Comparison Checklist

When comparing the two APIs, note these differences:

### ✅ Real-Time Proxy Advantages
- [ ] Shows actual vs. scheduled times (delay detection)
- [ ] Provides vehicle location (GPS coordinates)
- [ ] Includes platform/gate information
- [ ] Has update timestamps (data freshness)
- [ ] Lightweight response (~2 KB)
- [ ] Frequent polling friendly (5-15 min intervals)
- [ ] Shows "next 3" departures (user-friendly dashboard)

### ✅ Scheduled Public API Advantages
- [ ] Complete daily schedule (all 28 trips)
- [ ] Includes intermediate stops (full itinerary)
- [ ] Shows journey duration and transfers
- [ ] No authentication required
- [ ] Static data (can be cached long-term)
- [ ] Journey planning use case
- [ ] Shows transit type (bus vs. rail)

### ⚠️ Real-Time Proxy Limitations
- [ ] Only shows next ~3 departures (not full day)
- [ ] Requires API authentication
- [ ] No intermediate stop information
- [ ] No journey duration details
- [ ] Station-centric (not journey-centric)
- [ ] Needs frequent polling to stay current

### ⚠️ Scheduled Public API Limitations
- [ ] No real-time delay information
- [ ] No vehicle location data
- [ ] No platform information
- [ ] Immutable (doesn't reflect cancellations)
- [ ] Larger response size (~73 KB)
- [ ] Not suitable for "arriving now" displays
- [ ] Doesn't account for real-time service disruptions

---

## How to Compare Manually

### Step 1: Open Both Files
```bash
# Terminal 1: Real-time API responses
open project-resources/API-access/sample-response/Stop-NextService-OS.json
open project-resources/API-access/sample-response/Stop-NextService-UN.json

# Terminal 2: Scheduled API response
open project-resources/API-access/sample-response/PublicSchedule-Timetable-OS-UN.json
```

### Step 2: Find Matching Time Periods
- Real-time: Look for `ComputedDepartureTime`: `2026-01-24 18:09:00`
- Scheduled: Look for `departureTimeDisplay`: `"18:09"` in the trips array

### Step 3: Compare Data Fields
**Real-Time Example:**
```json
"ComputedDepartureTime": "2026-01-24 18:09:00",
"DepartureStatus": "E",
"ScheduledPlatform": "2",
"Latitude": -1.0000000
```

**Scheduled Example:**
```json
"departureTimeDisplay": "18:09",
"arrivalTimeDisplay": "19:15",
"durationMinutes": 66,
"stops": [ /* full itinerary */ ]
```

### Step 4: Analyze Trade-offs
- **For Dashboard**: Real-time API wins (concise, current)
- **For Planner**: Scheduled API wins (complete, comprehensive)
- **For Hybrid**: Combine both (real-time for now, scheduled for future planning)

---

## File Sizes

Compare response sizes for bandwidth/performance analysis:

| File | Size | Records | Bytes/Record |
|------|------|---------|--------------|
| `Stop-NextService-OS.json` | ~2 KB | 3 departures | ~670 B |
| `Stop-NextService-UN.json` | ~8 KB | ~15 departures | ~533 B |
| Total Real-Time | ~10 KB | ~18 departures | ~556 B avg |
| `PublicSchedule-Timetable-OS-UN.json` | 73 KB | 28 trips | ~2.6 KB |

**Efficiency Ratio**: Real-time API is **7.3x more compact** for the same journeys shown

---

## Next Steps for Analysis

1. **JSON Validator**: Paste both into [jsonlint.com](https://www.jsonlint.com) to validate schema
2. **Diff Tool**: Use `diff` or `jq` to compare structure
   ```bash
   jq 'keys' Stop-NextService-OS.json
   jq 'keys' PublicSchedule-Timetable-OS-UN.json
   ```
3. **Field Analysis**: Map which fields from real-time API correlate to scheduled API
4. **Transformation**: See how plugin transforms real-time → display format

---

**References**:
- Real-Time API Docs: [METROLINX_API.md](../../../docs/METROLINX_API.md)
- API Comparison Report: [API_COMPARISON.md](../../../docs/API_COMPARISON.md)
- Plugin Proxy Code: [cloudflare-worker/src/index.js](../../../../cloudflare-worker/src/index.js)

