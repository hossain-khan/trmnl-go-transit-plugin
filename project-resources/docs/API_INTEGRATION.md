# GO Transit API Integration Guide

This document explains how the GO Transit Dashboard plugin integrates with the Metrolinx Open Data API to provide real-time departure information.

## Architecture Overview

```
┌─────────────────────┐
│  Metrolinx API      │
│  (api.openmetrolinx │
│   .com)             │
└──────────┬──────────┘
           │
           │ (1) GitHub Actions fetches data
           │     with API key every 5-15 min
           ▼
┌─────────────────────┐
│  GitHub Actions     │
│  (update-go-        │
│   transit.js)       │
└──────────┬──────────┘
           │
           │ (2) Transforms and commits
           │     data.json to repository
           ▼
┌─────────────────────┐
│  GitHub Pages       │
│  (hossain-khan.     │
│   github.io)        │
└──────────┬──────────┘
           │
           │ (3) TRMNL fetches JSON
           │     every 5 minutes
           ▼
┌─────────────────────┐
│  TRMNL Device       │
│  (Renders Liquid    │
│   templates)        │
└─────────────────────┘
```

## Data Flow

### 1. API Data Fetching (GitHub Actions)

The GitHub Actions workflow (`update-data.yml`) runs the `scripts/update-go-transit.js` script:

**Endpoints Used:**
- `GET /api/V1/Stop/NextService/{StopCode}` - Get next departures for a station
- `GET /api/V1/ServiceUpdate/ServiceAlert/All` - Get service alerts

**Environment Variables:**
- `GO_TRANSIT_API_KEY` - Metrolinx API key (stored as GitHub secret)
- `STATION_ID` - Station code (e.g., 'OS' for Oshawa, 'UN' for Union)

### 2. Data Transformation

The script transforms API responses into the plugin format:

**Input (API Response):**
```json
{
  "NextService": {
    "Lines": [
      {
        "StopCode": "OS",
        "LineCode": "LE",
        "LineName": "Lakeshore East",
        "DirectionName": "LE - Union Station",
        "ScheduledDepartureTime": "2026-01-24 18:09:00",
        "ComputedDepartureTime": "2026-01-24 18:09:00",
        "DepartureStatus": "E"
      }
    ]
  }
}
```

**Output (Plugin Format):**
```json
{
  "station": "Oshawa GO",
  "line_name": "Lakeshore East",
  "line_code": "LE",
  "direction_1": {
    "label": "LE - Union Station",
    "arriving": "6:09 PM",
    "arriving_status": "On Time",
    "next": "6:39 PM",
    "next_status": "On Time",
    "later": "7:09 PM",
    "later_status": "On Time"
  },
  "direction_2": {
    "label": "LE - Oshawa GO",
    "arriving": "6:15 PM",
    "arriving_status": "Delayed",
    "next": "6:45 PM",
    "next_status": "On Time",
    "later": "7:15 PM",
    "later_status": "On Time"
  },
  "alerts": "Service delays expected. Minor delays of 5-10 minutes.",
  "has_alerts": true,
  "updated_at": "2026-01-29T18:30:00Z",
  "station_position": 1,
  "total_stations": 10,
  "stations": ["Union", "Danforth", "...", "Oshawa"]
}
```

### 3. Key Transformation Features

#### Departure Status Calculation

The script determines departure status by comparing scheduled vs. computed times:

- **On Time**: Difference ≤ 2 minutes
- **Delayed**: Computed time > scheduled by more than 2 minutes
- **Early**: Computed time < scheduled by more than 2 minutes
- **Cancelled**: DepartureStatus = 'C'

```javascript
function getDepartureStatus(scheduled, computed, departureStatus) {
  if (departureStatus === 'C') return 'Cancelled';
  if (departureStatus === 'L') return 'Delayed';
  
  const scheduledTime = new Date(scheduled).getTime();
  const computedTime = new Date(computed).getTime();
  const diffMinutes = Math.floor((computedTime - scheduledTime) / 60000);
  
  if (diffMinutes > 2) return 'Delayed';
  if (diffMinutes < -2) return 'Early';
  
  return 'On Time';
}
```

#### Direction Grouping

Departures are grouped by `DirectionName` to show two primary directions:

```javascript
function groupDeparturesByDirection(lines) {
  const directions = {};
  lines.forEach(line => {
    const directionName = line.DirectionName;
    if (!directions[directionName]) {
      directions[directionName] = [];
    }
    directions[directionName].push(line);
  });
  return directions;
}
```

#### Alert Filtering

Service alerts are filtered to show only relevant alerts for the station/line:

```javascript
function parseAlerts(alertsData, stationId, lineCode) {
  const relevantAlerts = messages.filter(msg => {
    const affectsStation = msg.Stops?.some(stop => stop.Code === stationId);
    const affectsLine = msg.Lines?.some(line => line.Code === lineCode);
    return affectsStation || affectsLine || (!msg.Stops?.length && !msg.Lines?.length);
  });
  // ... combine and format alerts
}
```

### 4. GitHub Pages Deployment

The `pages.yml` workflow deploys the repository to GitHub Pages, making `api/data.json` accessible at:

```
https://hossain-khan.github.io/trmnl-go-transit-plugin/api/data.json
```

### 5. TRMNL Plugin Configuration

The `settings.yml` file configures TRMNL to fetch data:

```yaml
merge_tag:
  - tag_name: data
    source: https://hossain-khan.github.io/trmnl-go-transit-plugin/api/data.json
    merge_object: false
```

Templates access data using Liquid syntax:
```liquid
{{ data.station }}
{{ data.direction_1.arriving }}
{{ data.direction_1.arriving_status }}
```

## Station Codes

The script supports 67+ GO Transit stations across all lines:

### Lakeshore East Line
- `UN` - Union Station
- `DA` - Danforth GO
- `SC` - Scarborough GO
- `EG` - Eglinton GO
- `GU` - Guildwood GO
- `RO` - Rouge Hill GO
- `PIN` - Pickering GO
- `AJ` - Ajax GO
- `WH` - Whitby GO
- `OS` - Oshawa GO

### Lakeshore West Line
- `EX` - Exhibition GO
- `MI` - Mimico GO
- `LO` - Long Branch GO
- `PO` - Port Credit GO
- `CL` - Clarkson GO
- `OA` - Oakville GO
- And more...

*(See `scripts/update-go-transit.js` for complete list)*

## Line Codes

- `LE` - Lakeshore East
- `LW` - Lakeshore West
- `ST` - Stouffville
- `RH` - Richmond Hill
- `BR` - Barrie
- `MI` - Milton
- `KI` - Kitchener
- `GT` - Kitchener (alternate code)

## Testing

### Local Testing (Without API Key)

When no API key is provided, the script generates sample data:

```bash
cd /home/runner/work/trmnl-go-transit-plugin/trmnl-go-transit-plugin
node scripts/update-go-transit.js
```

Output:
```
Updating GO Transit data...
Station: OS (Oshawa GO)
No API key provided, using sample data
Data updated successfully!
```

### Testing with API Key

```bash
export GO_TRANSIT_API_KEY="your-api-key-here"
export STATION_ID="UN"  # Test with Union Station
node scripts/update-go-transit.js
```

### Validating Output

Check the generated data:
```bash
cat data.json | jq '.station, .line_name, .direction_1'
```

Expected output:
```json
"Union Station"
"Lakeshore East"
{
  "label": "LE - Durham College Oshawa GO",
  "arriving": "6:09 PM",
  "arriving_status": "On Time",
  ...
}
```

## Error Handling

The script includes multiple fallback mechanisms:

1. **No API Key**: Uses generated sample data
2. **API Request Fails**: Logs error and uses sample data
3. **Invalid Response**: Validates response structure before parsing
4. **No Departures Found**: Falls back to sample data
5. **Missing Station Data**: Uses generic station names

## Cloudflare Worker (Alternative Access)

The Cloudflare Worker provides an alternative way to access the API with caching:

**Deployment:** `https://trmnl-go-transit-proxy.hk-c91.workers.dev`

**Usage:**
```bash
curl "https://trmnl-go-transit-proxy.hk-c91.workers.dev/api/V1/Stop/NextService/OS"
```

The worker automatically:
- Adds authentication
- Caches responses (5 minutes)
- Handles CORS
- Provides error handling

## Maintenance

### Adding New Stations

To add a new station:

1. Add to `STATION_NAMES` in `scripts/update-go-transit.js`:
```javascript
const STATION_NAMES = {
  'NEW': 'New Station GO',
  // ... existing stations
};
```

2. Add to appropriate line in `getStationsOnLine()`:
```javascript
const LINE_STATIONS = {
  'LE': ['Union', '...', 'New Station', 'Oshawa'],
  // ... other lines
};
```

3. Add to `plugin-config.yml` options if desired

### Updating API Endpoints

If Metrolinx changes their API:

1. Update `API_BASE_URL` in `scripts/update-go-transit.js`
2. Update endpoint paths in `main()` function
3. Update transformation logic in `transformData()` if response format changes

## Troubleshooting

### "No API key provided, using sample data"

**Cause:** `GO_TRANSIT_API_KEY` environment variable not set  
**Solution:** Set the environment variable or add to GitHub secrets

### "No departures found"

**Cause:** No scheduled trains at the requested time or invalid station code  
**Solution:** 
- Verify station code is correct
- Check if trains are running at that time
- Review API response in logs

### "API request failed: 401"

**Cause:** Invalid or expired API key  
**Solution:** Verify API key is correct and active

### Templates not rendering data

**Cause:** Data structure mismatch  
**Solution:** Verify `data.json` structure matches template expectations

## Security Notes

- **API Keys**: Never commit API keys to git. Use GitHub secrets.
- **Rate Limiting**: The API may have rate limits. Use caching appropriately.
- **Data Privacy**: GO Transit data is public, but respect API terms of service.

## Future Enhancements

Potential improvements:

1. **Line Filtering**: Support filtering by line code (for multi-line stations)
2. **Time Format**: Support 24-hour time format option
3. **Multi-Station**: Support multiple favorite stations
4. **Historical Data**: Store departure time accuracy statistics
5. **Bus Support**: Add GO Bus route support (currently train-only)

## References

- [Metrolinx Open Data API Documentation](http://api.openmetrolinx.com/OpenDataAPI/Help/Index/en)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [TRMNL Plugin Documentation](https://help.usetrmnl.com/)
- [Liquid Template Language](https://shopify.github.io/liquid/)
