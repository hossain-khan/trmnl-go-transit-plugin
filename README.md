# GO Transit Dashboard for TRMNL

<img src="project-resources/assets/icon/GO_Transit_logo-square.png" align="right" alt="GO Transit Icon" width="120"/>

Real-time GO Transit departure and arrival information on your TRMNL display.

> Your commute, at a glance. Never miss another train.

## Install

**[→ Install GO Transit Dashboard](https://usetrmnl.com/recipes)**

1. Visit [TRMNL Plugins](https://usetrmnl.com/plugins)
2. Search for "**GO Transit Dashboard**"
3. Click **Install**
4. Configure your home station and API key
5. Add to your [Playlist](https://usetrmnl.com/playlists)

## Demo

| Layout | Preview |
|--------|---------|
| **Full** | <img src="project-resources/assets/demo/preview-full.png" alt="Full Layout" width="400"/> |
| **Half Horizontal** | <img src="project-resources/assets/demo/preview-half-horizontal.png" alt="Half Horizontal Layout" width="400"/> |
| **Half Vertical** | <img src="project-resources/assets/demo/preview-half-vertical.png" alt="Half Vertical Layout" width="200"/> |
| **Quadrant** | <img src="project-resources/assets/demo/preview-quadrant.png" alt="Quadrant Layout" width="200"/> |

## Features

- **Real-time Updates**: Departure times refresh every 5-15 minutes via Cloudflare Worker proxy
- **Multiple Directions**: View trains in both directions from your station
- **Service Alerts**: Stay informed about delays and maintenance
- **Station Position**: Visual indicator showing your station on the line
- **Four Layouts**: Full, half horizontal, half vertical, and quadrant views
- **E-ink Optimized**: Clean, high-contrast design for TRMNL displays
- **52+ Stations**: Support for major GO Rail stations across all lines
- **Customizable**: Time format (12h/24h), line filtering, and departure count options

## Configuration

The plugin is configurable through the TRMNL plugin settings interface:

### Required Settings

1. **Metrolinx API Key**: Your Metrolinx Open Data API access key (free)
   - Register at [Metrolinx Developer Portal](http://api.openmetrolinx.com/OpenDataAPI/Help/Registration/Register)
   - Takes 24-48 hours to activate
2. **GO Station**: Select from 52+ major GO Transit stations

### Optional Settings

- **Filter by Line**: Optionally filter departures to a specific transit line (useful for multi-line stations like Union)
- **Time Format**: Choose between 12-hour (9:34 PM) or 24-hour (21:34) format
- **Show Service Alerts**: Toggle display of active service alerts
- **Departures to Show**: Choose 2 or 3 upcoming departures per direction
- **Data Refresh Interval**: Set update frequency (5, 10, 15, or 30 minutes)

## Data Sources

This plugin uses the [Metrolinx Open Data API](http://api.openmetrolinx.com/OpenDataAPI/Help/Index/en):
- Real-time trip updates via `/ServiceataGlance/Trains/All`
- Service alerts via `/ServiceUpdate/ServiceAlert/All`
- Station information via GTFS data

Data is proxied through a Cloudflare Worker for improved reliability, caching, and performance.

## Project Structure

```
trmnl-go-transit-plugin/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml               # Cloudflare Worker CI/CD
│   │   ├── pages.yml            # GitHub Pages deployment
│   │   └── update-data.yml      # Scheduled data updates
│   └── copilot-instructions.md
├── api/
│   └── data.json                # Public API endpoint (served via GitHub Pages)
├── cloudflare-worker/           # Cloudflare Worker proxy for Metrolinx API
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
│       ├── full.liquid
│       ├── half_horizontal.liquid
│       ├── half_vertical.liquid
│       └── quadrant.liquid
├── data.json                    # Current transit data
├── index.html                   # Local preview page
├── plugin-config.yml            # User-facing configuration fields
├── settings.yml                 # TRMNL plugin settings
└── README.md
```

---

## Architecture

This plugin uses a **Cloudflare Worker** as a proxy between TRMNL and the Metrolinx API:

```
TRMNL Device → GitHub Pages (data.json) → Cloudflare Worker → Metrolinx API
```

**Benefits:**
- **Caching**: Reduces API calls and improves response times
- **Reliability**: Handles timeouts and errors gracefully
- **Security**: API key stored securely in Cloudflare, not exposed to clients
- **CORS**: Enables web-based testing and development
- **Monitoring**: Request logging and cache hit/miss tracking

See [cloudflare-worker/README.md](cloudflare-worker/README.md) for deployment details.

---

**License:** See [LICENSE](LICENSE)

**For Developers:** See [project-resources/docs/](project-resources/docs/) for development documentation.
