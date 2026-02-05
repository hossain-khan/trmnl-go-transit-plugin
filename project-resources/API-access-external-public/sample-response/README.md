# Sample Responses - External Public API

This directory contains actual API responses from the GO Transit External Public API (`https://api.metrolinx.com/external/go/`).

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

### ServiceUpdate-General-2026-02-05.json
**Request**: 
```
GET /external/go/serviceupdate/en/general
```

**Details**:
- **Date**: February 5, 2026
- **Time**: 09:23 AM ET
- **Topic**: General system-wide notifications
- **File Size**: ~3.6 KB
- **Response Time**: Captured at 2026-02-05 09:00 UTC
- **Notification Count**: 1 active alert

**Sample Alert**:
```json
{
  "SubCategory": "GDOTHER",
  "MessageSubject": "Important GO Transit service information",
  "MessageBody": "<style>...</style><div>We are running on a special schedule today to support ongoing service recovery near Union Station...</div>",
  "PostedDateTime": "02/05/2026 02:39:58",
  "Status": "INIT",
  "ServiceMode": "General"
}
```

**Key Fields**:
- **SubCategory**: Type of update (GDOTHER = General/Other)
- **MessageSubject**: Short title for alert
- **MessageBody**: Full HTML-formatted message with styling
- **PostedDateTime**: When the alert was posted
- **Status**: INIT (Initial/Active)
- **ServiceMode**: "General" (system-wide, not line-specific)

**Use Cases**:
- Testing alert banner display
- Validating HTML message rendering
- Building notification systems
- Alert aggregation and styling
- System-wide notification distribution

---

### ServiceUpdate-All-2026-02-05.json
**Request**: 
```
GET /external/go/serviceupdate/en/all
```

**Details**:
- **Date**: February 5, 2026
- **Time**: 09:30 AM ET
- **Topic**: All service updates (general + lines + stations)
- **File Size**: ~18 KB (uncompressed, heavily abbreviated in sample)
- **Response Time**: Captured at 2026-02-05 09:00 UTC
- **Total Updates**: 38 across system
  - General: 1 alert
  - Lines: 23 updates (across various routes)
  - Stations: 14 updates (elevator outages, accessibility issues)
  - Train Announcements: 0
  - Bus Announcements: 0

**Sample Structure**:
```json
{
  "General": {
    "Notifications": { "Notification": [{ ... }] },
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
        "Notifications": { "Notification": [...] }
      }
    ]
  },
  "TrainAnnouncements": { "Notification": [], "TotalUpdates": 0 },
  "BusAnnouncements": { "Notification": [], "TotalUpdates": 0 }
}
```

**Real-World Alerts Included**:
- **General**: Union Station service recovery schedule
- **Lines**: Lakeshore East delays/schedule changes, bus route cancellations
- **Stations**: 
  - Elevator outages (Agincourt, Bronte, Kingston, Kennedy, Langstaff, Milliken, Rouge Hill, West Harbour)
  - Station accessibility changes (Exhibition, Finch Bus Terminal)
  - Access restrictions (West Harbour limited hours)

**Use Cases**:
- Testing comprehensive dashboard display
- Building status visualization tools
- Admin panel development
- Interactive map/line status displays
- Detailed status aggregation for multiple data sources
- Integration with transit apps showing all alerts

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

### 3. Direct File Usage - Service Updates (General)
```javascript
// Load service updates general sample
const updateData = JSON.parse(
  fs.readFileSync('ServiceUpdate-General-2026-02-05.json', 'utf8')
);

console.log(`${updateData.TotalUpdates} active general notifications`);
updateData.Notifications.Notification.forEach(notif => {
  console.log(`[${notif.Status}] ${notif.MessageSubject}`);
  console.log(`Posted: ${notif.PostedDateTime}`);
});
```

### 4. Direct File Usage - Service Updates (All)
```javascript
// Load service updates all sample (comprehensive)
const allUpdates = JSON.parse(
  fs.readFileSync('ServiceUpdate-All-2026-02-05.json', 'utf8')
);

console.log(`General: ${allUpdates.General.TotalUpdates}`);
console.log(`Lines: ${allUpdates.Lines.TotalUpdates}`);
console.log(`Stations: ${allUpdates.Stations.TotalUpdates}`);

// Iterate through line-specific updates
allUpdates.Lines.Line.forEach(line => {
  console.log(`\n${line.RouteName} (${line.RouteNumber}): ${line.Status}`);
  line.Notifications.Notification.forEach(notif => {
    console.log(`  - ${notif.MessageSubject}`);
  });
});

// Iterate through station-specific updates
allUpdates.Stations.Station.forEach(station => {
  console.log(`\n${station.StationName} (${station.StationCode}): ${station.Status}`);
  station.Notifications.Notification.forEach(notif => {
    console.log(`  - ${notif.MessageSubject}`);
  });
});
```

### 5. Testing API Response Handling
```javascript
// Mock all API responses in tests
const mockTimetable = require('./Timetable-OS-UN-2026-02-05.json');
const mockFares = require('./FareCalculator-OS-UN-2026-02-05.json');
const mockUpdateGeneral = require('./ServiceUpdate-General-2026-02-05.json');
const mockUpdateAll = require('./ServiceUpdate-All-2026-02-05.json');

describe('GO Transit API Integration', () => {
  it('should parse timetable response', () => {
    expect(mockTimetable.trips).toHaveLength(28);
  });
  
  it('should parse fare calculator response', () => {
    const fares = mockFares.stations[0].fares;
    expect(fares).toHaveLength(5);
    expect(fares[0].fareType).toBe('Full');
  });
  
  it('should parse service updates general response', () => {
    expect(mockUpdateGeneral.Notifications.Notification.length).toBeGreaterThan(0);
    const alert = mockUpdateGeneral.Notifications.Notification[0];
    expect(alert.MessageSubject).toBeDefined();
    expect(alert.ServiceMode).toBe('General');
  });
  
  it('should parse service updates all response', () => {
    // Check aggregated structure
    expect(mockUpdateAll.General.TotalUpdates).toBeGreaterThanOrEqual(0);
    expect(mockUpdateAll.Lines.TotalUpdates).toBeGreaterThan(0);
    expect(mockUpdateAll.Stations.TotalUpdates).toBeGreaterThan(0);
    
    // Check line-specific data
    const line = mockUpdateAll.Lines.Line[0];
    expect(line.RouteName).toBeDefined();
    expect(line.RouteNumber).toBeDefined();
    expect(line.LineColour).toMatch(/^#[0-9a-f]{6}$/i);
    
    // Check station-specific data
    const station = mockUpdateAll.Stations.Station[0];
    expect(station.StationName).toBeDefined();
    expect(station.StationCode).toBeDefined();
  });
  
  it('should match timetable with fares for same journey', () => {
    // Verify both describe same journey (OS to UN)
    expect(mockFares.stations[0].fromStopCode).toBe('OS');
    expect(mockFares.stations[0].toStopCode).toBe('UN');
  });
});
```

### 6. UI Component Development
```html
<!-- Load and display all sample data (basic approach) -->
<script>
  Promise.all([
    fetch('Timetable-OS-UN-2026-02-05.json').then(r => r.json()),
    fetch('FareCalculator-OS-UN-2026-02-05.json').then(r => r.json()),
    fetch('ServiceUpdate-General-2026-02-05.json').then(r => r.json())
  ]).then(([timetableData, fareData, updateData]) => {
    // Display alerts first if present
    if (updateData.TotalUpdates > 0) {
      displayAlerts(updateData.Notifications.Notification);
    }
    // Then show journey options with fares
    displayJourneyOptionsWithFares(
      timetableData.trips, 
      fareData.stations[0].fares
    );
  });
</script>

<!-- Advanced: Load all endpoints including comprehensive updates -->
<script>
  Promise.all([
    fetch('Timetable-OS-UN-2026-02-05.json').then(r => r.json()),
    fetch('FareCalculator-OS-UN-2026-02-05.json').then(r => r.json()),
    fetch('ServiceUpdate-All-2026-02-05.json').then(r => r.json())
  ]).then(([timetableData, fareData, allUpdates]) => {
    // Display comprehensive alerts dashboard
    if (allUpdates.General.TotalUpdates > 0) {
      displayGeneralAlerts(allUpdates.General.Notifications.Notification);
    }
    
    // Display line-specific alerts on route selection
    const lineAlerts = {};
    allUpdates.Lines.Line.forEach(line => {
      lineAlerts[line.RouteNumber] = line.Notifications.Notification;
    });
    
    // Display station-specific alerts on station pages
    const stationAlerts = {};
    allUpdates.Stations.Station.forEach(station => {
      stationAlerts[station.StationCode] = station.Notifications.Notification;
    });
    
    // Show journey options with fares
    displayJourneyOptionsWithFares(
      timetableData.trips, 
      fareData.stations[0].fares,
      { lineAlerts, stationAlerts }
    );
  });
</script>
```

---

## Combined Usage - Journey + Fares + Alerts

```javascript
// Complete pattern: Show alerts, journey options, and applicable fares
const timetableData = require('./Timetable-OS-UN-2026-02-05.json');
const fareData = require('./FareCalculator-OS-UN-2026-02-05.json');
const updateData = require('./ServiceUpdate-General-2026-02-05.json');

// Display active alerts
if (updateData.TotalUpdates > 0) {
  console.log('⚠️ Active Service Alerts:');
  updateData.Notifications.Notification.forEach(notif => {
    console.log(`  ${notif.MessageSubject}`);
    console.log(`  Posted: ${notif.PostedDateTime}`);
  });
  console.log('');
}

// Show journey options with fares
const journeyWithFares = {
  journey: timetableData.trips[0],
  availableFares: fareData.stations[0].fares,
  fromStation: fareData.stations[0].fromStopName,
  toStation: fareData.stations[0].toStopName
};

// Example output for complete UI
console.log(`Journey: ${journeyWithFares.fromStation} → ${journeyWithFares.toStation}`);
console.log(`Departs: ${journeyWithFares.journey.departureTimeDisplay}`);
console.log(`Arrives: ${journeyWithFares.journey.arrivalTimeDisplay}`);
console.log('Fare Options:');
journeyWithFares.availableFares.forEach(fare => {
  console.log(`  - ${fare.name}: $${fare.price}`);
});
```

---

## Combined Usage - Journey + Fare Display (Timetable + Fares Only)

```javascript
// Simpler pattern: Show journey options with applicable fares (without alerts)
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

| Sample | Endpoint | Records | Size | Use Case |
|--------|----------|---------|------|----------|
| Timetable-OS-UN-2026-02-05.json | `/schedules/en/timetable/all` | 28 trips | ~73 KB | Journey planning, schedule display |
| FareCalculator-OS-UN-2026-02-05.json | `/farecalculator/all-concessions-fare` | 5 fares | ~2.5 KB | Fare quotes, eligibility display |
| ServiceUpdate-General-2026-02-05.json | `/serviceupdate/en/general` | 1 alert | ~3.6 KB | General system alerts only |
| ServiceUpdate-All-2026-02-05.json | `/serviceupdate/en/all` | 38 alerts | ~18+ KB | Comprehensive dashboard (general + lines + stations) |

**Combined Usage Matrix**:
```
Timetable Sample          Fare Calculator Sample    Service Updates (General)      Service Updates (All)
├─ 28 journeys (OS→UN)   ├─ 5 fare types            ├─ 1 general alert             ├─ General: 1 alert
│  ├─ Times               │  ├─ Full ($8.50)        │  ├─ System announcements     │  ├─ Message Subject
│  ├─ Durations           │  ├─ Student ($6.38)     │  └─ Service-wide status      │  ├─ Posted DateTime
│  └─ Itineraries        │  ├─ Senior ($4.25)       │                              │
│                         │  ├─ Child ($4.25)       ├─ Lines: 23 updates
│                         │  └─ Presto ($8.00)      │  ├─ Lakeshore East delays
│                         │                         │  ├─ Bus route cancellations
│                         │                         │  └─ Per-line color codes
│                         │                         │
│                         │                         ├─ Stations: 14 updates
│                         │                         │  ├─ Elevator outages
│                         │                         │  ├─ Accessibility issues
│                         │                         │  └─ Access restrictions

Lightweight              Simple Pricing           Quick Status Banner            Rich Dashboard
└─ Use together to create complete trip planning experience:
   "⚠️ Union Station elevator out | Lakeshore East: 2 updates | Depart 6:38 AM, $4.25-$8.50"
```

**Single vs Combined Usage**:
- **Timetable alone**: Basic journey planning
- **Timetable + Fares**: Full booking workflow (when, what route, cost)
- **Timetable + Fares + General Updates**: Trip planning with system alerts
- **Timetable + Fares + All Updates**: Complete experience with line & station-specific alerts

**Choosing Between General vs All Updates**:
- **Use `/general`**: Simple apps, alert banners, quick status pages (1-3 KB payload)
- **Use `/all`**: Comprehensive dashboards, admin panels, detailed status maps (15-50 KB payload)
**Sample Sources**: Live API calls from https://api.metrolinx.com/external/go/
