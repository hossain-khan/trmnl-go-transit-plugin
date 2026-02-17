# GO Transit Dashboard - Technical Architecture

This document describes the technical architecture, project structure, and implementation details of the GO Transit Dashboard plugin.

## Template Variants

This plugin includes **two different template sets** for different use cases:

### 1. Station-to-Station Schedule (`templates/`)

Displays arrival/departure times between two stations (like a commuter schedule):

- Shows **two directions** with arriving/next/later times
- Includes **route line visualization** with station dots
- Displays **service alerts** at the bottom
- Best for: **Regular commuters** tracking specific routes

**Data Source**: Metrolinx Open Data API (`/ServiceataGlance/Trains/All`)

### 2. Union Station Departure Board (`templates-union-departures/`)

Displays real-time departure board like the GO Transit website:

- Shows **list of upcoming departures** (4-8 trains)
- Includes **color-coded line badges** (LW, LE, KI, BR, ST)
- Displays **platform numbers** and **status indicators** (Proceed/Wait)
- Shows **route information** for each departure
- Best for: **Union Station commuters** or anyone wanting a full departure board view

**Data Source**: External Public API (`/external/departures/{station}`)

> **Note**: Both template sets use the same Cloudflare Worker proxy and follow TRMNL Framework v2 design patterns.

## Project Structure

```
trmnl-go-transit-plugin/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml               # Cloudflare Worker CI/CD
│   └── copilot-instructions.md
├── cloudflare-worker/           # Cloudflare Worker proxy for Metrolinx API (LIVE)
│   ├── src/
│   │   └── index.js             # Worker implementation with Hono
│   ├── wrangler.toml            # Cloudflare configuration
│   ├── package.json
│   └── README.md
├── project-resources/
│   ├── assets/
│   │   ├── demo/                # Plugin screenshots
│   │   ├── icon/                # Plugin icons
│   │   └── logo/                # GO Transit branding
│   ├── docs/
│   │   ├── PRD.md               # Product requirements
│   │   ├── METROLINX_API.md     # API documentation
│   │   ├── PROXY_API_SERVER_PRD.md  # Proxy requirements
│   │   └── NEW_RECIPE_GUIDE.md  # Plugin creation guide
│   ├── API-access/              # API registration docs & samples
│   └── GO-GTFS/                 # GO Transit GTFS data
├── scripts/
│   └── update-go-transit.js     # Data update script
├── templates/
│   ├── full.liquid              # Full-screen layout
│   ├── half_horizontal.liquid   # Half horizontal layout
│   ├── half_vertical.liquid     # Half vertical layout
│   ├── quadrant.liquid          # Quadrant layout
│   └── preview/                 # Preview templates with sample data
├── templates-union-departures/  # Union Station departure board templates
│   ├── full.liquid              # Full departure board (8 departures)
│   ├── half_horizontal.liquid   # Compact horizontal (5 departures)
│   ├── half_vertical.liquid     # Vertical layout (8 departures)
│   ├── quadrant.liquid          # Minimal layout (4 departures)
│   ├── preview/                 # Static preview templates
│   └── README.md                # Template documentation
├── index.html                   # Local preview page (original templates)
├── preview-union-departures.html # Preview page for Union templates
├── plugin-config.yml            # User-facing configuration fields
├── settings.yml                 # TRMNL plugin settings
└── README.md
```

## Architecture

This plugin uses a **Cloudflare Worker** as a live proxy between TRMNL and the Metrolinx Open Data API:

```
TRMNL Device → Cloudflare Worker (Proxy) → Metrolinx API
```

No static data files. All transit information is fetched in real-time.

### How It Works

1. **TRMNL Device** requests data every 5-15 minutes based on user settings
2. **Request** is sent to the Cloudflare Worker proxy at `https://gta-go-transit.gohk.xyz`
3. **Cache Check**: Worker checks if the response is already cached at the edge
4. **Origin Fetch**: If not cached, worker calls the appropriate Metrolinx API
5. **Response Caching**: Response is cached with intelligent TTLs:
   - **Browser Cache**: 60 seconds
   - **Edge Cache**: 300 seconds (5 minutes)
   - **Stale While Revalidate**: 30 seconds
6. **Template Rendering**: TRMNL framework renders the data using the selected template
7. **Display**: Result appears on the TRMNL device

### API Endpoints

#### Metrolinx Open Data API (Authenticated)
- `/ServiceataGlance/Trains/All` - Real-time departure times
- `/ServiceataGlance/Buses/All` - Real-time bus departures
- `/ServiceUpdate/ServiceAlert/All` - Service alerts and delays
- `/Stop/NextService/{StopCode}` - Station-specific predictions

#### External Public API (No Auth Required)
- `/external/departures/{StationCode}` - Full departure board (like gotransit.com)

### Benefits

- **Live Data**: Real-time departure/arrival times from Metrolinx
- **Caching**: Intelligent edge caching (60s browser, 300s edge, 30s stale-while-revalidate)
- **Reliability**: Handles timeouts, errors, and retries gracefully
- **Observability**: Metrics headers (X-Cache, X-Proxy-Version, X-Proxy-Time-Ms)
- **Security**: API key stored securely in Cloudflare, not exposed to clients
- **CORS**: Enables web-based testing and development
- **Monitoring**: Request logging and cache hit/miss tracking

See [cloudflare-worker/README.md](../../cloudflare-worker/README.md) for deployment details.

## Data Sources

This plugin uses multiple Metrolinx APIs:

**Primary (Authenticated)**: [Metrolinx Open Data API](http://api.openmetrolinx.com/OpenDataAPI/Help/Index/en)
- Real-time trip updates via `/ServiceataGlance/Trains/All`
- Service alerts via `/ServiceUpdate/ServiceAlert/All`
- Station predictions via `/Stop/NextService/{StopCode}`
- Station information via GTFS data

**Alternative (No Auth Required)**: External Public API
- Real-time station departures via `/external/departures/{StationCode}`
- Full departure boards with itineraries (like gotransit.com)
- No API key required

All data is proxied through a Cloudflare Worker for improved reliability, intelligent caching, and enhanced performance.
