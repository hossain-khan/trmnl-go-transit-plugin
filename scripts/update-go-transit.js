/**
 * GO Transit Data Update Script
 * 
 * This script fetches real-time GO Transit data from the Metrolinx Open Data API
 * and updates the data.json and api/data.json files for the TRMNL plugin.
 * 
 * Environment Variables:
 * - GO_TRANSIT_API_KEY: Your Metrolinx API access key
 * - STATION_ID: The station code (e.g., 'OS' for Oshawa, 'UN' for Union)
 * 
 * API Documentation: http://api.openmetrolinx.com/OpenDataAPI/Help/Index/en
 * Registration: http://api.openmetrolinx.com/OpenDataAPI/Help/Registration/Register
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'https://api.openmetrolinx.com/OpenDataAPI/api/V1';
const API_KEY = process.env.GO_TRANSIT_API_KEY;
const STATION_ID = process.env.STATION_ID || 'OS'; // Default to Oshawa

// Station mapping (code to full name)
const STATION_NAMES = {
  // Lakeshore East Line
  'UN': 'Union Station',
  'EX': 'Exhibition GO',
  'DA': 'Danforth GO',
  'SC': 'Scarborough GO',
  'EG': 'Eglinton GO',
  'GU': 'Guildwood GO',
  'RO': 'Rouge Hill GO',
  'PIN': 'Pickering GO',
  'AJ': 'Ajax GO',
  'WH': 'Whitby GO',
  'OS': 'Oshawa GO',
  // Lakeshore West Line
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
  // Milton Line
  'KP': 'Kipling GO',
  'DI': 'Dixie GO',
  'CO': 'Cooksville GO',
  'ER': 'Erindale GO',
  'SR': 'Streetsville GO',
  'ME': 'Meadowvale GO',
  'LS': 'Lisgar GO',
  'ML': 'Milton GO',
  // Kitchener Line
  'BL': 'Bloor GO',
  'WE': 'Weston GO',
  'ET': 'Etobicoke North GO',
  'MA': 'Malton GO',
  'BE': 'Bramalea GO',
  'BR': 'Brampton GO',
  'MO': 'Mount Pleasant GO',
  'GE': 'Georgetown GO',
  'AC': 'Acton GO',
  'GL': 'Guelph Central GO',
  'KI': 'Kitchener GO',
  // Barrie Line
  'DW': 'Downsview Park GO',
  'RU': 'Rutherford GO',
  'MP': 'Maple GO',
  'KC': 'King City GO',
  'AU': 'Aurora GO',
  'NE': 'Newmarket GO',
  'EA': 'East Gwillimbury GO',
  'BD': 'Bradford GO',
  'BA': 'Barrie South GO',
  'AD': 'Allandale Waterfront GO',
  // Richmond Hill Line
  'OR': 'Oriole GO',
  'OL': 'Old Cummer GO',
  'LA': 'Langstaff GO',
  'RI': 'Richmond Hill GO',
  'GO': 'Gormley GO',
  // Stouffville Line
  'KE': 'Kennedy GO',
  'AG': 'Agincourt GO',
  'MK': 'Milliken GO',
  'UI': 'Unionville GO',
  'CE': 'Centennial GO',
  'MR': 'Markham GO',
  'MJ': 'Mount Joy GO',
  'ST': 'Stouffville GO',
  'LI': 'Old Elm GO'
};

// Lakeshore East line stations in order (for sample data)
const LAKESHORE_EAST_STATIONS = [
  'Union',
  'Danforth',
  'Scarborough',
  'Eglinton',
  'Guildwood',
  'Rouge Hill',
  'Pickering',
  'Ajax',
  'Whitby',
  'Oshawa'
];

/**
 * Fetch data from GO Transit API
 */
async function fetchGOTransitData(endpoint) {
  if (!API_KEY) {
    console.log('No API key provided, using sample data');
    return null;
  }

  const url = `${API_BASE_URL}/${endpoint}?key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.message);
    return null;
  }
}

/**
 * Parse time string and format for display
 */
function formatTime(timeString, use24Hour = false) {
  if (!timeString) return '--:--';
  
  const date = new Date(timeString);
  
  if (use24Hour) {
    return date.toLocaleTimeString('en-US', {
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
 * Determine departure status from API data
 */
function getDepartureStatus(scheduled, computed, departureStatus) {
  // DepartureStatus: E = Early, L = Late, O = On Time, C = Cancelled
  if (departureStatus === 'C') return 'Cancelled';
  if (departureStatus === 'L') return 'Delayed';
  
  // Check if actual time differs from scheduled
  const scheduledTime = new Date(scheduled).getTime();
  const computedTime = new Date(computed).getTime();
  const diffMinutes = Math.floor((computedTime - scheduledTime) / 60000);
  
  if (diffMinutes > 2) return 'Delayed';
  if (diffMinutes < -2) return 'Early';
  
  return 'On Time';
}

/**
 * Get station position on the line
 */
function getStationPosition(stationName, stations) {
  const index = stations.findIndex(s => 
    stationName.toLowerCase().includes(s.toLowerCase())
  );
  return index >= 0 ? index + 1 : 1;
}

/**
 * Generate sample data (used when API is not available)
 */
function generateSampleData() {
  const now = new Date();
  const arriving = new Date(now.getTime() + 4 * 60000); // 4 minutes
  const next = new Date(now.getTime() + 14 * 60000);    // 14 minutes
  const later = new Date(now.getTime() + 44 * 60000);   // 44 minutes

  return {
    station: STATION_NAMES[STATION_ID] || 'Oshawa GO',
    line_name: 'Lakeshore East',
    line_code: 'LE',
    direction_1: {
      label: 'To Union Station',
      arriving: formatTime(arriving),
      arriving_status: 'On Time',
      next: formatTime(next),
      next_status: 'On Time',
      later: formatTime(later),
      later_status: 'On Time'
    },
    direction_2: {
      label: 'To Oshawa',
      arriving: formatTime(new Date(now.getTime() + 8 * 60000)),
      arriving_status: 'On Time',
      next: formatTime(new Date(now.getTime() + 38 * 60000)),
      next_status: 'On Time',
      later: formatTime(new Date(now.getTime() + 68 * 60000)),
      later_status: 'On Time'
    },
    alerts: '',
    has_alerts: false,
    updated_at: now.toISOString(),
    station_position: getStationPosition(STATION_NAMES[STATION_ID] || 'Oshawa', LAKESHORE_EAST_STATIONS),
    total_stations: LAKESHORE_EAST_STATIONS.length,
    stations: LAKESHORE_EAST_STATIONS
  };
}

/**
 * Parse service alerts and combine them
 */
function parseAlerts(alertsData, stationId, lineCode) {
  if (!alertsData || !alertsData.Messages || !alertsData.Messages.Message) {
    return { alerts: '', has_alerts: false };
  }

  const messages = alertsData.Messages.Message;
  const relevantAlerts = messages.filter(msg => {
    // Check if alert affects this station or line
    const affectsStation = msg.Stops?.some(stop => stop.Code === stationId);
    const affectsLine = msg.Lines?.some(line => line.Code === lineCode);
    
    // Include if it affects station or line, or if it's general (no specific stops/lines)
    return affectsStation || affectsLine || (!msg.Stops?.length && !msg.Lines?.length);
  });

  if (relevantAlerts.length === 0) {
    return { alerts: '', has_alerts: false };
  }

  // Combine alerts, prioritizing service disruptions
  const alertTexts = relevantAlerts
    .filter(msg => msg.Category === 'Service Disruption' || relevantAlerts.length <= 2)
    .slice(0, 2) // Limit to 2 alerts
    .map(msg => msg.SubjectEnglish || msg.BodyEnglish)
    .join('. ');

  return {
    alerts: alertTexts,
    has_alerts: true
  };
}

/**
 * Group departures by direction
 */
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

/**
 * Get station names on the line in order
 */
function getStationsOnLine(lineCode, stationId) {
  // Map of line codes to station lists (in order along the route)
  const LINE_STATIONS = {
    'LE': ['Union', 'Danforth', 'Scarborough', 'Eglinton', 'Guildwood', 'Rouge Hill', 'Pickering', 'Ajax', 'Whitby', 'Oshawa'],
    'LW': ['Union', 'Exhibition', 'Mimico', 'Long Branch', 'Port Credit', 'Clarkson', 'Oakville', 'Bronte', 'Appleby', 'Burlington', 'Aldershot', 'Hamilton', 'West Harbour', 'St. Catharines', 'Niagara Falls'],
    'ST': ['Union', 'Kennedy', 'Agincourt', 'Milliken', 'Unionville', 'Centennial', 'Markham', 'Mount Joy', 'Stouffville', 'Old Elm'],
    'RH': ['Union', 'Oriole', 'Old Cummer', 'Langstaff', 'Richmond Hill', 'Gormley'],
    'BR': ['Union', 'Downsview Park', 'Rutherford', 'Maple', 'King City', 'Aurora', 'Newmarket', 'East Gwillimbury', 'Bradford', 'Barrie South', 'Allandale Waterfront'],
    'MI': ['Union', 'Kipling', 'Dixie', 'Cooksville', 'Erindale', 'Streetsville', 'Meadowvale', 'Lisgar', 'Milton'],
    'KI': ['Union', 'Bloor', 'Weston', 'Etobicoke North', 'Malton', 'Bramalea', 'Brampton', 'Mount Pleasant', 'Georgetown', 'Acton', 'Guelph Central', 'Kitchener'],
    'GT': ['Union', 'Bloor', 'Weston', 'Etobicoke North', 'Malton', 'Bramalea', 'Brampton', 'Mount Pleasant', 'Georgetown', 'Acton', 'Guelph Central', 'Kitchener'] // GT is same as KI (different code)
  };
  
  return LINE_STATIONS[lineCode] || ['Station A', 'Station B', 'Station C', 'Station D'];
}

/**
 * Transform API data to plugin format
 */
async function transformData(serviceData, alertsData) {
  // If no API data, use sample
  if (!serviceData || !serviceData.NextService || !serviceData.NextService.Lines) {
    console.log('No valid API data, using sample data');
    return generateSampleData();
  }

  const lines = serviceData.NextService.Lines;
  
  if (lines.length === 0) {
    console.log('No departures found, using sample data');
    return generateSampleData();
  }

  // Get station info from first line
  const firstLine = lines[0];
  const stationId = firstLine.StopCode;
  const stationName = STATION_NAMES[stationId] || `${stationId} GO`;
  const lineCode = firstLine.LineCode;
  const lineName = firstLine.LineName;

  // Group departures by direction
  const directionGroups = groupDeparturesByDirection(lines);
  const directionNames = Object.keys(directionGroups);

  // Get the two primary directions (if available)
  let direction1Data = { label: 'Direction 1', arriving: '--:--', arriving_status: 'Unknown', next: '--:--', next_status: 'Unknown', later: '--:--', later_status: 'Unknown' };
  let direction2Data = { label: 'Direction 2', arriving: '--:--', arriving_status: 'Unknown', next: '--:--', next_status: 'Unknown', later: '--:--', later_status: 'Unknown' };

  if (directionNames.length > 0) {
    const dir1Departures = directionGroups[directionNames[0]].sort((a, b) => 
      new Date(a.ScheduledDepartureTime) - new Date(b.ScheduledDepartureTime)
    );
    
    direction1Data = {
      label: directionNames[0],
      arriving: dir1Departures[0] ? formatTime(dir1Departures[0].ComputedDepartureTime) : '--:--',
      arriving_status: dir1Departures[0] ? getDepartureStatus(dir1Departures[0].ScheduledDepartureTime, dir1Departures[0].ComputedDepartureTime, dir1Departures[0].DepartureStatus) : 'Unknown',
      next: dir1Departures[1] ? formatTime(dir1Departures[1].ComputedDepartureTime) : '--:--',
      next_status: dir1Departures[1] ? getDepartureStatus(dir1Departures[1].ScheduledDepartureTime, dir1Departures[1].ComputedDepartureTime, dir1Departures[1].DepartureStatus) : 'Unknown',
      later: dir1Departures[2] ? formatTime(dir1Departures[2].ComputedDepartureTime) : '--:--',
      later_status: dir1Departures[2] ? getDepartureStatus(dir1Departures[2].ScheduledDepartureTime, dir1Departures[2].ComputedDepartureTime, dir1Departures[2].DepartureStatus) : 'Unknown'
    };
  }

  if (directionNames.length > 1) {
    const dir2Departures = directionGroups[directionNames[1]].sort((a, b) => 
      new Date(a.ScheduledDepartureTime) - new Date(b.ScheduledDepartureTime)
    );
    
    direction2Data = {
      label: directionNames[1],
      arriving: dir2Departures[0] ? formatTime(dir2Departures[0].ComputedDepartureTime) : '--:--',
      arriving_status: dir2Departures[0] ? getDepartureStatus(dir2Departures[0].ScheduledDepartureTime, dir2Departures[0].ComputedDepartureTime, dir2Departures[0].DepartureStatus) : 'Unknown',
      next: dir2Departures[1] ? formatTime(dir2Departures[1].ComputedDepartureTime) : '--:--',
      next_status: dir2Departures[1] ? getDepartureStatus(dir2Departures[1].ScheduledDepartureTime, dir2Departures[1].ComputedDepartureTime, dir2Departures[1].DepartureStatus) : 'Unknown',
      later: dir2Departures[2] ? formatTime(dir2Departures[2].ComputedDepartureTime) : '--:--',
      later_status: dir2Departures[2] ? getDepartureStatus(dir2Departures[2].ScheduledDepartureTime, dir2Departures[2].ComputedDepartureTime, dir2Departures[2].DepartureStatus) : 'Unknown'
    };
  }

  // Parse alerts
  const alertInfo = parseAlerts(alertsData, stationId, lineCode);
  
  // Get stations on the line
  const stationsOnLine = getStationsOnLine(lineCode, stationId);
  const stationPosition = getStationPosition(stationName, stationsOnLine);

  return {
    station: stationName,
    line_name: lineName,
    line_code: lineCode,
    direction_1: direction1Data,
    direction_2: direction2Data,
    alerts: alertInfo.alerts,
    has_alerts: alertInfo.has_alerts,
    updated_at: new Date().toISOString(),
    station_position: stationPosition,
    total_stations: stationsOnLine.length,
    stations: stationsOnLine
  };
}

/**
 * Main function
 */
async function main() {
  console.log('Updating GO Transit data...');
  console.log(`Station: ${STATION_ID} (${STATION_NAMES[STATION_ID] || 'Unknown'})`);
  
  // Fetch data from API
  const serviceData = await fetchGOTransitData(`Stop/NextService/${STATION_ID}`);
  const alertsData = await fetchGOTransitData('ServiceUpdate/ServiceAlert/All');
  
  // Transform to plugin format
  const pluginData = await transformData(serviceData, alertsData);
  
  // Write to data files
  const dataJson = JSON.stringify(pluginData, null, 2);
  
  const rootPath = path.join(__dirname, '..');
  fs.writeFileSync(path.join(rootPath, 'data.json'), dataJson);
  fs.writeFileSync(path.join(rootPath, 'api', 'data.json'), dataJson);
  
  console.log('Data updated successfully!');
  console.log(`Station: ${pluginData.station}`);
  console.log(`Line: ${pluginData.line_name} (${pluginData.line_code})`);
  console.log(`Direction 1: ${pluginData.direction_1.label}`);
  console.log(`  - Arriving: ${pluginData.direction_1.arriving} (${pluginData.direction_1.arriving_status})`);
  console.log(`  - Next: ${pluginData.direction_1.next} (${pluginData.direction_1.next_status})`);
  console.log(`  - Later: ${pluginData.direction_1.later} (${pluginData.direction_1.later_status})`);
  console.log(`Direction 2: ${pluginData.direction_2.label}`);
  console.log(`  - Arriving: ${pluginData.direction_2.arriving} (${pluginData.direction_2.arriving_status})`);
  console.log(`  - Next: ${pluginData.direction_2.next} (${pluginData.direction_2.next_status})`);
  console.log(`  - Later: ${pluginData.direction_2.later} (${pluginData.direction_2.later_status})`);
  console.log(`Alerts: ${pluginData.has_alerts ? 'Yes' : 'No'}`);
  console.log(`Updated at: ${pluginData.updated_at}`);
}

main().catch(console.error);
