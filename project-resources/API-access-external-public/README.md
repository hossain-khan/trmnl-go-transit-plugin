# GO Transit External Public API

**Status**: ✅ Discovered & Documented (Not Authenticated)  
**Access Level**: Public (No API Key Required)  
**Last Updated**: February 5, 2026
**Endpoints Documented**: 6 (Timetable, Fare Calculator, Service Updates General, Service Updates All, Composer, Departures)

---

## Overview

This is the **public-facing GO Transit API** served by Metrolinx through their external API gateway. Unlike the Metrolinx Open Data API (which requires authentication), these APIs are completely public and undocumented.

Multiple endpoints have been discovered and reverse-engineered by observing network requests from the official GO Transit website (www.gotransit.com):

1. **Timetable Endpoint** (`/schedules/en/timetable/all`) - Journey planning and schedule lookup
2. **Fare Calculator Endpoint** (`/farecalculator/all-concessions-fare`) - Fare quotes and concession info
3. **Service Updates General Endpoint** (`/serviceupdate/en/general`) - System-wide service alerts only
4. **Service Updates All Endpoint** (`/serviceupdate/en/all`) - All service updates (general, lines, stations)
5. **Composer Endpoint** (`/composer/{lang}/{station}/departures/serviceupdates`) - Station-specific departures + service updates (combined)
6. **Departures Endpoint** (`/departures/stops/{station}/departures`) - Real-time station departures with pagination and complete itineraries

---

## API Details

### Base URLs
```
https://api.metrolinx.com/external/go/schedules/         # Timetable & journey planning
https://api.metrolinx.com/external/go/farecalculator/    # Fare calculation & concessions
https://api.metrolinx.com/external/go/serviceupdate/     # Service updates & alerts
https://api.metrolinx.com/external/go/composer/          # Composer (station-specific)
https://api.metrolinx.com/external/go/departures/        # Real-time departures (paginated)
```

### Endpoints
- **Timetable**: `/schedules/en/timetable/all` - Get all journeys between two stops
- **Fare Calculator**: `/farecalculator/all-concessions-fare` - Get fares and discounts for a trip
- **Service Updates General**: `/serviceupdate/en/general` - Get system-wide general service alerts only
- **Service Updates All**: `/serviceupdate/en/all` - Get all service updates (general + lines + stations)
- **Composer**: `/composer/{lang}/{station}/departures/serviceupdates` - Get station-specific departures + service updates combined
- **Departures**: `/departures/stops/{station}/departures` - Get paginated real-time departures for a station with full itineraries

### Available Languages
- English: `/en/`
- French: `/fr/` (not yet tested)

### Authentication
**None required** - This is a public, unauthenticated API

### Using the Proxy (Recommended)

For improved reliability and caching, use the Cloudflare Worker proxy instead of calling the external API directly:

**Proxy Base URL**: `https://gta-go-transit.gohk.xyz`

**Proxied Departures Endpoint**:

```bash
# Direct API (no proxy)
curl "https://api.metrolinx.com/external/go/departures/stops/UN/departures"

# Via Proxy (recommended)
curl "https://gta-go-transit.gohk.xyz/api/V1/external/departures/UN"
```

**Benefits**:
- ⚡ Edge caching (60s browser, 300s edge, 30s SWR)
- 🌍 Global CDN with faster response times
- 🔍 Observability headers (`X-Cache`, `X-Proxy-Time-Ms`)
- 🛡️ Enhanced error handling and reliability

**Currently Proxied**: Departures endpoint only  
**Not Yet Proxied**: Timetable, Fare Calculator, Service Updates, Composer (use direct API)

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

## Endpoint: GET /farecalculator/all-concessions-fare

### Purpose
Calculate GO Transit fare and available concessions for one or more trips. Returns different fare types (full price, student, senior, etc.) for the specified route and departure time.

### Query Parameters

| Parameter | Type | Required | Example | Description |
|-----------|------|----------|---------|-------------|
| `stations[0].fromStopCode` | String | Yes | `OS` | Origin station code |
| `stations[0].toStopCode` | String | Yes | `UN` | Destination station code |
| `stations[0].tripStartTime` | String | Yes | `05/02/2026 06:38:00` | Trip start date and time (MM/DD/YYYY HH:MM:SS) |
| `newFare` | Boolean | No | `true` | Use new fare structure (default: true) |

**Note**: Multiple trips can be queried by incrementing the array index (e.g., `stations[1].fromStopCode`, `stations[1].toStopCode`, etc.)

### Complete URL Example
```
https://api.metrolinx.com/external/go/farecalculator/all-concessions-fare?stations[0].fromStopCode=OS&stations[0].toStopCode=UN&stations[0].tripStartTime=05/02/2026%2006:38:00&newFare=true
```

### cURL Example
```bash
curl 'https://api.metrolinx.com/external/go/farecalculator/all-concessions-fare?stations\[0\].fromStopCode=OS&stations\[0\].toStopCode=UN&stations\[0\].tripStartTime=05/02/2026%2006:38:00&newFare=true' \
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

**Notes on Parameters**:
- URL encoding: Square brackets `[]` must be escaped as `%5B%5D` in URLs or `\[\]` in bash
- Date/Time format: MM/DD/YYYY HH:MM:SS (US format, 24-hour time)
- Times reference trip start departure time to determine applicable fares
- Headers are from real browser request to www.gotransit.com (February 5, 2026)

### Response Structure

**HTTP Headers**:
```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Encoding: gzip
Cache-Control: public, max-age=3600
Date: Thu, 05 Feb 2026 09:00:00 GMT
```

**Response Body** (abbreviated, after decompression):
```json
{
  "stations": [
    {
      "fromStopCode": "OS",
      "toStopCode": "UN",
      "tripStartTime": "2026-02-05T06:38:00",
      "fares": [
        {
          "fareType": "Full",
          "fareTypeCode": 1,
          "name": "Single Trip - Full Fare",
          "description": "Standard single trip fare",
          "price": 8.50,
          "currency": "CAD",
          "discountPercentage": 0
        },
        {
          "fareType": "Student",
          "fareTypeCode": 2,
          "name": "Single Trip - Student",
          "description": "Valid with school ID",
          "price": 6.38,
          "currency": "CAD",
          "discountPercentage": 25
        },
        {
          "fareType": "Senior",
          "fareTypeCode": 3,
          "name": "Single Trip - Senior",
          "description": "Age 65+",
          "price": 4.25,
          "currency": "CAD",
          "discountPercentage": 50
        },
        {
          "fareType": "Child",
          "fareTypeCode": 4,
          "name": "Single Trip - Child",
          "description": "Ages 2-12",
          "price": 4.25,
          "currency": "CAD",
          "discountPercentage": 50
        },
        {
          "fareType": "Presto",
          "fareTypeCode": 5,
          "name": "Stored Value Card",
          "description": "PRESTO card balance",
          "price": 8.00,
          "currency": "CAD",
          "discountPercentage": 5.9
        }
      ]
    }
  ]
}
```

### Fare Types Returned
- **Full**: Regular full price fare
- **Student**: Reduced fare for students (typically 25% discount)
- **Senior**: Reduced fare for seniors 65+ (typically 50% discount)
- **Child**: Reduced fare for children 2-12 (typically 50% discount)
- **Presto**: Discounted fare when using PRESTO card (typical 5-10% discount)
- **Other**: Additional fare types as they become available

### Response HTTP Status
- `200 OK` - Request successful, fares calculated
- `400 Bad Request` - Missing or invalid parameters
- `404 Not Found` - Invalid station codes or no service available

### Response Characteristics
- **Content-Encoding**: gzip (always compressed)
- **Cache-Control**: `public, max-age=3600` (1-hour cache, fares may change)
- **Size**: ~3-5 KB uncompressed per trip
- **Records**: One fare set per trip requested

---

## Service Updates Endpoint

**Path**: `/external/go/serviceupdate/en/general`

**Purpose**: System-wide GO Transit service alerts, notifications, and operational updates (not line-specific)

### Request Format
```
GET https://api.metrolinx.com/external/go/serviceupdate/en/general
```

### cURL Example
```bash
curl 'https://api.metrolinx.com/external/go/serviceupdate/en/general' \
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

### Response Structure

**HTTP Headers**:
```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Encoding: gzip
Cache-Control: public, max-age=3600
Date: Thu, 05 Feb 2026 09:23:00 GMT
```

**Response Body** (abbreviated, after decompression):
```json
{
  "LastUpdated": "2026-02-05T09:23:02.8027565-05:00",
  "TotalUpdates": 1,
  "Notifications": {
    "Notification": [
      {
        "SubCategory": "GDOTHER",
        "Code": null,
        "Name": null,
        "MessageSubject": "Important GO Transit service information",
        "MessageBody": "<style>...</style><div>We are running on a special schedule today to support ongoing service recovery near Union Station...</div>",
        "PostedDateTime": "02/05/2026 02:39:58",
        "Rank": null,
        "Status": "INIT",
        "ServiceMode": "General",
        "TripNumbers": null
      }
    ]
  }
}
```

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `LastUpdated` | String (ISO8601) | When the notification was last updated |
| `TotalUpdates` | Integer | Number of notifications in response |
| `MessageSubject` | String | Quick title for the notification |
| `MessageBody` | String (HTML) | Full message content (HTML formatted) |
| `PostedDateTime` | String (MM/DD/YYYY HH:MM:SS) | When notification was posted |
| `SubCategory` | String | Category type (e.g., GDOTHER for general announcements) |
| `Status` | String | Notification status (INIT, ACTIVE, ARCHIVED) |
| `ServiceMode` | String | Scope: "General", "LineSpecific", or "StationSpecific" |

### Response Characteristics
- **Content-Encoding**: gzip (always compressed)
- **Cache-Control**: `public, max-age=3600` (1-hour cache)
- **Size**: ~2-10 KB uncompressed depending on message length
- **Records**: 0-N notifications (array can be empty if no alerts)
- **Message Format**: HTML (includes embedded styles and links)

### Response HTTP Status
- `200 OK` - Request successful, notifications returned (may be empty)
- `400 Bad Request` - Invalid parameters
- `500 Server Error` - Service temporarily unavailable

---

## Service Updates All Endpoint

**Path**: `/external/go/serviceupdate/en/all`

**Purpose**: All service updates across GO Transit system (general alerts, line-specific issues, station-specific issues)

### Request Format
```
GET https://api.metrolinx.com/external/go/serviceupdate/en/all
```

### cURL Example
```bash
curl 'https://api.metrolinx.com/external/go/serviceupdate/en/all' \
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

### Response Structure

**HTTP Headers**:
```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Encoding: gzip
Cache-Control: public, max-age=3600
Date: Thu, 05 Feb 2026 09:30:00 GMT
```

**Response Body** (abbreviated, after decompression):
```json
{
  "General": {
    "Notifications": { "Notification": [...] },
    "TotalUpdates": 1
  },
  "Lines": {
    "TotalUpdates": 23,
    "Line": [
      {
        "RouteName": "Lakeshore East",
        "RouteNumber": "LE",
        "Status": "2 Updates",
        "Notifications": { "Notification": [...] },
        "LineColour": "#0066cc"
      }
    ]
  },
  "Stations": {
    "TotalUpdates": 14,
    "Station": [
      {
        "StationName": "Union Station",
        "StationCode": "UN",
        "Status": "1 Updates",
        "Notifications": { "Notification": [...] },
        "TotalUpdates": 1
      }
    ]
  },
  "TrainAnnouncements": {
    "Notification": [],
    "TotalUpdates": 0
  },
  "BusAnnouncements": {
    "Notification": [],
    "TotalUpdates": 0
  }
}
```

### Key Structure

| Section | Description | Usage |
|---------|-------------|-------|
| `General` | System-wide general announcements | Display in alert banner or homepage |
| `Lines` | Line/route-specific updates (trains, buses) | Show when user plans route or views line details |
| `Stations` | Station-specific alerts (elevators, access changes) | Display at station details page or arrival board |
| `TrainAnnouncements` | Real-time train-specific announcements | Platform information, delays for specific trains |
| `BusAnnouncements` | Real-time bus-specific announcements | Bus route delays, detours, cancellations |

### Line-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `RouteName` | String | Full route name (e.g., "Lakeshore East") |
| `RouteNumber` | String | Route code (e.g., "LE", "94") |
| `Status` | String | Summary (e.g., "2 Updates") |
| `LineColour` | String | Hex color code for route (e.g., "#0066cc") |
| `Notifications.Notification` | Array | Array of notification objects |
| `TotalUpdates` | Integer | Count of updates for this line |

### Station-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `StationName` | String | Full station name (e.g., "Union Station") |
| `StationCode` | String | Station code (e.g., "UN", "AG") |
| `Status` | String | Summary (e.g., "1 Updates") |
| `Notifications.Notification` | Array | Array of notification objects |
| `TotalUpdates` | Integer | Count of updates for this station |

### Notification Fields (Same for All Sections)

| Field | Type | Description |
|-------|------|-------------|
| `SubCategory` | String | Alert type: GDOTHER, TDELAY, TMODIFY, BCANCEL, SADIS, SGIOTHR |
| `Code` | String/null | Route code or station code if applicable |
| `Name` | String/null | Route name or station name if applicable |
| `MessageSubject` | String | Quick title |
| `MessageBody` | String (HTML) | Full message (HTML) |
| `PostedDateTime` | String | MM/DD/YYYY HH:MM:SS format |
| `Status` | String | INIT (initial), UPD (updated), ARCHIVED |
| `ServiceMode` | String | "General", "GO Train", "GO Bus", "Station" |
| `TripNumbers` | Array/null | Specific trip numbers affected (rarely populated) |

### Response Characteristics
- **Content-Encoding**: gzip (always compressed)
- **Cache-Control**: `public, max-age=3600` (1-hour cache)
- **Size**: ~10-50 KB uncompressed (much larger than /general)
- **Records**: Aggregated counts across all categories
- **Message Format**: HTML (includes embedded styles and links)
- **Use for**: Comprehensive alert dashboard, transit admin panels, alerts API

### Differences from /general Endpoint

| Aspect | `/general` | `/all` |
|--------|-----------|--------|
| **Scope** | System-wide only | General + Lines + Stations |
| **Size** | ~2-10 KB | ~10-50 KB |
| **Update Categories** | 1 section | 5 sections |
| **Notifications Count** | 0-N general alerts | Aggregated across all types |
| **Best For** | Simple alert banner | Comprehensive dashboards |
| **Use Cases** | Quick status, homepage banner | Admin panel, detailed maps |

---

## Endpoint: GET /composer/{lang}/{station}/departures/serviceupdates

### Purpose
Retrieve **station-specific** departures and service updates in a single API call. This endpoint combines train/bus schedule information with relevant service alerts for a specific station.

**Key Differentiator**: Unlike the Service Updates endpoints (which are system-wide), the Composer endpoint is **parameterized by station code** and returns only data relevant to that station.

### URL Parameters

| Parameter | Type | Required | Example | Description |
|-----------|------|----------|---------|-------------|
| `{lang}` | String | Yes | `en` | Language code: `en` (English) or `fr` (French) |
| `{station}` | String | Yes | `UN` | Station code (e.g., "UN" for Union Station, "OS" for Oshawa) |

### Complete URL Examples
```
https://api.metrolinx.com/external/go/composer/en/UN/departures/serviceupdates
https://api.metrolinx.com/external/go/composer/en/OS/departures/serviceupdates
https://api.metrolinx.com/external/go/composer/fr/UN/departures/serviceupdates
```

### cURL Example
```bash
curl 'https://api.metrolinx.com/external/go/composer/en/UN/departures/serviceupdates' \
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

### Response Example

**HTTP Headers**:
```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Encoding: gzip
Cache-Control: public, max-age=3600
Date: Thu, 05 Feb 2026 09:36:58 GMT
Content-Length: ~3-5 KB (compressed, varies by station activity)
```

**Response Body** (after decompression):
```json
{
  "LastUpdated": "2026-02-05T09:36:58.8166998-05:00",
  "TotalUpdates": 1,
  "Trains": {
    "TotalUpdates": 0,
    "Train": [],
    "Status": null
  },
  "Buses": {
    "TotalUpdates": 0,
    "Bus": [],
    "Status": null
  },
  "Stations": {
    "TotalUpdates": 1,
    "Station": [
      {
        "StationName": "Union Station",
        "StationCode": "UN",
        "Status": "1 Updates",
        "Notifications": {
          "Notification": [
            {
              "SubCategory": "SADIS",
              "Code": "UN",
              "Name": "Union Station",
              "MessageSubject": "The elevator in Scotiabank Galleria is out of service",
              "MessageBody": "<style>...</style><div class=\"masteroverridePublic_En\"><div><span lang=\"EN-CA\">We have been advised that the elevator located in the Scotiabank Galleria is temporarily out of service...</span></div></div>",
              "PostedDateTime": "01/18/2026 23:11:22",
              "Status": "UPD",
              "ServiceMode": "Station",
              "TripNumbers": []
            }
          ]
        },
        "TotalUpdates": 1
      }
    ],
    "Status": null
  }
}
```

### Response Structure

The Composer response is organized into three main sections:

| Section | Type | Purpose |
|---------|------|---------|
| **LastUpdated** | ISO 8601 Timestamp | When the response was generated |
| **TotalUpdates** | Integer | Total number of updates across all sections |
| **Trains** | Object | Train service info (currently empty in this example) |
| **Buses** | Object | Bus service info (currently empty in this example) |
| **Stations** | Object | Station-specific alerts and accessibility updates |

### Trains Section

```json
{
  "TotalUpdates": 0,
  "Train": [
    // Array of train services at this station
    // When populated, each train contains:
    // - LineCode: "LE" (Lakeshore East)
    // - RouteName: "Lakeshore East"
    // - Status: "On Time", "Delayed", etc.
    // - Notifications: Any service alerts for this train
  ],
  "Status": null  // Overall status for train services
}
```

### Buses Section

```json
{
  "TotalUpdates": 0,
  "Bus": [
    // Array of bus services at this station
    // Similar structure to Trains
  ],
  "Status": null
}
```

### Stations Section

```json
{
  "TotalUpdates": 1,
  "Station": [
    {
      "StationName": "Union Station",
      "StationCode": "UN",
      "Status": "1 Updates",
      "Notifications": {
        "Notification": [
          {
            "SubCategory": "SADIS",          // Category (e.g., SADIS = Station Accessibility)
            "Code": "UN",                    // Station code
            "Name": "Union Station",         // Station name
            "MessageSubject": "...",         // Alert title (plain text)
            "MessageBody": "<div>...</div>", // Alert body (HTML formatted, may be long)
            "PostedDateTime": "01/18/2026 23:11:22",  // When alert was posted
            "Status": "UPD",                 // Status code (UPD, CAN, etc.)
            "ServiceMode": "Station",        // Where this applies: "Station" or "Train" or "Bus"
            "TripNumbers": []                // Affected trip numbers (empty for station alerts)
          }
        ]
      },
      "TotalUpdates": 1  // Number of notifications for this station
    }
  ],
  "Status": null
}
```

### Notification Fields Explained

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **SubCategory** | String | Type of update (SADIS = accessibility, etc.) | `"SADIS"`, `"SERVICE_ALERT"` |
| **Code** | String | Station or service code | `"UN"` (Union), `"LE"` (Lakeshore East) |
| **Name** | String | Human-readable name | `"Union Station"` |
| **MessageSubject** | String | Brief title, plain text | `"Elevator temporarily out of service"` |
| **MessageBody** | String | Detailed message, **HTML formatted** | `"<div>We have been advised...</div>"` |
| **PostedDateTime** | String | When posted (MM/DD/YYYY HH:MM:SS format) | `"01/18/2026 23:11:22"` |
| **Status** | String | Alert status code | `"UPD"` = Updated, `"CAN"` = Cancelled |
| **ServiceMode** | String | What service this affects | `"Station"`, `"Train"`, `"Bus"` |
| **TripNumbers** | Array | Trip numbers affected (empty for station updates) | `[]` or `["LE001", "LE002"]` |

### Caching Strategy

| Setting | Value | Reason |
|---------|-------|--------|
| **Cache Control** | `max-age=3600` | 1-hour browser cache |
| **CDN Cache** | ~5 minutes | Departures change frequently at stations |
| **Recommended Polling** | 30-60 seconds | For real-time dashboards |

**Note**: Composer endpoint data is more volatile than schedules (which are 24-hour cached) because it includes live departures and service alerts.

### Unique Advantages

Compared to calling multiple endpoints separately:

| Benefit | Details |
|---------|---------|
| **Single Call** | Get departures + alerts in one request instead of 2-3 calls |
| **Station-Focused** | Returns only data for one station, not system-wide |
| **Faster Integration** | No need to cross-reference data from multiple endpoints |
| **Less Data** | Smaller payload than `/serviceupdate/en/all` (system-wide) |
| **UI-Optimized** | Response structure designed for station display widgets |

### Use Cases for Composer Endpoint

1. **Station Display Boards**: Show upcoming trains/buses + relevant alerts for a specific station
2. **Mobile App Station View**: Display comprehensive station info (departures + accessibility) in one tab
3. **Dashboard Widget**: Real-time station status for GO Transit website homepage
4. **Accessibility Info**: Quick lookup of elevator/accessibility issues at a station
5. **Commuter Alert**: "What's departing from my home station right now?"

---

## Endpoint: GET /departures/stops/{station}/departures

### Purpose
Retrieve **paginated, real-time station departures** for both trains and buses at a specific GO Transit station, including complete stop-by-stop itineraries for each trip.

**Key Differentiator**: This endpoint returns actual upcoming departures with full journey details (platforms, next stops, estimated times), making it ideal for real-time departure boards and live station displays.

### URL Parameters

| Parameter | Type | Required | Example | Description |
|-----------|------|----------|---------|-------------|
| `{station}` | String | Yes | `UN` | Station code (e.g., "UN" for Union Station, "OS" for Oshawa) |
| `page` | Integer | No | `1` | Page number for pagination (default: 1) |
| `pageLimit` | Integer | No | `10` | Number of departures per page (default: 10, max: varies) |
| `transitTypeName` | String | No | `All` | Filter by transit type: `"All"`, `"Train"`, `"Bus"`, `"Coach"` |

### Complete URL Examples
```
https://api.metrolinx.com/external/go/departures/stops/UN/departures?page=1&transitTypeName=All&pageLimit=10
https://api.metrolinx.com/external/go/departures/stops/OS/departures?page=1&transitTypeName=Train&pageLimit=5
https://api.metrolinx.com/external/go/departures/stops/UN/departures?page=2&transitTypeName=Bus&pageLimit=20
```

### cURL Example
```bash
curl 'https://api.metrolinx.com/external/go/departures/stops/UN/departures?page=1&transitTypeName=All&pageLimit=10' \
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

### Response Example

**HTTP Headers**:
```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Encoding: gzip
Transfer-Encoding: chunked
Cache-Control: public, max-age=60
Date: Thu, 05 Feb 2026 09:47:00 GMT
```

**Response Body** (after decompression, abbreviated):
```json
{
  "stationCode": "UN",
  "trainDepartures": {
    "items": [
      {
        "lineCode": "LW",
        "tripNumber": "1711",
        "service": "Lakeshore West",
        "transitType": 1,
        "transitTypeName": "T",
        "scheduledTime": "09:47",
        "scheduledDateTime": "2026-02-05T09:47:00",
        "platform": "9 & 10",
        "scheduledPlatform": null,
        "stopsDisplay": "Exhibition-Mimico-Long Branch",
        "info": "Proceed / Avancez",
        "lineColour": "#98002e",
        "allDepartureStops": {
          "stayInTrain": false,
          "tripNumbers": ["1711"],
          "departureDetailsList": [
            { "stopName": "Union Station", "departureTime": "09:47", "stopCode": "UN", "isMajorStop": true },
            { "stopName": "Exhibition GO", "departureTime": "09:54", "stopCode": "EX", "isMajorStop": true },
            { "stopName": "Long Branch GO", "departureTime": "10:08", "stopCode": "LO", "isMajorStop": true }
          ]
        },
        "zone": null,
        "gate": null
      }
    ],
    "page": 1,
    "pageSize": 3,
    "totalItemCount": 20
  },
  "busDepartures": {
    "items": [],
    "page": 1,
    "pageSize": 0,
    "totalItemCount": 0
  }
}
```

### Response Structure

The Departures response contains two main sections:

| Section | Type | Purpose |
|---------|------|---------|
| **stationCode** | String | Station code for which departures are shown |
| **trainDepartures** | Object | Train departures data with pagination |
| **busDepartures** | Object | Bus departures data with pagination |

### Train/Bus Departures Section

```json
{
  "items": [ /* Array of departure objects */ ],
  "page": 1,
  "pageSize": 3,
  "totalItemCount": 20  // Total departures available (for pagination)
}
```

### Departure Item Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **lineCode** | String | Route/line code | `"LW"` (Lakeshore West), `"LE"` (Lakeshore East) |
| **tripNumber** | String | Unique trip identifier | `"1711"` |
| **service** | String | Route name | `"Lakeshore West"`, `"Barrie"` |
| **transitType** | Integer | Service type code | `1` = Train, `2` = Bus |
| **transitTypeName** | String | Service type name | `"T"` (Train), `"B"` (Bus) |
| **scheduledTime** | String | Departure time (HH:MM format) | `"09:47"` |
| **scheduledDateTime** | String | Full ISO 8601 datetime | `"2026-02-05T09:47:00"` |
| **platform** | String | Platform or track number | `"9 & 10"`, `"11 & 12"`, `"-"` (unknown) |
| **scheduledPlatform** | String/Null | Scheduled platform (alternative field) | `null` or platform number |
| **stopsDisplay** | String | Next few stops displayed | `"Exhibition-Mimico-Long Branch"` |
| **info** | String | Bilingual status message | `"Proceed / Avancez"`, `"Wait / Attendez"` |
| **lineColour** | String | Line color as hex code | `"#98002e"` (LW), `"#ff0d00"` (LE) |
| **allDepartureStops** | Object | Complete itinerary with all stops | See below |
| **zone** | String/Null | Fare zone (if applicable) | `null` or zone number |
| **gate** | String/Null | Bus gate/door number | `null` for trains, gate number for buses |

### allDepartureStops Structure

```json
{
  "stayInTrain": false,              // Whether to stay in same vehicle for connections
  "tripNumbers": ["1711"],           // Array of trip numbers (may include connections)
  "departureDetailsList": [          // Complete stop list
    {
      "stopName": "Union Station",    // Full station name
      "departureTime": "09:47",       // Time at this stop
      "stopCode": "UN",               // Station code
      "isMajorStop": true             // Whether this is a major stop
    },
    // ... more stops ...
  ]
}
```

### Pagination Strategy

| Field | Purpose | Example |
|-------|---------|---------|
| **page** | Current page number | `1` |
| **pageSize** | Number of items on this page | `3` |
| **totalItemCount** | Total departures available | `20` |

**Example**: With `pageSize=3` and `totalItemCount=20`, you need 7 pages to get all 20 departures (pages 1-7).

**Load More Pattern**:
```javascript
// Fetch first page
const page1 = fetch('/departures/stops/UN/departures?page=1&pageLimit=10');

// Calculate remaining pages
const totalPages = Math.ceil(data.trainDepartures.totalItemCount / 10);
const remainingPages = [...Array(totalPages-1)].map((_, i) => 
  fetch(`/departures/stops/UN/departures?page=${i+2}&pageLimit=10`)
);
```

### Caching Strategy

| Setting | Value | Reason |
|---------|-------|--------|
| **Cache Control** | `max-age=60` | 1-minute browser cache (departures change frequently) |
| **CDN Cache** | ~30 seconds | Real-time data requires frequent updates |
| **Recommended Polling** | 30-60 seconds | For live departure boards |
| **Stale While Revalidate** | 5-10 seconds | Show stale data while refreshing in background |

### Unique Advantages

Compared to Composer endpoint:

| Benefit | Details |
|---------|---------|
| **Pagination** | Handle high-volume departures (20+ per day at major stations) |
| **Complete Itinerary** | Every stop on the journey, not just summary |
| **Platform Info** | Shows which platform/track the train uses |
| **Filter Options** | Can request trains-only, buses-only, or mixed |
| **Bilingual Info** | Status messages in English/French ("Proceed / Avancez") |
| **Line Colors** | Useful for styling UI elements by route |

### Use Cases for Departures Endpoint

1. **Real-Time Departure Board**: Live display of next 10-20 departures with platforms
2. **Mobile App**: Station detail screen with live trains/buses leaving now
3. **Station Kiosk**: Self-service information displays at GO stations
4. **Commuter Dashboard**: "What's leaving from my home station in the next hour?"
5. **Journey Start**: User confirms their outbound trip is on time before leaving home
6. **Platform Wayfinding**: Show which platform a specific trip departs from
7. **Transit Status**: Check if buses or trains are running at a station
8. **Trip Comparisons**: "Which service is leaving soonest - train or bus?"
9. **Accessibility Planning**: Check for specific trips based on platform location/accessibility
10. **Notification Triggers**: "Notify me when the 9:47 LW train departs"

---

## Use Cases

### ✅ Suitable For: Timetable Endpoint
- **Journey Planner**: "Show me all ways to get from A to B"
- **Trip Planning**: Users exploring travel options with departure/arrival times
- **Schedule Lookup**: Checking what times service is available
- **Timetable Display**: Showing complete daily schedules
- **Duration Analysis**: Comparing travel times between options
- **Transfer Information**: Finding connections and multi-leg journeys

### ✅ Suitable For: Fare Calculator Endpoint
- **Fare Display**: Show all applicable fares for a journey
- **Fare Comparison**: Compare full price vs. student/senior discounts
- **Concession Eligibility**: List available discount types
- **Fare Lookup**: Quick fare quotes for specific routes
- **PRESTO Card Benefits**: Show PRESTO discount vs. cash fares

### ✅ Suitable For: Service Updates General Endpoint (`/general`)
- **Alert Banner**: Display critical system announcements
- **Service Status**: Show if there are active service disruptions
- **Station Maintenance**: Inform users of planned maintenance
- **Schedule Changes**: Notify of temporary schedule modifications
- **System-Wide Notices**: Important announcements affecting all routes
- **Email/SMS Alerts**: Content for notification systems

### ✅ Suitable For: Composer Endpoint (`/composer/{lang}/{station}/departures/serviceupdates`)
- **Station Display Widget**: Show upcoming departures + station alerts in one view
- **Mobile App Station Tab**: Single endpoint for all station-related info
- **Station-Specific Dashboard**: Real-time board showing trains, buses, and alerts
- **Accessibility Lookup**: Quick check for elevator/accessible route info at a station
- **Commuter Journey Start**: "What's leaving from my home station right now?"
- **Station Comparison**: Load multiple station widgets (separate API calls per station)
- **Responsive Web Interface**: Low-bandwidth response (~3-5 KB) suitable for mobile

### ✅ Suitable For: Departures Endpoint (`/departures/stops/{station}/departures`)
- **Real-Time Departure Board**: Live station displays with platform information
- **Mobile Journey Planning**: Confirm departure details before leaving home
- **Station Kiosks**: Self-service information terminals at GO stations
- **High-Volume Station**: Handle 20+ departures per day with pagination
- **Platform Wayfinding**: Show which platform/track each train uses
- **Service Status Checks**: Verify trains/buses are operating at a station
- **Trip-Specific Lookup**: Find exact departure time and platform for a trip
- **Accessibility Routing**: Check platform locations and accessible routes
- **Comprehensive Itinerary**: Show all stops on the journey, not just summary
- **Bilingual Displays**: Service info in English ("Proceed") and French ("Avancez")

### ❌ NOT Suitable For
- **Real-Time Arrival Board**: No delay or current status information (use Open Data API)
- **Vehicle Location**: No GPS data included
- **Platform/Gate Info**: Not provided in response
- **Current Predictions**: No real-time delay tracking
- **Service Disruptions**: Doesn't reflect cancelled or modified trips
- **Historical Fares**: Only current fares available

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

| Endpoint | File | Coverage | Size |
|----------|------|----------|------|
| **Timetable** | `Timetable-OS-UN-2026-02-05.json` | OS → UN on Feb 5, 2026 | 73 KB |
| **Fare Calculator** | `FareCalculator-OS-UN-2026-02-05.json` | 5 fare types (Full, Student, Senior, Child, Presto) | 2.5 KB |
| **Service Updates General** | `ServiceUpdate-General-2026-02-05.json` | Union Station service recovery alert | 3.6 KB |
| **Service Updates All** | `ServiceUpdate-All-2026-02-05.json` | 38 aggregated updates (1 general + 23 lines + 14 stations) | 18 KB |
| **Composer** | `Composer-UN-Departures-ServiceUpdates-2026-02-05.json` | Union Station departures + alerts | 3.2 KB |
| **Departures** | `Departures-UN-2026-02-05.json` | Union Station live departures (3 trains, 0 buses) with full itineraries | 4.3 KB |

### Using Sample Files in Development

**JavaScript**:
```javascript
// Load sample response
const response = await fetch('./sample-response/Composer-UN-Departures-ServiceUpdates-2026-02-05.json');
const composerData = await response.json();

console.log('Station:', composerData.Stations.Station[0].StationName);
console.log('Total Updates:', composerData.TotalUpdates);
console.log('Trains Available:', composerData.Trains.TotalUpdates);
console.log('Buses Available:', composerData.Buses.TotalUpdates);
console.log('Station Alerts:', composerData.Stations.Station[0].TotalUpdates);
```

**HTML/Testing**:
```html
<!-- Test Composer endpoint with real sample data -->
<script>
  fetch('./sample-response/Composer-UN-Departures-ServiceUpdates-2026-02-05.json')
    .then(r => r.json())
    .then(data => {
      // Render station status widget
      renderComposerWidget(data);
    });
</script>
```

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

