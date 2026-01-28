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
  'OS': 'Oshawa GO',
  'WH': 'Whitby GO',
  'AJ': 'Ajax GO',
  'PI': 'Pickering GO',
  'RO': 'Rouge Hill GO',
  'GU': 'Guildwood GO',
  'EG': 'Eglinton GO',
  'UN': 'Union Station',
  // Add more stations as needed
};

// Lakeshore East line stations in order
const LAKESHORE_EAST_STATIONS = [
  'Oshawa',
  'Whitby',
  'Ajax',
  'Pickering',
  'Rouge Hill',
  'Guildwood',
  'Eglinton',
  'Union'
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
function formatTime(timeString) {
  if (!timeString) return '--:--';
  
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
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
 * Transform API data to plugin format
 */
async function transformData(serviceData, alertsData) {
  // If no API data, use sample
  if (!serviceData) {
    return generateSampleData();
  }

  // TODO: Parse actual API response and transform to plugin format
  // This will depend on the actual API response structure
  
  return generateSampleData();
}

/**
 * Main function
 */
async function main() {
  console.log('Updating GO Transit data...');
  console.log(`Station: ${STATION_ID} (${STATION_NAMES[STATION_ID] || 'Unknown'})`);
  
  // Fetch data from API
  const serviceData = await fetchGOTransitData('ServiceAtAGlance/All');
  const alertsData = await fetchGOTransitData('ServiceAlerts/All');
  
  // Transform to plugin format
  const pluginData = await transformData(serviceData, alertsData);
  
  // Write to data files
  const dataJson = JSON.stringify(pluginData, null, 2);
  
  const rootPath = path.join(__dirname, '..');
  fs.writeFileSync(path.join(rootPath, 'data.json'), dataJson);
  fs.writeFileSync(path.join(rootPath, 'api', 'data.json'), dataJson);
  
  console.log('Data updated successfully!');
  console.log(`Updated at: ${pluginData.updated_at}`);
}

main().catch(console.error);
