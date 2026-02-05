# Sample API Responses

This directory contains sample responses from the Metrolinx Open Data API endpoints used by the GO Transit Dashboard plugin.

## Files

### ServiceAtAGlance-Buses.json
**Endpoint:** `/api/V1/ServiceataGlance/Buses/All`

Real-time information for all in-service buses.

**Key Fields:**
- `TripNumber`: Unique trip identifier
- `LineCode`: Bus line code (e.g., "18", "40")
- `RouteNumber`: Route display number
- `Display`: Human-readable destination (e.g., "18B - Union Station")
- `DelaySeconds`: Current delay in seconds
- `IsInMotion`: Whether vehicle is currently moving
- `AtStationCode`: Station code if vehicle is at a station

**Usage:** Real-time bus tracking and arrival prediction data.

### ServiceAtAGlance-Trains.json
**Endpoint:** `/api/V1/ServiceataGlance/Trains/All`

Real-time information for all in-service trains.

**Key Fields:** Same structure as Buses endpoint
- `TripNumber`: Train trip identifier
- `LineCode`: Rail line code (e.g., "LE" for Lakeshore East, "LSW" for Lakeshore West)
- `Display`: Destination display (e.g., "LE1 - Union Station")
- `DelaySeconds`: Current delay in seconds
- `FirstStopCode`/`LastStopCode`: Origin and destination station codes

**Note:** `ServiceAtAGlance-Trains.json` will be added when train service is available (currently captured as buses sample).

**Usage:** Real-time train tracking and departure prediction.

### ServiceAlerts-All.json
**Endpoint:** `/api/V1/ServiceUpdate/ServiceAlert/All`

Active service alerts, delays, and maintenance notices.

**Key Fields:**
- `Code`: Unique alert message code
- `SubjectEnglish`/`SubjectFrench`: Alert title in both languages
- `BodyEnglish`/`BodyFrench`: Alert description in both languages
- `Category`: "Amenity", "Service Disruption"
- `SubCategory`: Alert type (e.g., "Elevator-Escalator Disruption", "Delays")
- `Lines`: Array of affected line codes
- `Status`: "INIT" (new), "UPD" (updated), etc.

**Usage:** Filter active alerts for the selected line and display in the alerts section.

### Stop-All.json
**Endpoint:** `/api/V1/Stop/All`

Complete stop and station information for all GO Transit locations.

**Key Fields:**
- `LocationCode`: Internal stop code (e.g., "OS" for Oshawa, "UN" for Union)
- `PublicStopId`: Public-facing stop identifier
- `LocationName`: Human-readable name (e.g., "Oshawa GO", "Union Station")
- `LocationType`: Type of location (Bus Stop, Bus Terminal, Train Station, Park & Ride)

**Usage:** Station lookup and metadata for the plugin's configuration and scheduling.

### PublicSchedule-Timetable-OS-UN.json
**Endpoint:** `/schedules/en/timetable/all` (Public Schedule API)
**Base URL:** `https://api.metrolinx.com/external/go/schedules/`

**Note:** This is a separate public API (not part of the main Metrolinx Open Data API). It provides scheduled timetables between two stops for a specific date.

**Query Parameters:**
- `fromStop`: Origin station code (e.g., "OS")
- `toStop`: Destination station code (e.g., "UN")
- `date`: Date in ISO 8601 format (e.g., "2026-02-05")
- Language: Configured in URL path `/en/` or `/fr/`

**Key Fields:**
- `serviceCode`/`serviceName`: Line information (e.g., "09" = Lakeshore East)
- `departureDisplay`: Origin station name
- `arrivalDisplay`: Destination station name
- `trips`: Array of all journeys for the day
- `departureTimeDisplay`/`arrivalTimeDisplay`: Scheduled times (HH:MM format)
- `transitions`: Number of transfers (0 = direct)
- `durationMinutes`: Trip duration in minutes
- `lines`: Array of vehicle segments (bus, train) that make up each trip
- `stops`: Complete stop-by-stop itinerary

**Authentication:** None required - publicly accessible endpoint

**Response Format:** JSON (gzip compressed)

**Usage:** 
- Journey planning and trip requests
- Finding connections/transfers between two stations
- Complete itinerary information
- NOT suitable for real-time departure displays (use `/Stop/NextService/` instead)

**Important Distinction:**
- **Real-Time (Open Data API)**: `/api/V1/Stop/NextService/{StopCode}` - Shows next departures with delays
- **Scheduled (Public API)**: `/schedules/en/timetable/all` - Shows all trips for a specific date (no real-time data)

See [API_COMPARISON.md](../../../docs/API_COMPARISON.md) for detailed comparison.

## Integration Notes

1. **API Base URL:** `https://api.openmetrolinx.com/OpenDataAPI/`
2. **Authentication:** Include `?key={API_KEY}` as query parameter
3. **Rate Limiting:** Recommended polling interval: 5-15 minutes
4. **Error Handling:** All responses include `Success` and `ErrorMessage` fields

## Testing

Use these sample responses to:
- Test the plugin's data transformation logic
- Develop offline (without live API)
- Create mock data for unit tests
- Validate the plugin's handling of edge cases (delays, alerts, etc.)

## API Comparison

For manual side-by-side comparison of the two approaches:
- **See**: [API_RESPONSE_COMPARISON_GUIDE.md](API_RESPONSE_COMPARISON_GUIDE.md)

This guide provides:
- Real-time proxy API structure (station-centric departures)
- Scheduled public API structure (journey-centric trips)
- Side-by-side examples and trade-offs
- File size comparisons
- Manual comparison checklist

## Real API Access

To get a real API key for testing:
1. Visit: https://www.gotransit.com/en/open-data
2. Click "Register for API Access"
3. Complete the agreement and receive your API key
4. Add key to TRMNL plugin configuration

---

**Last Updated:** February 5, 2026
- Added `PublicSchedule-Timetable-OS-UN.json` sample response from GO Transit Public Schedule API
- See [API_COMPARISON.md](../../../docs/API_COMPARISON.md) for detailed API comparison
