# GO Transit External Public API

**Status**: ✅ Discovered & Documented (Not Authenticated)  
**Access Level**: Public (No API Key Required)  
**Last Updated**: February 5, 2026

---

## Overview

This is the **public-facing GO Transit schedule API** served by Metrolinx through their external API gateway. Unlike the Metrolinx Open Data API (which requires authentication), this API is completely public and undocumented.

This API was reverse-engineered by observing network requests from the official GO Transit website (www.gotransit.com) when users search for schedules and journeys.

---

## API Details

### Base URL
```
https://api.metrolinx.com/external/go/schedules/
```

### Available Languages
- English: `/en/timetable/all`
- French: `/fr/timetable/all`

### Authentication
**None required** - This is a public, unauthenticated API

### Response Format
- **Format**: JSON
- **Compression**: gzip
- **Content-Type**: `application/json`

---

## Endpoint: GET /schedules/{lang}/timetable/all

### Purpose
Retrieve all scheduled journeys between two GO Transit stops on a specific date, including transfers and complete itineraries.

### Query Parameters

| Parameter | Type | Required | Example | Description |
|-----------|------|----------|---------|-------------|
| `fromStop` | String | Yes | `OS` | Origin station code (e.g., "OS" for Oshawa) |
| `toStop` | String | Yes | `UN` | Destination station code (e.g., "UN" for Union) |
| `date` | String | Yes | `2026-02-05` | Date in ISO 8601 format (YYYY-MM-DD) |

### Complete URL Example
```
https://api.metrolinx.com/external/go/schedules/en/timetable/all?fromStop=OS&toStop=UN&date=2026-02-05
```

### cURL Example
```bash
curl 'https://api.metrolinx.com/external/go/schedules/en/timetable/all?fromStop=OS&toStop=UN&date=2026-02-05' \
  -H 'Accept-Language: en-US,en;q=0.9' \
  -H 'Connection: keep-alive' \
  -H 'DNT: 1' \
  -H 'Origin: https://www.gotransit.com' \
  -H 'Referer: https://www.gotransit.com/' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: cross-site' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36' \
  -H 'accept: application/json' \
  -H 'sec-ch-ua: "Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"'
```

**Notes on Headers**:
- Headers are from real browser request to www.gotransit.com (February 5, 2026)
- `Origin` and `Referer` show this is CORS-enabled for cross-origin requests
- `sec-ch-ua-*` headers are modern client hints from Chromium 144
- Most headers are optional; minimal request would be:
  ```bash
  curl 'https://api.metrolinx.com/external/go/schedules/en/timetable/all?fromStop=OS&toStop=UN&date=2026-02-05'
  ```
- Response is gzip-compressed, automatically decompressed by curl with `-s` flag

### Response Example

**HTTP Headers**:
```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Encoding: gzip
Cache-Control: public, max-age=86400
Date: Thu, 05 Feb 2026 09:00:00 GMT
Content-Length: ~16 KB (compressed)
```

**Response Body** (after decompression, abbreviated):
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
      "duration": "01:00:00",
      "transitType": 0,
      "lines": [
        {
          "lineDisplay": "90B",
          "tripNumber": "90001",
          "transitTypeName": "BUS",
          "fromStopTime": "04:00",
          "toStopTime": "05:00",
          "stops": [
            { "name": "Durham College Oshawa GO", "code": "OS", "time": "04:00" },
            { "name": "Whitby GO", "code": "WH", "time": "04:08" },
            { "name": "Union Station Bus Terminal", "code": "02300", "time": "05:00" }
          ]
        }
      ]
    },
    // ... 27 more trips ...
  ],
  "notes": []
}
```

**Response Characteristics**:
- **Content-Encoding**: gzip (always compressed)
- **Cache-Control**: `public, max-age=86400` (24-hour browser cache)
- **Status**: Always 200 OK for valid queries
- **Size**: ~73 KB uncompressed, ~16 KB compressed
- **Records**: 20-40 complete journeys depending on O-D pair

### Response HTTP Status
- `200 OK` - Request successful
- `400 Bad Request` - Missing or invalid parameters
- `404 Not Found` - Invalid station codes or no service between stops

---

## Response Structure

### Top-Level Object

```json
{
  "serviceCode": "09",
  "serviceName": "Lakeshore East",
  "date": "2026-02-05T00:00:00-05:00",
  "departureDisplay": "Durham College Oshawa GO",
  "departureStopId": "OS",
  "arrivalDisplay": "Union Station GO",
  "arrivalStopId": "UN",
  "trips": [ /* array of complete journeys */ ],
  "notes": [ /* service notes like express indicators */ ],
  "departureNotesImages": [],
  "arrivalNotesImages": []
}
```

### Trip Object Structure

```json
{
  "departureTimeDisplay": "04:00",
  "arrivalTimeDisplay": "05:00",
  "transfers": 0,
  "durationMinutes": 60,
  "duration": "01:00:00",
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
      "transferStopCode": null,
      "transferDisplay": null,
      "headSign": "90B - Union Station Bus Terminal",
      "blockNumber": null,
      "isExpress": false,
      "serviceLineName": "Lakeshore East",
      "isTransfer": false,
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
}
```

### Key Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `serviceCode` | String | Line code | `"09"` for Lakeshore East |
| `serviceName` | String | Line name | `"Lakeshore East"` |
| `date` | ISO DateTime | Date of service (start of day) | `"2026-02-05T00:00:00-05:00"` |
| `trips` | Array | All scheduled journeys | Array of trip objects |
| `departureTimeDisplay` | String | Departure time (HH:MM format) | `"04:00"` |
| `arrivalTimeDisplay` | String | Arrival time (HH:MM format) | `"05:00"` |
| `transfers` | Integer | Number of transfers | `0` (direct), `1+` (connections) |
| `durationMinutes` | Integer | Trip duration in minutes | `60` |
| `transitType` | Integer | 0 = Bus, 1 = Rail | `0` or `1` |
| `transitTypeName` | String | Transit mode text | `"BUS"` or `"RAIL"` |
| `stops` | Array | Complete stop-by-stop itinerary | Array of stop objects |
| `isExpress` | Boolean | Whether service is express | `true` or `false` |
| `blockNumber` | String\|null | Vehicle block assignment | `"21A"` or `null` |

---

## Use Cases

### ✅ Suitable For
- **Journey Planner**: "Show me all ways to get from A to B"
- **Trip Planning**: Users exploring travel options with departure/arrival times
- **Schedule Lookup**: Checking what times service is available
- **Timetable Display**: Showing complete daily schedules
- **Duration Analysis**: Comparing travel times between options
- **Transfer Information**: Finding connections and multi-leg journeys

### ❌ NOT Suitable For
- **Real-Time Arrival Board**: No delay or current status information
- **Vehicle Location**: No GPS data included
- **Platform/Gate Info**: Not provided in response
- **Current Predictions**: No real-time delay tracking
- **Service Disruptions**: Doesn't reflect cancelled or modified trips

---

## Key Characteristics

| Aspect | Details |
|--------|---------|
| **Data Freshness** | Scheduled (static) - not real-time |
| **Update Frequency** | Daily (schedules change day to day) |
| **Response Size** | Large (~50-100 KB per O→D pair) |
| **Records per Request** | 20-40 complete journeys |
| **Best for Caching** | Long TTL (24 hours) |
| **Rate Limits** | Not documented (likely lenient) |
| **CORS Support** | ✅ Yes (used by www.gotransit.com) |
| **Authentication** | None required |

---

## Comparison with Metrolinx Open Data API

| Feature | External Public API | Open Data API |
|---------|-------------------|---------------|
| **URL Base** | `api.metrolinx.com/external/go/` | `api.openmetrolinx.com/OpenDataAPI/` |
| **Auth Required** | ❌ No | ✅ Yes (API key) |
| **Real-time Data** | ❌ No | ✅ Yes |
| **Delay Status** | ❌ No | ✅ Yes |
| **Vehicle Location** | ❌ No | ✅ Yes |
| **Data Scope** | All trips for a day | Next 3-10 departures |
| **Response Size** | ~50-100 KB | ~2-10 KB |
| **Format** | Journey-centric | Station-centric |
| **Use Case** | Journey planner | Dashboard/arrivals |
| **Rate Limiting** | Not documented | By API key tier |
| **CORS** | ✅ Yes | Varies |
| **Documented** | ❌ No (reverse-engineered) | ✅ Yes (official) |

---

## Known Limitations

1. **No Real-Time Updates**: Data is scheduled only, doesn't reflect actual delays
2. **No Authentication Layer**: Public but undocumented, could change without notice
3. **Gzip Compression**: Response is always gzip-compressed (automatic in browsers/curl)
4. **No Official Support**: This is a reverse-engineered public endpoint
5. **No Rate Limit Info**: Unknown throttling rules (proceed with caution for high-volume usage)
6. **Immutable Schedules**: Doesn't account for service changes after schedule publication
7. **Station Code Dependency**: Requires knowing exact station codes (OS, UN, etc.)

---

## Getting Started

### Step 1: Identify Station Codes
Use the Metrolinx Open Data API or refer to `GO_TRANSIT_STOPS.md` for station codes.

Common examples:
- `OS` - Oshawa GO
- `UN` - Union Station
- `WH` - Whitby GO
- `AJ` - Ajax GO

### Step 2: Make Your First Request
```bash
curl 'https://api.metrolinx.com/external/go/schedules/en/timetable/all?fromStop=OS&toStop=UN&date=2026-02-05'
```

### Step 3: Parse JSON Response
The response is gzip-compressed, so decompress before parsing:
```bash
curl -s 'https://api.metrolinx.com/external/go/schedules/en/timetable/all?fromStop=OS&toStop=UN&date=2026-02-05' | gunzip
```

### Step 4: Extract Journey Data
Look for the `trips` array and extract:
- `departureTimeDisplay` / `arrivalTimeDisplay`
- `durationMinutes`
- `transitType` (0 = Bus, 1 = Rail)
- `stops` array for itinerary

---

## Sample Responses

Sample responses are provided in the `sample-response/` directory:

- `Timetable-OS-UN-2026-02-05.json` - OS → UN on Feb 5, 2026 (28 trips)
- `Timetable-UN-OS-2026-02-05.json` - UN → OS on Feb 5, 2026 (reverse direction)

---

## Error Responses

### Bad Request (Missing Parameters)
```json
{
  "error": "Missing required parameter: fromStop"
}
```

### Invalid Station Code
```json
{
  "error": "Station not found",
  "code": "STATION_NOT_FOUND"
}
```

### No Service Available
```json
{
  "trips": [],
  "message": "No service found between these stops on this date"
}
```

---

## Important Notes

⚠️ **This is an undocumented, reverse-engineered API**
- Use at your own risk
- Endpoint could change or be deprecated without notice
- No official support from Metrolinx
- Better for non-critical applications (journey planners, reference, learning)

✅ **For Production Use Cases**
- Consider using the official Metrolinx Open Data API (with authentication)
- That API provides real-time data and comes with official support
- See `../API-access/` directory for details

---

## References

- **Discovery Date**: February 5, 2026
- **Reverse-Engineered From**: https://www.gotransit.com/en/ search functionality
- **Official API Alternative**: `../API-access/` (Metrolinx Open Data API)
- **Comparison Docs**: `../../docs/API_COMPARISON.md`

---

## Testing Notes

This API was tested with:
- Origin: Oshawa GO (OS)
- Destination: Union Station (UN)
- Date: February 5, 2026
- Results: 28 complete trips with full itineraries

All responses validated as valid JSON after gzip decompression.

