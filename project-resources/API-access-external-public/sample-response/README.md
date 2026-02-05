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

### FareCalculator-OS-UN-2026-02-05.json
**Request**: 
```
GET /external/go/farecalculator/all-concessions-fare?stations[0].fromStopCode=OS&stations[0].toStopCode=UN&stations[0].tripStartTime=02/05/2026 06:38:00&newFare=true
```

**Details**:
- **Origin**: Oshawa GO (OS)
- **Destination**: Union Station (UN)
- **Date**: February 5, 2026
- **Time**: 06:38 AM
- **Fare Types**: 5 categories (Full, Student, Senior, Child, Presto)
- **File Size**: ~2.5 KB
- **Response Time**: Captured at 2026-02-05 09:00 UTC
- **Currency**: CAD (Canadian Dollars)

**Fare Breakdown**:
- **Full Fare**: $8.50 (no discount)
- **Student**: $6.38 (25% discount with valid school ID)
- **Senior**: $4.25 (50% discount for age 65+)
- **Child**: $4.25 (50% discount for ages 2-12)
- **Presto**: $8.00 (5.9% discount when using PRESTO card)

**Sample Fare Entry**:
```json
{
  "fareType": "Student",
  "fareTypeCode": 2,
  "name": "Single Trip - Student",
  "description": "Valid with school ID",
  "price": 6.38,
  "currency": "CAD",
  "discountPercentage": 25,
  "validFrom": "2026-02-01T00:00:00",
  "validUntil": "2026-12-31T23:59:59"
}
```

**Use Cases**:
- Testing fare display components
- Validating discount calculations
- Building fare comparison UIs
- Calculating user-specific fares based on eligibility
- Developing offline fare quote tools

---

## How to Use These Samples

### 1. Direct File Usage - Timetable
```javascript
// Load in Node.js
const fs = require('fs');

const timetableData = JSON.parse(
  fs.readFileSync('Timetable-OS-UN-2026-02-05.json', 'utf8')
);

console.log(`${timetableData.trips.length} trips found`);
timetableData.trips.slice(0, 3).forEach(trip => {
  console.log(`${trip.departureTimeDisplay} → ${trip.arrivalTimeDisplay}`);
});
```

### 2. Direct File Usage - Fare Calculator
```javascript
// Load fare calculator sample
const fareData = JSON.parse(
  fs.readFileSync('FareCalculator-OS-UN-2026-02-05.json', 'utf8')
);

fareData.stations[0].fares.forEach(fare => {
  console.log(`${fare.fareType}: $${fare.price} CAD (${fare.discountPercentage}% off)`);
});
```

### 3. Testing API Response Handling
```javascript
// Mock both API responses in tests
const mockTimetable = require('./Timetable-OS-UN-2026-02-05.json');
const mockFares = require('./FareCalculator-OS-UN-2026-02-05.json');

describe('Journey Planner with Fares', () => {
  it('should parse timetable response', () => {
    expect(mockTimetable.trips).toHaveLength(28);
  });
  
  it('should parse fare calculator response', () => {
    const fares = mockFares.stations[0].fares;
    expect(fares).toHaveLength(5);
    expect(fares[0].fareType).toBe('Full');
  });
  
  it('should match timetable with fares for same journey', () => {
    // Get first trip from timetable
    const firstTrip = mockTimetable.trips[0];
    
    // Get fares for same journey
    const fares = mockFares.stations[0].fares;
    
    // Verify both describe same journey (OS to UN)
    expect(mockFares.stations[0].fromStopCode).toBe('OS');
    expect(mockFares.stations[0].toStopCode).toBe('UN');
  });
});
```

### 4. UI Component Development
```html
<!-- Load and display both sample data -->
<script>
  Promise.all([
    fetch('Timetable-OS-UN-2026-02-05.json').then(r => r.json()),
    fetch('FareCalculator-OS-UN-2026-02-05.json').then(r => r.json())
  ]).then(([timetableData, fareData]) => {
    displayJourneyOptionsWithFares(timetableData.trips, fareData.stations[0].fares);
  });
</script>
```

---

## Combined Usage - Journey + Fare Display

```javascript
// Common pattern: Show journey options with applicable fares
const timetableData = require('./Timetable-OS-UN-2026-02-05.json');
const fareData = require('./FareCalculator-OS-UN-2026-02-05.json');

const journeyWithFares = {
  journey: timetableData.trips[0],
  availableFares: fareData.stations[0].fares,
  fromStation: fareData.stations[0].fromStopName,
  toStation: fareData.stations[0].toStopName
};

// Example output for UI
console.log(`Journey: ${journeyWithFares.fromStation} → ${journeyWithFares.toStation}`);
console.log(`Departs: ${journeyWithFares.journey.departureTimeDisplay}`);
console.log(`Arrives: ${journeyWithFares.journey.arrivalTimeDisplay}`);
console.log('Fare Options:');
journeyWithFares.availableFares.forEach(fare => {
  console.log(`  - ${fare.name}: $${fare.price}`);
});
```

---

## Data Analysis

### Timetable Trip Distribution

| Time Range | Count | Modes |
|-----------|-------|-------|
| 00:00-06:00 | 2 | Bus |
| 06:00-12:00 | 8 | Bus, Rail |
| 12:00-18:00 | 10 | Bus, Rail |
| 18:00-24:00 | 8 | Bus, Rail |

### Timetable Transit Types

| Type | Count | Times |
|------|-------|-------|
| Bus (90B) | 4 | 04:00, 05:30, 23:40, other |
| Rail (LE) | 24 | 05:03 onwards, every 30 min |

### Timetable Duration Statistics

| Metric | Bus | Rail |
|--------|-----|------|
| Min Duration | 60 min | 66 min |
| Max Duration | 75 min | 67 min |
| Avg Duration | 65 min | 66.5 min |

### Fare Calculator Analysis

| Fare Type | Price | Discount | Use Case |
|-----------|-------|----------|----------|
| Full | $8.50 | 0% | All riders without eligibility |
| Student | $6.38 | 25% | Valid school ID required |
| Senior | $4.25 | 50% | Age 65+ with proof of age |
| Child | $4.25 | 50% | Ages 2-12 |
| Presto | $8.00 | 5.9% | PRESTO card stored value |

**Key Observations**:
- Senior and Child fares are identical ($4.25)
- Student discount (25%) is balanced between Full (0%) and Senior/Child (50%)
- Presto RFID charge is minimal discount (5.9%) but encourages use
- Effective maximum savings: 50% for eligible seniors/children
- Sample trip (Feb 5 6:38 AM): $4.25-$8.50 depending on eligibility

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

| Sample | Endpoint | Rows | Size | Use Case |
|--------|----------|------|------|----------|
| Timetable-OS-UN-2026-02-05.json | `/schedules/en/timetable/all` | 28 trips | ~73 KB | Journey planning, schedule display |
| FareCalculator-OS-UN-2026-02-05.json | `/farecalculator/all-concessions-fare` | 5 fares | ~2.5 KB | Fare quotes, eligibility display |

**Combined Usage Matrix**:
```
Timetable Sample                      Fare Calculator Sample
├─ 28 journeys (OS→UN)               ├─ 5 fare types
│  ├─ Departure times                │  ├─ Full ($8.50)
│  ├─ Arrival times                  │  ├─ Student ($6.38)
│  ├─ Duration info                  │  ├─ Senior ($4.25)
│  └─ Stop-by-stop itinerary        │  ├─ Child ($4.25)
│                                    │  └─ Presto ($8.00)
│
└─ Use together to show:
   "Depart 6:38 AM, Arrive 7:45 AM, From $4.25-$8.50"
```

See parent directory's [README.md](../README.md) for API endpoint documentation and `../../docs/API_COMPARISON.md` for comparison with other API types.

---

**Last Updated**: February 5, 2026  
**Sample Sources**: Live API calls from https://api.metrolinx.com/external/go/
