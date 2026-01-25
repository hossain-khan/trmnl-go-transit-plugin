/**
 * GO Transit Data Update Script
 * 
 * This script fetches real-time GO Transit data from the Metrolinx Open Data API
 * and updates the data.json and api/data.json files for the TRMNL plugin.
 * 
 * Environment Variables:
 * - GO_TRANSIT_API_KEY: Your Metrolinx API access key
 * - STATION_ID: The station code (e.g., 'OS' for Oshawa, 'UN' for Union)
 * - LINE_FILTER: Optional filter for specific line (e.g., 'LE' for Lakeshore East)
 * - TIME_FORMAT: '12h' or '24h' (default: 12h)
 * - SHOW_ALERTS: 'true' or 'false' (default: true)
 * 
 * API Documentation: https://www.gotransit.com/en/open-data
 */

const fs = require('fs');
const path = require('path');

// Configuration from environment or defaults
const API_BASE_URL = process.env.API_BASE_URL || 'https://trmnl-go-transit-proxy.hk-c91.workers.dev';
const API_KEY = process.env.GO_TRANSIT_API_KEY;
const STATION_ID = process.env.STATION_ID || 'OS'; // Default to Oshawa
const LINE_FILTER = process.env.LINE_FILTER || 'all';
const TIME_FORMAT = process.env.TIME_FORMAT || '12h';
const SHOW_ALERTS = process.env.SHOW_ALERTS !== 'false';

// Complete station mapping (code to full name)
const STATION_NAMES = {
  // Lakeshore East
  'UN': 'Union Station',
  'EX': 'Exhibition GO',
  'DA': 'Danforth GO',
  'SC': 'Scarborough GO',
  'EG': 'Eglinton GO',
  'GU': 'Guildwood GO',
  'RO': 'Rouge Hill GO',
  'PI': 'Pickering GO',
  'PIN': 'Pickering GO',
  'AJ': 'Ajax GO',
  'WH': 'Whitby GO',
  'OS': 'Oshawa GO',
  // Lakeshore West
  'MI': 'Mimico GO',
  'LO': 'Long Branch GO',
  'PO': 'Port Credit GO',
  'CL': 'Clarkson GO',
  'OA': 'Oakville GO',
  'BO': 'Bronte GO',
  'AP': 'Appleby GO',
  'BU': 'Burlington GO',
  'AL': 'Aldershot GO',
  'HA': 'Hamilton GO Centre',
  'WR': 'West Harbour GO',
  'SCTH': 'St. Catharines GO',
  'NI': 'Niagara Falls GO',
  // Add more as needed
};

// Line stations mapping
const LINE_STATIONS = {
  'LE': ['Oshawa', 'Whitby', 'Ajax', 'Pickering', 'Rouge Hill', 'Guildwood', 'Eglinton', 'Union'],
  'LW': ['Union', 'Exhibition', 'Mimico', 'Long Branch', 'Port Credit', 'Clarkson', 'Oakville', 'Bronte', 'Appleby', 'Burlington', 'Aldershot'],
};

/**
 * Fetch data from GO Transit API via Cloudflare proxy
 */
async function fetchGOTransitData(endpoint) {
  if (!API_KEY) {
    console.log('No API key provided, using sample data');
    return null;
  }

  const url = `${API_BASE_URL}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TRMNL-GO-Transit-Plugin/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for API errors in metadata
    if (data.Metadata && data.Metadata.ErrorCode !== '200') {
      throw new Error(`API Error: ${data.Metadata.ErrorMessage}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.message);
    return null;
  }
}

/**
 * Parse time string and format for display
 */
function formatTime(timeString, format = '12h') {
  if (!timeString) return '--:--';
  
  const date = new Date(timeString.replace(' ', 'T'));
  
  if (format === '24h') {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Calculate status from scheduled vs computed time
 */
function calculateStatus(scheduledTime, computedTime) {
  if (!scheduledTime || !computedTime) return 'On Time';
  
  const scheduled = new Date(scheduledTime.replace(' ', 'T'));
  const computed = new Date(computedTime.replace(' ', 'T'));
  
  const diffMinutes = (computed - scheduled) / (1000 * 60);
  
  if (diffMinutes > 5) return 'Delayed';
  if (diffMinutes < -2) return 'Early';
  return 'On Time';
}

/**
 * Get station position on the line
 */
function getStationPosition(stationName, stations) {
  const index = stations.findIndex(s => 
    stationName.toLowerCase().includes(s.toLowerCase()) ||
    s.toLowerCase().includes(stationName.toLowerCase().replace(' GO', '').replace(' go', ''))
  );
  return index >= 0 ? index + 1 : 1;
}

/**
 * Group departures by direction
 */
function groupDeparturesByDirection(departures) {
  const directions = {};
  
  for (const dep of departures) {
    const dirKey = dep.DirectionName || dep.DirectionCode;
    if (!directions[dirKey]) {
      directions[dirKey] = [];
    }
    directions[dirKey].push(dep);
  }
  
  return directions;
}

/**
 * Get next N departures for a direction
 */
function getNextDepartures(departures, count = 3) {
  // Sort by computed departure time
  const sorted = departures
    .filter(d => d.ComputedDepartureTime)
    .sort((a, b) => {
      const timeA = new Date(a.ComputedDepartureTime.replace(' ', 'T'));
      const timeB = new Date(b.ComputedDepartureTime.replace(' ', 'T'));
      return timeA - timeB;
    });
  
  // For testing: if all times are in the past, just return the first N
  // In production, only return future departures
  const now = new Date();
  const future = sorted.filter(d => {
    const depTime = new Date(d.ComputedDepartureTime.replace(' ', 'T'));
    return depTime > now;
  });
  
  // If no future departures (e.g., sample data from past), return first N sorted
  if (future.length === 0) {
    console.log('Note: No future departures found, returning scheduled departures from sample data');
    return sorted.slice(0, count);
  }
  
  return future.slice(0, count);
}

/**
 * Generate sample data (used when API is not available)
 */
function generateSampleData() {
  const now = new Date();
  const arriving = new Date(now.getTime() + 4 * 60000); // 4 minutes
  const next = new Date(now.getTime() + 34 * 60000);    // 34 minutes
  const later = new Date(now.getTime() + 64 * 60000);   // 64 minutes

  const stationName = STATION_NAMES[STATION_ID] || 'Oshawa GO';
  const lineStations = LINE_STATIONS['LE'] || ['Oshawa', 'Whitby', 'Ajax', 'Pickering', 'Rouge Hill', 'Guildwood', 'Eglinton', 'Union'];

  return {
    station: stationName,
    line_name: 'Lakeshore East',
    line_code: 'LE',
    direction_1: {
      label: 'To Union Station',
      arriving: formatTime(arriving.toISOString(), TIME_FORMAT),
      arriving_status: 'On Time',
      next: formatTime(next.toISOString(), TIME_FORMAT),
      next_status: 'On Time',
      later: formatTime(later.toISOString(), TIME_FORMAT),
      later_status: 'On Time'
    },
    direction_2: {
      label: 'To Oshawa',
      arriving: formatTime(new Date(now.getTime() + 12 * 60000).toISOString(), TIME_FORMAT),
      arriving_status: 'On Time',
      next: formatTime(new Date(now.getTime() + 42 * 60000).toISOString(), TIME_FORMAT),
      next_status: 'On Time',
      later: formatTime(new Date(now.getTime() + 72 * 60000).toISOString(), TIME_FORMAT),
      later_status: 'On Time'
    },
    alerts: '',
    has_alerts: false,
    updated_at: now.toISOString(),
    station_position: getStationPosition(stationName, lineStations),
    total_stations: lineStations.length,
    stations: lineStations
  };
}

/**
 * Transform API data to plugin format
 */
async function transformData(nextServiceData, alertsData) {
  // If no API data, use sample
  if (!nextServiceData || !nextServiceData.NextService) {
    console.log('No API data available, using sample data');
    return generateSampleData();
  }

  const lines = nextServiceData.NextService.Lines || [];
  
  if (lines.length === 0) {
    console.log('No service data found for station, using sample data');
    return generateSampleData();
  }

  // Filter by line if specified
  let filteredLines = lines;
  if (LINE_FILTER && LINE_FILTER !== 'all') {
    filteredLines = lines.filter(l => l.LineCode === LINE_FILTER);
  }
  
  if (filteredLines.length === 0) {
    console.log(`No departures found for line ${LINE_FILTER}, using all lines`);
    filteredLines = lines;
  }

  // Get the primary line (first line or filtered line)
  const primaryLine = filteredLines[0];
  const lineCode = primaryLine.LineCode;
  const lineName = primaryLine.LineName;
  const stationName = STATION_NAMES[STATION_ID] || `${STATION_ID} GO`;
  
  // Get line stations
  const lineStations = LINE_STATIONS[lineCode] || ['Station 1', 'Station 2', 'Union'];

  // Group departures by direction
  const directionGroups = groupDeparturesByDirection(filteredLines);
  const directionKeys = Object.keys(directionGroups);
  
  // Helper to create direction object
  const createDirection = (departures, label) => {
    const nextDeps = getNextDepartures(departures, 3);
    
    if (nextDeps.length === 0) {
      return {
        label: label,
        arriving: '--:--',
        arriving_status: 'No Service',
        next: '--:--',
        next_status: 'No Service',
        later: '--:--',
        later_status: 'No Service'
      };
    }
    
    const arriving = nextDeps[0];
    const next = nextDeps[1];
    const later = nextDeps[2];
    
    return {
      label: label,
      arriving: formatTime(arriving.ComputedDepartureTime, TIME_FORMAT),
      arriving_status: calculateStatus(arriving.ScheduledDepartureTime, arriving.ComputedDepartureTime),
      next: next ? formatTime(next.ComputedDepartureTime, TIME_FORMAT) : '--:--',
      next_status: next ? calculateStatus(next.ScheduledDepartureTime, next.ComputedDepartureTime) : 'No Service',
      later: later ? formatTime(later.ComputedDepartureTime, TIME_FORMAT) : '--:--',
      later_status: later ? calculateStatus(later.ScheduledDepartureTime, later.ComputedDepartureTime) : 'No Service'
    };
  };

  // Create direction objects
  let direction1, direction2;
  
  if (directionKeys.length >= 2) {
    // Two directions available
    direction1 = createDirection(
      directionGroups[directionKeys[0]],
      directionGroups[directionKeys[0]][0].DirectionName
    );
    direction2 = createDirection(
      directionGroups[directionKeys[1]],
      directionGroups[directionKeys[1]][0].DirectionName
    );
  } else if (directionKeys.length === 1) {
    // Only one direction
    direction1 = createDirection(
      directionGroups[directionKeys[0]],
      directionGroups[directionKeys[0]][0].DirectionName
    );
    direction2 = {
      label: 'No Service',
      arriving: '--:--',
      arriving_status: 'No Service',
      next: '--:--',
      next_status: 'No Service',
      later: '--:--',
      later_status: 'No Service'
    };
  } else {
    // No directions (shouldn't happen)
    return generateSampleData();
  }

  // Process alerts
  let alertText = '';
  let hasAlerts = false;
  
  if (SHOW_ALERTS && alertsData && alertsData.Messages && alertsData.Messages.Message) {
    const messages = Array.isArray(alertsData.Messages.Message) 
      ? alertsData.Messages.Message 
      : [alertsData.Messages.Message];
    
    // Filter alerts for this line and station
    const relevantAlerts = messages.filter(msg => {
      const affectsLine = msg.Lines && msg.Lines.some(l => l.Code === lineCode);
      const affectsStation = msg.Stops && msg.Stops.some(s => s.Code === STATION_ID);
      const isServiceAlert = msg.Category === 'Service Disruption' || msg.SubCategory === 'Delays';
      
      return (affectsLine || affectsStation) && isServiceAlert;
    });
    
    if (relevantAlerts.length > 0) {
      hasAlerts = true;
      // Combine alert subjects
      alertText = relevantAlerts
        .map(a => a.SubjectEnglish)
        .join('. ') + '.';
    }
  }

  return {
    station: stationName,
    line_name: lineName,
    line_code: lineCode,
    direction_1: direction1,
    direction_2: direction2,
    alerts: alertText,
    has_alerts: hasAlerts,
    updated_at: new Date().toISOString(),
    station_position: getStationPosition(stationName, lineStations),
    total_stations: lineStations.length,
    stations: lineStations
  };
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('GO Transit Data Update Script');
  console.log('='.repeat(60));
  console.log(`Station: ${STATION_ID} (${STATION_NAMES[STATION_ID] || 'Unknown'})`);
  console.log(`Line Filter: ${LINE_FILTER}`);
  console.log(`Time Format: ${TIME_FORMAT}`);
  console.log(`Show Alerts: ${SHOW_ALERTS}`);
  console.log(`API Base: ${API_BASE_URL}`);
  console.log('='.repeat(60));
  
  try {
    // Fetch data from API
    console.log('\nFetching departure data...');
    const nextServiceData = await fetchGOTransitData(`api/V1/Stop/NextService/${STATION_ID}`);
    
    console.log('Fetching service alerts...');
    const alertsData = SHOW_ALERTS 
      ? await fetchGOTransitData('api/V1/ServiceUpdate/ServiceAlert/All')
      : null;
    
    // Transform to plugin format
    console.log('\nTransforming data...');
    const pluginData = await transformData(nextServiceData, alertsData);
    
    // Write to data files
    const dataJson = JSON.stringify(pluginData, null, 2);
    
    const rootPath = path.join(__dirname, '..');
    const dataPath = path.join(rootPath, 'data.json');
    const apiDataPath = path.join(rootPath, 'api', 'data.json');
    
    fs.writeFileSync(dataPath, dataJson);
    console.log(`✓ Written to ${dataPath}`);
    
    fs.writeFileSync(apiDataPath, dataJson);
    console.log(`✓ Written to ${apiDataPath}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ Data updated successfully!');
    console.log('='.repeat(60));
    console.log(`Station: ${pluginData.station}`);
    console.log(`Line: ${pluginData.line_name} (${pluginData.line_code})`);
    console.log(`Direction 1: ${pluginData.direction_1.label}`);
    console.log(`  - Arriving: ${pluginData.direction_1.arriving} (${pluginData.direction_1.arriving_status})`);
    console.log(`  - Next: ${pluginData.direction_1.next} (${pluginData.direction_1.next_status})`);
    console.log(`Direction 2: ${pluginData.direction_2.label}`);
    console.log(`  - Arriving: ${pluginData.direction_2.arriving} (${pluginData.direction_2.arriving_status})`);
    console.log(`  - Next: ${pluginData.direction_2.next} (${pluginData.direction_2.next_status})`);
    if (pluginData.has_alerts) {
      console.log(`Alerts: ${pluginData.alerts}`);
    }
    console.log(`Updated at: ${pluginData.updated_at}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('ERROR: Failed to update data');
    console.error('='.repeat(60));
    console.error(error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
