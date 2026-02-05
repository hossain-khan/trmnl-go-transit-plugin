# Sample Responses - External Public API

This directory contains actual API responses from the GO Transit External Public API (`https://api.metrolinx.com/external/go/schedules/`).

## Files

### Timetable-OS-UN-2026-02-05.json
**Request**: 
```
GET /schedules/en/timetable/all?fromStop=OS&toStop=UN&date=2026-02-05
```

**Details**:
- **Origin**: Oshawa GO (OS)
- **Destination**: Union Station (UN)
- **Date**: February 5, 2026
- **Trips**: 28 complete journeys
- **File Size**: ~73 KB (uncompressed)
- **Response Time**: Captured at 2026-02-05 09:00 UTC
- **Transit Types**: Mix of Bus (90B) and Rail (LE - Lakeshore East)

**Key Data Points**:
- Earliest departure: 04:00 (Bus 90B)
- Latest departure: 23:40 (Bus 90B)
- Average ride time: 60-67 minutes
- All trips are direct (0 transfers)
- Includes complete stop-by-stop itineraries

**Sample Trip**:
```json
{
  "departureTimeDisplay": "05:03",
  "arrivalTimeDisplay": "06:10",
  "transfers": 0,
  "durationMinutes": 67,
  "transitType": 1,
  "transitTypeName": "RAIL",
  "lines": [{
    "lineDisplay": "LE",
    "tripNumber": "9005",
    "fromStopTime": "05:03",
    "toStopTime": "06:10",
    "stops": [/* 10 stops total */]
  }]
}
```

**Use Cases**:
- Testing journey planner UI
- Validating data transformation logic
- Understanding API response structure
- Developing offline without live API

---

## How to Use These Samples

### 1. Direct File Usage
```javascript
// Load in Node.js
const fs = require('fs');
const zlib = require('zlib');

const filePath = 'Timetable-OS-UN-2026-02-05.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log(`${data.trips.length} trips found`);
data.trips.forEach(trip => {
  console.log(`${trip.departureTimeDisplay} → ${trip.arrivalTimeDisplay}`);
});
```

### 2. Testing API Response Handling
```javascript
// Mock API response in tests
const mockResponse = require('./Timetable-OS-UN-2026-02-05.json');

// Use in test suite
describe('Journey Planner', () => {
  it('should parse timetable response', () => {
    const trips = mockResponse.trips;
    expect(trips).toHaveLength(28);
    expect(trips[0]).toHaveProperty('departureTimeDisplay');
  });
});
```

### 3. UI Component Development
```html
<!-- Load and display sample data -->
<script>
  fetch('Timetable-OS-UN-2026-02-05.json')
    .then(r => r.json())
    .then(data => {
      displayJourneyOptions(data.trips);
    });
</script>
```

---

## Data Analysis

### Trip Distribution

| Time Range | Count | Modes |
|-----------|-------|-------|
| 00:00-06:00 | 2 | Bus |
| 06:00-12:00 | 8 | Bus, Rail |
| 12:00-18:00 | 10 | Bus, Rail |
| 18:00-24:00 | 8 | Bus, Rail |

### Transit Types

| Type | Count | Times |
|------|-------|-------|
| Bus (90B) | 4 | 04:00, 05:30, 23:40, other |
| Rail (LE) | 24 | 05:03 onwards, every 30 min |

### Duration Statistics

| Metric | Bus | Rail |
|--------|-----|------|
| Min Duration | 60 min | 66 min |
| Max Duration | 75 min | 67 min |
| Avg Duration | 65 min | 66.5 min |

---

## Validating Samples

To verify these are authentic API responses:

### Option 1: Compare with Live API
```bash
# Fetch current response
curl -s 'https://api.metrolinx.com/external/go/schedules/en/timetable/all?fromStop=OS&toStop=UN&date=2026-02-05' | \
  gunzip > /tmp/live.json

# Note: Date has changed, compare structure instead
curl -s 'https://api.metrolinx.com/external/go/schedules/en/timetable/all?fromStop=OS&toStop=UN&date=2026-02-06' | \
  gunzip > /tmp/structure-comparison.json

# Compare structure (not data since dates differ)
jq 'keys' /tmp/live.json
jq 'keys' Timetable-OS-UN-2026-02-05.json
```

### Option 2: JSON Schema Validation
All samples conform to this schema:
```json
{
  "type": "object",
  "required": ["serviceCode", "serviceName", "date", "trips"],
  "properties": {
    "serviceCode": { "type": "string" },
    "serviceName": { "type": "string" },
    "date": { "type": "string" },
    "trips": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["departureTimeDisplay", "arrivalTimeDisplay"],
        "properties": {
          "departureTimeDisplay": { "type": "string" },
          "arrivalTimeDisplay": { "type": "string" },
          "transfers": { "type": "number" },
          "durationMinutes": { "type": "number" },
          "lines": { "type": "array" }
        }
      }
    }
  }
}
```

---

## File Comparison

See parent directory's [README.md](../README.md) for comparisons with other API samples and `../../docs/API_COMPARISON.md` for comprehensive analysis.

---

**Last Updated**: February 5, 2026  
**Sample Sources**: Live API calls from https://api.metrolinx.com/external/go/schedules/

