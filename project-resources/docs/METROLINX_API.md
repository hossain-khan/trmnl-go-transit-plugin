# Metrolinx Open Data API Documentation

> Source: https://api.openmetrolinx.com/OpenDataAPI/Help/Index/en

## Introduction

The API is a collection of function calls providing access to GO Transit information. Data provided through the API is public and in real time.

### Access Key Requirements

- **Registration**: You must register to obtain an Access Key
- **Usage**: The Access Key is required with every method call
- **Expiration**: The key does not change or expire
- **Throttling**: Keys may be disabled if extensive API calls are detected

### Response Formats

All endpoints support multiple response formats:
- **JSON**: `api/V1/{endpoint}.json` or `api/V1/{endpoint}` (default)
- **XML**: `api/V1/{endpoint}.xml`
- **Protobuf**: `api/V1/{endpoint}.proto` (GTFS feeds only)

### Base URL

```
https://api.openmetrolinx.com/OpenDataAPI/
```

### Authentication

Include your API key as a query parameter:
```
?key={YOUR_ACCESS_KEY}
```

---

## API Endpoints

### Service At A Glance ⭐

*Primary endpoint for the GO Transit Dashboard plugin*

Returns information on in-service bus and train trips.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `api/V1/ServiceataGlance/Buses/All` | Displays all in-service bus trips |
| GET | `api/V1/ServiceataGlance/Trains/All` | Displays all in-service train trips |
| GET | `api/V1/ServiceataGlance/UPX/All` | Displays all in-service UP Express trips |

**Example Request:**
```
GET https://api.openmetrolinx.com/OpenDataAPI/api/V1/ServiceataGlance/Trains/All?key={ACCESS_KEY}
```

---

### Service Update ⭐

*Used for alerts and Union Station departures*

Returns information on alert messages, train/bus departures from Union, and service guarantees.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `api/V1/ServiceUpdate/ServiceAlert/All` | Service alert messages by date |
| GET | `api/V1/ServiceUpdate/InformationAlert/All` | Information alert messages by date |
| GET | `api/V1/ServiceUpdate/MarketingAlert/All` | Marketing alert messages by date |
| GET | `api/V1/ServiceUpdate/UnionDepartures/All` | Nearest departures for buses and trains from Union Station |
| GET | `api/V1/ServiceUpdate/ServiceGuarantee/{TripNumber}/{OperationalDay}` | Trip number for the given day |
| GET | `api/V1/ServiceUpdate/Exceptions/Train` | Schedule exceptions - cancelled trips/stops (trains) |
| GET | `api/V1/ServiceUpdate/Exceptions/Bus` | Schedule exceptions - cancelled trips/stops (buses) |
| GET | `api/V1/ServiceUpdate/Exceptions/All` | All schedule exceptions - cancelled trips/stops |

**Example Request:**
```
GET https://api.openmetrolinx.com/OpenDataAPI/api/V1/ServiceUpdate/ServiceAlert/All?key={ACCESS_KEY}
```

---

### Stop

Returns information on stops including predictions and destinations.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `api/V1/Stop/All` | Returns all stops |
| GET | `api/V1/Stop/Details/{StopCode}` | Stop details by code |
| GET | `api/V1/Stop/NextService/{StopCode}` | Predictions for all lines at a stop |
| GET | `api/V1/Stop/Destinations/{StopCode}/{FromTime}/{ToTime}` | Destinations from a stop |

**Parameters:**
- `{StopCode}` - The stop code (e.g., "OS" for Oshawa, "UN" for Union)
- `{FromTime}` / `{ToTime}` - Time range for destinations

**Example Request:**
```
GET https://api.openmetrolinx.com/OpenDataAPI/api/V1/Stop/NextService/OS?key={ACCESS_KEY}
```

---

### Schedule

Returns information on schedules by line, stop, and journey planning.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `api/V1/Schedule/Line/All/{Date}` | Lines in effect for the given date |
| GET | `api/V1/Schedule/Line/{Date}/{LineCode}/{LineDirection}` | Line detail by date, code, and direction |
| GET | `api/V1/Schedule/Line/Stop/{Date}/{LineCode}/{LineDirection}` | Line stops for the given parameters |
| GET | `api/V1/Schedule/Trip/{Date}/{TripNumber}` | Trip stops for given trip number and date |
| GET | `api/V1/Schedule/Journey/{Date}/{FromStopCode}/{ToStopCode}/{StartTime}/{MaxJourney}` | Journey planning with lines, trips, stops, transfers |

**Parameters:**
- `{Date}` - Date in format `YYYY-MM-DD`
- `{LineCode}` - Line code (e.g., "LE" for Lakeshore East)
- `{LineDirection}` - Direction code
- `{TripNumber}` - Trip identifier
- `{FromStopCode}` / `{ToStopCode}` - Origin and destination stop codes
- `{StartTime}` - Journey start time
- `{MaxJourney}` - Maximum number of journey options

---

### GTFS Real-Time Feeds

Returns GTFS real-time data in standard GTFS-RT format.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `api/V1/Gtfs/Feed/Alerts` | All alert feeds |
| GET | `api/V1/Gtfs/Feed/TripUpdates` | All trip update feeds |
| GET | `api/V1/Gtfs/Feed/VehiclePosition` | All vehicle position feeds |

**Response Formats:** JSON, XML, or Protobuf (`.proto`)

---

### UP Express GTFS Real-Time

Returns GTFS real-time feeds specifically for UP Express service.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `api/V1/UP/Gtfs/Feed/Alerts` | UP Express alert feeds |
| GET | `api/V1/UP/Gtfs/Feed/TripUpdates` | UP Express trip update feeds |
| GET | `api/V1/UP/Gtfs/Feed/VehiclePosition` | UP Express vehicle position feeds |

---

### Fleet

Returns fleet information including occupancy and consist data.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `api/V1/Fleet/Consist/All` | All consist data |
| GET | `api/V1/Fleet/Consist/Engine/{EngineNumber}` | Consist for specific engine |
| GET | `api/V1/Fleet/Occupancy/GtfsRT/Feed/Alerts` | Alert feeds with occupancy |
| GET | `api/V1/Fleet/Occupancy/GtfsRT/Feed/TripUpdates` | Trip updates with occupancy |
| GET | `api/V1/Fleet/Occupancy/GtfsRT/Feed/VehiclePosition` | Vehicle positions with occupancy |

---

### Fares

Returns fare information between stations.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `api/V1/Fares/{FromStopCode}/{ToStopCode}` | Fares between two stations |
| GET | `api/V1/Fares/{FromStopCode}/{ToStopCode}/{OperationalDay}` | Fares for a specific operational day |

**Parameters:**
- `{FromStopCode}` - Origin station code
- `{ToStopCode}` - Destination station code
- `{OperationalDay}` - Date in format `YYYY-MM-DD`

---

## Common Station Codes

| Code | Station Name |
|------|--------------|
| UN | Union Station |
| OS | Oshawa GO |
| WH | Whitby GO |
| AJ | Ajax GO |
| PI | Pickering GO |
| RO | Rouge Hill GO |
| GU | Guildwood GO |
| EG | Eglinton GO |
| DA | Danforth GO |
| SC | Scarborough GO |

---

## Line Codes

| Code | Line Name |
|------|-----------|
| LE | Lakeshore East |
| LW | Lakeshore West |
| ST | Stouffville |
| RH | Richmond Hill |
| BR | Barrie |
| MI | Milton |
| KI | Kitchener |

---

## Resources

- [API Data Catalogue (PDF)](https://api.openmetrolinx.com/OpenDataAPI/Content/API_Data_Catalogue.pdf)
- [GO Transit Open Data Portal](https://www.gotransit.com/en/open-data)
- [GTFS Static Data](https://www.gotransit.com/en/trip-planning/schedules)

---

## Usage in This Plugin

The GO Transit Dashboard plugin primarily uses:

1. **`ServiceataGlance/Trains/All`** - Real-time train departure times
2. **`ServiceUpdate/ServiceAlert/All`** - Service alerts and delays
3. **`Stop/All`** - Station information and codes

See [scripts/update-go-transit.js](../../scripts/update-go-transit.js) for implementation details.
