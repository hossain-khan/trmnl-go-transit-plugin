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
**Endpoint:** `/ServiceAlerts/All`

Active service alerts, delays, and maintenance notices.

**Key Fields:**
- `AlertType`: "SERVICE_CHANGE", "DELAY", "MAINTENANCE"
- `Severity`: "MAJOR", "MINOR"
- `AffectedLines`: Which lines are impacted
- `IsActive`: Whether alert is currently active
- `StartDate`/`EndDate`: Alert duration

**Usage:** Filter active alerts for the selected line and display in the alerts section.

### Station-All.json
**Endpoint:** `/Station/All`

Complete station information including accessibility and facilities.

**Key Fields:**
- `StationId`: Unique identifier
- `StationName`: Display name
- `Latitude`/`Longitude`: Geographic coordinates
- `AccessibilityFeatures`: Available accessibility options
- `Facilities`: Available amenities
- `ServiceLines`: Which GO lines serve this station

**Usage:** Station lookup and metadata for the plugin's configuration.

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

## Real API Access

To get a real API key for testing:
1. Visit: https://www.gotransit.com/en/open-data
2. Click "Register for API Access"
3. Complete the agreement and receive your API key
4. Add key to TRMNL plugin configuration

---

**Last Updated:** January 24, 2026
