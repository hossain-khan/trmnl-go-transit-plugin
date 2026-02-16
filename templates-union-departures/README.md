# Union Station Departures Templates

This directory contains Liquid templates for displaying **Union Station departure board** information on TRMNL devices.

## Overview

These templates display real-time departure information from Toronto Union Station in a format similar to the [GO Transit website departure board](https://www.gotransit.com/en/find-a-station-or-stop/un/routes-departures?q=departures).

## Layout Variants

### 1. Full Layout (`full.liquid`)
- **Use Case**: Full-screen display
- **Features**: 
  - Lists 8 upcoming departures
  - Color-coded line badges
  - Complete route information
  - Platform and status indicators
- **Best For**: Dedicated departure board display

### 2. Half Horizontal Layout (`half_horizontal.liquid`)
- **Use Case**: Wide, short display
- **Features**:
  - Compact list of 5 departures
  - Essential info only
  - Optimized for horizontal space
- **Best For**: Dashboard header or banner display

### 3. Half Vertical Layout (`half_vertical.liquid`)
- **Use Case**: Tall, narrow display
- **Features**:
  - Up to 8 departures in vertical list
  - Full information per departure
  - Stacked layout for narrow widths
- **Best For**: Sidebar or portrait displays

### 4. Quadrant Layout (`quadrant.liquid`)
- **Use Case**: Most compact (quarter-screen)
- **Features**:
  - Minimal list of 4 departures
  - Essential info only
  - Smallest footprint
- **Best For**: Multi-widget dashboards

## Layout Previews

| Full Layout | Half Horizontal Layout |
|-------------|------------------------|
| ![Full Layout Demo](../project-resources/assets/demo/demo-full.png) | ![Half Horizontal Layout Demo](../project-resources/assets/demo/demo-half-horizontal.png) |

| Half Vertical Layout | Quadrant Layout |
|----------------------|-----------------|
| ![Half Vertical Layout Demo](../project-resources/assets/demo/demo-half-vertical.png) | ![Quadrant Layout Demo](../project-resources/assets/demo/demo-quadrant.png) |

## Data Structure

The templates expect data from the `/api/V1/external/departures/{station}` endpoint:

```json
{
  "stationCode": "UN",
  "trainDepartures": {
    "items": [
      {
        "lineCode": "LW",
        "service": "Lakeshore West",
        "scheduledTime": "08:47",
        "platform": "7 & 8",
        "stopsDisplay": "Exhibition-Mimico-Long Branch",
        "info": "Proceed / Avancez",
        "lineColour": "#98002e"
      }
    ]
  }
}
```

## Design Elements

### Line Color Codes
- **LW (Lakeshore West)**: `#98002e` (Burgundy)
- **LE (Lakeshore East)**: `#ff0d00` (Red)
- **KI (Kitchener)**: `#00853e` (Green)
- **BR (Barrie)**: `#003767` (Navy Blue)
- **ST (Stouffville)**: `#794500` (Brown)

### Status Indicators
- **Proceed / Avancez**: Inverted label (black background)
- **Wait / Attendez**: Outlined label

## Preview Templates

The `preview/` directory contains static versions with hardcoded sample data for design testing without API dependency.

## TRMNL Framework

All templates use the [TRMNL Framework v2](https://trmnl.com/framework/docs) design system:

- **Layout**: `layout`, `layout--col`, `flex`, `flex--row`
- **Typography**: `title`, `value`, `label`, `description`
- **Spacing**: `p--*`, `m--*`, `gap--*`, `mb--*`
- **Styling**: `text--center`, `text--gray-35`, `label--inverted`, `label--outline`

## Testing

To test with real data:
```bash
curl "https://gta-go-transit.gohk.xyz/api/V1/external/departures/UN"
```

## References

- [GO Transit Website Departures](https://www.gotransit.com/en/find-a-station-or-stop/un/routes-departures?q=departures)
- [TRMNL Framework Documentation](https://trmnl.com/framework/docs)
- [Metrolinx Open Data API](https://api.metrolinx.com/)
