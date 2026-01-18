# TRMNL GO Transit Dashboard - Copilot Instructions

## Project Overview

This is a TRMNL plugin that displays real-time **GO Transit** departure and arrival information for commuters. It provides "at-a-glance" status updates for a user's preferred GO Rail or Bus station, utilizing the Metrolinx Open Data API. The plugin leverages the TRMNL Framework v2 to create responsive, adaptive layouts that work across all TRMNL devices.

**Design Reference**: Templates are adapted from the [Sound Transit Link Light Rail Dashboard](https://usetrmnl.com/plugin/sound-transit-link-light-rail-dashboard) plugin, featuring a two-direction schedule with emphasis-based time display (arriving/next/later).

## Project Structure

```
trmnl-go-transit-plugin/
├── .github/                      # GitHub configuration
│   ├── copilot-instructions.md   # This file
│   └── workflows/
│       ├── pages.yml             # GitHub Pages deployment
│       └── update-data.yml       # Scheduled data updates
├── api/                          # API endpoints
│   └── data.json                 # Current transit data (served via GitHub Pages)
├── assets/                       # Design assets
│   ├── icon/                     # Plugin icons
│   └── demo/                     # Demo screenshots
├── project-resources/            # Reference materials
│   ├── docs/
│   │   ├── PRD.md                # Product requirements
│   │   └── NEW_RECIPE_GUIDE.md   # Guide for creating recipes
│   ├── GO-GTFS/                  # GO Transit GTFS data
│   └── API-access/               # API documentation
├── scripts/                      # Build scripts
│   └── update-go-transit.js      # Data update script
├── templates/                    # Liquid templates for layouts
│   ├── full.liquid               # Full-screen layout
│   ├── half_horizontal.liquid    # Half-size horizontal layout
│   ├── half_vertical.liquid      # Half-size vertical layout
│   └── quadrant.liquid           # Quarter-size layout
├── data.json                     # Transit data for templates
├── index.html                    # Preview/testing page
├── settings.yml                  # Plugin settings configuration
└── README.md
```

## Key Files

- **templates/*.liquid**: Four layout templates that adapt to different display sizes and orientations
- **data.json**: Contains current transit data (station, departures, alerts)
- **scripts/update-go-transit.js**: Node.js script that fetches real-time data from Metrolinx API
- **api/data.json**: Public API endpoint served via GitHub Pages
- **settings.yml**: TRMNL plugin configuration

## TRMNL Framework v2

### Device Specifications

| Device | Width | Height | Bit Depth | Display Type |
|--------|-------|--------|-----------|--------------|
| TRMNL OG | 800px | 480px | 1-bit | Monochrome (2 shades) |
| TRMNL OG V2 | 800px | 480px | 2-bit | Grayscale (4 shades) |
| TRMNL V2 | 1024px | 758px | 4-bit | Grayscale (16 shades) |
| Kindle 2024 | 600px | 800px | 4-bit | Grayscale (16 shades) |

### Responsive System

The framework uses a **mobile-first** approach with three responsive dimensions:

#### 1. Size-Based Breakpoints (Progressive)

- `sm:` - 600px+ (Kindle 2024)
- `md:` - 800px+ (TRMNL OG, OG V2)
- `lg:` - 1024px+ (TRMNL V2)

**Usage**: `md:value--large lg:value--xlarge` (applies at breakpoint and above)

#### 2. Bit-Depth Variants (Specific)

- `1bit:` - Monochrome (2 shades) - TRMNL OG
- `2bit:` - Grayscale (4 shades) - TRMNL OG V2
- `4bit:` - Grayscale (16 shades) - TRMNL V2, Kindle

**Usage**: `1bit:bg--black 2bit:bg--gray-45 4bit:bg--gray-75` (each targets only that bit-depth)

#### 3. Orientation-Based (Specific)

- `portrait:` - Portrait orientation only (landscape is default)

**Usage**: `flex--row portrait:flex--col`

#### 4. Combined Modifiers

Pattern: `size:orientation:bit-depth:utility`

Example: `md:portrait:4bit:flex--col` (medium+ screens, portrait, 4-bit display)

### Core Utilities

#### Layout

- **Flexbox**: `flex flex--row`, `flex--col`, `flex--center-y`, `flex--center-x`, `flex--between`, `gap--small`, `gap--medium`
- **Grid**: `grid grid--cols-2`, `grid--cols-3`, `gap--xsmall`
- **Sizing**: `w--40`, `w--52`, `min-w--40`, `h--36`
- **Spacing**: `p--2`, `mb--xsmall`, `mb--small`, `my--24`

#### Typography

- **Title**: `title title--small`, `title--large`, `title--xlarge` (for headings, names)
- **Value**: `value value--xsmall`, `value--small`, `value--large`, `value--xlarge` (for numbers, times)
- **Label**: `label label--small` with variants:
  - `label--inverted` - White text on black background (highest emphasis, used for "arriving")
  - `label--outline` - Bordered label (medium emphasis, used for "next")
  - `label--underline` - Underlined text (section headers like "Schedule", "Alerts")
- **Description**: `description` (for body text, subtitles)
- **Item**: `item` with emphasis levels:
  - `item--emphasis-3` - Highest visual weight (arriving times)
  - `item--emphasis-2` - Medium visual weight (next times)
  - `item--emphasis-1` - Lowest visual weight (later times)

#### Visual

- **Background**: `bg--white`, `bg--gray-50`
- **Border**: `outline`, `rounded`, `rounded--large`
- **Alignment**: `text--center`, `text--left`

#### Modulations

- **data-value-fit**: Automatically resizes text to fit container
  - `data-value-fit="true"` - Enable fitting
  - `data-value-fit-max-height="120"` - Set maximum height
- **data-clamp**: Truncate text to specific lines
  - `data-clamp="1"` - Show 1 line, truncate rest

## Layout System

### Four Layout Types

The plugin provides four layouts for different display configurations:

#### 1. Full Layout (`full.liquid`)

**Use Case**: Full-screen display (entire TRMNL screen)

**Design**: Adapted from Sound Transit Link Light Rail Dashboard

**Key Features**:
- Route line visualization on the left with station dots
- Two-direction schedule with arriving/next/later times
- Service alerts section at bottom
- Station name in title bar (footer)

**Layout Structure**:
```liquid
<div class="layout layout--row p--4 gap--large mb--0">
  
  <!-- Left: Route Line Visualization -->
  <div class="route-container">
    <span class="label label--small label--inverted">{{ data.line_code }}</span>
    <span class="description">Line</span>
    <!-- Station dots along vertical line -->
    {% for station in data.stations %}
      <div class="station-dot {% if forloop.index == data.station_position %}current{% endif %}"></div>
    {% endfor %}
  </div>
  
  <div class="divider--v"></div>
  
  <!-- Right: Schedule -->
  <div class="flex flex--col flex--1">
    <span class="label label--small label--underline">Schedule</span>
    
    <!-- Two-direction time table -->
    <div class="columns time-table">
      <!-- Direction 1 & 2 with arriving/next/later -->
    </div>
    
    <!-- Alerts Section -->
    {% if data.has_alerts %}
      <div class="alerts-section">...</div>
    {% endif %}
  </div>
</div>

<!-- Title bar at bottom -->
<div class="title_bar">{{ data.station }}</div>
```

**Critical Learnings**:
- Route visualization uses CSS with `route-line-bg` and `station-dot` classes
- `label--inverted` for "arriving" badges (high emphasis)
- `label--outline` for "next" badges (medium emphasis)
- `label--underline` for section headers (Schedule, Alerts)
- `data-clamp="2"` truncates long alert text
- Title bar at bottom shows station name

#### 2. Half Horizontal Layout (`half_horizontal.liquid`)

**Use Case**: Half-size horizontal display (abundant horizontal space, minimal vertical)

**Design**: Adapted from Sound Transit Link Light Rail Dashboard

**Key Features**:
- Two-direction schedule displayed side by side
- Compact time display with arriving/next labels only (no "later")
- No route map (space constraint)
- Station name in title bar (footer)

**Layout Structure**:
```liquid
<div class="layout layout--row layout--left layout--stretch mb--0 p--3">
  
  <!-- Direction 1 -->
  <div class="flex--1">
    <span class="title title--small">{{ data.direction_1.label | split: "To " | last }}</span>
    <span class="description">{{ data.direction_1.label }}</span>
    
    <!-- Arriving -->
    <div class="item item--emphasis-3">
      <div class="content">
        <span class="label label--small label--inverted">arriving</span>
        <span class="value">{{ data.direction_1.arriving | split: " " | first }}</span>
        <span class="value value--small">{{ data.direction_1.arriving | split: " " | last }}</span>
      </div>
    </div>
    
    <!-- Next -->
    <div class="item item--emphasis-2">
      <div class="content text--gray-35">
        <span class="label label--small label--outline">next</span>
        <span class="value">{{ data.direction_1.next | split: " " | first }}</span>
      </div>
    </div>
  </div>
  
  <!-- Direction 2 (same structure) -->
</div>

<div class="title_bar">{{ data.station }}</div>
```

**Critical Learnings**:
- `item item--emphasis-3` for arriving (highest emphasis)
- `item item--emphasis-2` for next (medium emphasis)
- Time split into hours and AM/PM: `{{ time | split: " " | first }}` and `{{ time | split: " " | last }}`
- `text--gray-35` mutes the "next" time display
- Title bar at bottom shows station name

#### 3. Half Vertical Layout (`half_vertical.liquid`)

**Use Case**: Half-size vertical display (abundant vertical space, limited horizontal)

**Design**: Adapted from Sound Transit Link Light Rail Dashboard

**Key Features**:
- Two columns showing both directions
- Full arriving/next/later times for each direction
- Alerts section with truncation
- Station name in title bar (footer)

**Layout Structure**:
```liquid
<div class="layout layout--col p--3 mb--0">
  <span class="label label--small label--underline">Schedule</span>
  
  <div class="columns time-table">
    <!-- Direction 1 -->
    <div class="column">
      <span class="title title--small">{{ data.direction_1.label | split: "To " | last }}</span>
      <!-- arriving/next/later items -->
    </div>
    
    <!-- Direction 2 -->
    <div class="column">
      <!-- same structure -->
    </div>
  </div>
  
  {% if data.has_alerts %}
    <div class="alerts-section">
      <span class="label label--small label--underline">Alerts</span>
      <span class="description" data-clamp="2">{{ data.alerts }}</span>
    </div>
  {% endif %}
</div>

<div class="title_bar">{{ data.station }}</div>
```

**Critical Learnings**:
- `columns time-table` creates two-column layout
- All three time slots (arriving/next/later) fit due to vertical space
- `data-clamp="2"` limits alert text to 2 lines

#### 4. Quadrant Layout (`quadrant.liquid`)

**Use Case**: Quarter-size display (most compact)

**Design**: Adapted from Sound Transit Link Light Rail Dashboard

**Key Features**:
- Two columns showing both directions
- Only arriving/next times (no "later" - space constraint)
- No alerts section
- Station name in title bar (footer)

**Layout Structure**:
```liquid
<div class="layout layout--col p--2 mb--0">
  <div class="columns time-table">
    <!-- Direction 1 -->
    <div class="column">
      <span class="title title--small">{{ data.direction_1.label | split: "To " | last }}</span>
      <!-- arriving/next items only -->
    </div>
    
    <!-- Direction 2 -->
    <div class="column">
      <!-- same structure -->
    </div>
  </div>
</div>

<div class="title_bar">{{ data.station }}</div>
```

**Critical Learnings**:
- Most compact layout - only essential info
- Two directions with arriving/next only
- No alerts, no route visualization
- Title bar shows station name

## Design Patterns & Best Practices

### 1. Departure Time Display Structure (Sound Transit Pattern)

Standard pattern for showing departure times across all layouts:

```liquid
<!-- Arriving time (highest emphasis) -->
<div class="item item--emphasis-3">
  <div class="meta"></div>
  <div class="content">
    <span class="label label--small label--inverted mb--1">arriving</span>
    <span>
      <span class="value value--large">{{ data.direction_1.arriving | split: " " | first }}</span>
      <span class="value">{{ data.direction_1.arriving | split: " " | last }}</span>
    </span>
  </div>
</div>

<!-- Next departure (medium emphasis) -->
<div class="item item--emphasis-2">
  <div class="meta"></div>
  <div class="content text--gray-35">
    <span class="label label--small label--outline mb--1">next</span>
    <span>
      <span class="value">{{ data.direction_1.next | split: " " | first }}</span>
      <span class="value value--small">{{ data.direction_1.next | split: " " | last }}</span>
    </span>
  </div>
</div>

<!-- Later departure (low emphasis) -->
<div class="item item--emphasis-1">
  <div class="meta"></div>
  <div class="content text--gray-50">
    <span class="label label--small mb--1">later</span>
    <span>
      <span class="value value--small">{{ data.direction_1.later | split: " " | first }}</span>
      <span class="value value--xsmall">{{ data.direction_1.later | split: " " | last }}</span>
    </span>
  </div>
</div>
```

**Key Points**:
- `item item--emphasis-3` for arriving (highest visual weight)
- `item item--emphasis-2` for next (medium visual weight)
- `item item--emphasis-1` for later (lowest visual weight)
- `label--inverted` (white on black) for "arriving"
- `label--outline` (bordered) for "next"
- Plain `label` for "later"
- Times split: `{{ time | split: " " | first }}` for hours, `| last` for AM/PM
- `text--gray-35` and `text--gray-50` for muted text

### 2. Long Text Handling

For station names that may be long (e.g., "UNION STATION" - 13 characters):

```liquid
<div class="title title--large md:title--xlarge" 
     data-value-fit="true" 
     data-value-fit-max-height="60">
  {{ data.station | upcase }}
</div>
```

**Why**:
- `title` element handles long text better than `value`
- `data-value-fit` automatically resizes text to fit container
- `max-height` constraint prevents text from growing too large

For service alerts that may be very long:

```liquid
<div class="description" data-clamp="2">{{ data.alerts }}</div>
```

**Why**:
- `data-clamp="2"` limits text to 2 lines with ellipsis
- Prevents alerts from overwhelming the schedule display

### 3. Responsive Width Strategy

**Fixed widths** (for consistency):
- Use when content varies (short vs long names)
- Example: `w--52 min-w--52` in full layout
- Prevents card from shrinking with short names (e.g., Lithium)
- **WARNING**: Fixed widths (`w--52`) prevent horizontal growth - content may get cut off

**Responsive widths** (for flexibility):
- Use when adapting to different screen sizes
- Example: `w--40 md:w--44 lg:w--48` in half_horizontal
- Better space utilization across devices

**Minimum widths** (for safety):
- Always set `min-w--*` to prevent content cutoff
- Critical for atomic numbers (3-4 chars) and masses (up to 9 chars)
- **BEST PRACTICE**: Use `min-w--52` without `w--` to allow horizontal growth
- Example: Element 102's atomic mass "259.10100" (9 chars) needs room to expand

**Key Insight - Fixed vs Minimum Width**:
- `w--52 min-w--52` = **Fixed width** - Card cannot grow, content may overflow
- `min-w--52` (no `w--`) = **Minimum width** - Card can grow horizontally as needed
- Use minimum-only when content length varies significantly (atomic masses: 4-9 chars)
- Combine with `gap--small` in flex containers for proper spacing between items

### 4. Grid vs Flexbox

**Use Grid when**:
- Need precise column control (e.g., 2 or 3 columns)
- Creating responsive multi-column layouts
- Example: `grid grid--cols-1 md:grid--cols-2 lg:grid--cols-3`

**Use Flexbox when**:
- Creating single-direction flows
- Need vertical/horizontal centering
- Example: `flex flex--row flex--center-y`

### 5. Vertical Alignment

For vertically centering content in horizontal layouts:

```liquid
<div class="flex flex--row flex--center-y">
  <div>Card</div>
  <div class="flex flex--col">Details</div>
</div>
```

**Critical**: Do NOT use `stretch` class on child containers - it conflicts with `flex--center-y` by forcing containers to fill vertical space.

### 6. Spacing Hierarchy

- `gap--xsmall` - Minimal spacing (within grids)
- `gap--small` - Small spacing (between related items)
- `gap--medium` - Medium spacing (between major sections)
- `p--2` - Standard padding for layout containers
- `mb--xsmall`, `mb--small` - Bottom margins for vertical stacking

## Common Issues & Solutions

### Issue 1: Time Display Cutoff

**Problem**: Time values like "10:34 PM" get cut off in smaller layouts

**Solution**:
- Use `data-value-fit="true"` on time values
- Set appropriate `min-w--*` on containers
- Test with both AM/PM and 24-hour formats

### Issue 2: Long Station Names Breaking Layout

**Problem**: Station names like "UNION STATION" push layout

**Solution**:
- Use `title` element instead of `value`
- Add `data-value-fit="true"` with `data-value-fit-max-height`
- Wrap in constrained width container

### Issue 3: Alert Text Overflow

**Problem**: Long service alerts take too much space

**Solution**:
- Use `data-clamp="1"` or `data-clamp="2"` to limit lines
- In compact layouts, show only alert indicator (!) without text

### Issue 4: Vertical Alignment Not Working

**Problem**: `flex--center-y` not centering content

**Solution**:
- Remove `stretch` class from child containers
- `stretch` forces `align-self: stretch`, overriding parent's `align-items: center`

### Issue 5: Wasted Horizontal Space

**Problem**: Single-column layouts waste space on wide screens

**Solution**:
- Use responsive grid: `grid--cols-1 md:grid--cols-2 lg:grid--cols-3`
- Or 2-column grid for details: `grid--cols-2`

## Testing Strategy

### Test Scenarios

Critical scenarios to test (cover edge cases):

- **Short station name**: "Ajax GO" (7 chars) - tests minimum widths
- **Long station name**: "Union Station" (13 chars) - tests text fitting
- **Delayed status**: Tests `label--inverted` styling
- **Long alerts**: Tests `data-clamp` truncation
- **No alerts**: Tests conditional rendering when `has_alerts` is false
- **Multiple time formats**: "9:34 PM", "10:04 AM", "12:00 PM" - tests alignment

### Testing Override

Modify `data.json` to test specific scenarios:

```json
{
  "station": "Union Station",
  "direction_1": {
    "arriving": "10:34 PM",
    "arriving_status": "Delayed",
    "next": "11:04 PM",
    "next_status": "On Time"
  },
  "alerts": "Very long alert text to test truncation behavior...",
  "has_alerts": true
}
```

### Device Testing

Test across all responsive breakpoints:
- Small (600px+): Kindle 2024
- Medium (800px+): TRMNL OG, OG V2
- Large (1024px+): TRMNL V2

## Code Style Guidelines

1. **Use semantic class names**: `title`, `value`, `label`, `description`
2. **Follow mobile-first responsive**: Base styles first, then `md:`, then `lg:`
3. **Combine modifiers in order**: `size:orientation:bit-depth:utility`
4. **Always set minimum widths**: Prevent content cutoff
5. **Use data-value-fit for dynamic content**: Automatically handle long text
6. **Prefer grid for multi-column**: More predictable than flex-wrap
7. **Add layout padding**: `p--2` for breathing room
8. **Use gap utilities**: Better than margins for consistent spacing
9. **Test with edge cases**: Long names, long numbers, short names

## Transit Data Structure

```json
{
  "station": "Oshawa GO",
  "line_name": "Lakeshore East",
  "line_code": "LE",
  "direction_1": {
    "label": "To Union Station",
    "arriving": "9:34 PM",
    "arriving_status": "On Time",
    "next": "9:44 PM",
    "next_status": "On Time",
    "later": "10:14 PM",
    "later_status": "On Time"
  },
  "direction_2": {
    "label": "To Oshawa",
    "arriving": "9:42 PM",
    "arriving_status": "On Time",
    "next": "10:12 PM",
    "next_status": "Delayed",
    "later": "10:42 PM",
    "later_status": "On Time"
  },
  "alerts": "Starting Dec 22, maintenance on Lakeshore East line...",
  "has_alerts": true,
  "updated_at": "2026-01-18T21:30:00Z",
  "station_position": 1,
  "total_stations": 8,
  "stations": [
    "Oshawa",
    "Whitby",
    "Ajax",
    "Pickering",
    "Rouge Hill",
    "Guildwood",
    "Eglinton",
    "Union"
  ]
}
```

## Workflow

1. **Scheduled Update**: GitHub Action runs `scripts/update-go-transit.js` every 5-15 minutes
2. **API Fetch**: Script fetches real-time data from Metrolinx Open Data API
3. **Data Transform**: API response transformed to plugin JSON format
4. **Template Rendering**: TRMNL renders appropriate layout template
5. **Responsive Adaptation**: Framework applies device-specific styles
6. **Display**: Transit info appears on TRMNL device with optimized layout

### API Endpoints Used

| Endpoint | Purpose |
|----------|--------|
| `/ServiceAtAGlance/All` | Real-time departure times |
| `/ServiceAlerts/All` | Service alerts and delays |
| `/Station/All` | Station information |

## Future Considerations

- Support for additional TRMNL devices as they're released
- Enhanced bit-depth specific styling (currently minimal)
- Portrait orientation optimizations (currently using `portrait:flex--col`)
- Animation/transition effects if framework adds support
- Interactive elements if TRMNL adds touch support
