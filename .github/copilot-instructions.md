# TRMNL GO Transit Dashboard - Copilot Instructions

## Project Overview

This is a TRMNL plugin that displays real-time **GO Transit** departure and arrival information for commuters. It provides "at-a-glance" status updates for a user's preferred GO Rail or Bus station, utilizing the Metrolinx Open Data API. The plugin leverages the TRMNL Framework v2 to create responsive, adaptive layouts that work across all TRMNL devices.

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
- **Value**: `value value--small`, `value--xlarge`, `value--xxlarge`, `value--xxxlarge` (for numbers, symbols)
- **Label**: `label label--small`, `label--inverted` (for categories, badges)
- **Description**: `description` (for body text)

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

**Key Features**:
- Station name and line prominently displayed in header
- Route map showing station position on the line (left side)
- Departure times with status badges (right side)
- Service alerts in footer

**Layout Structure**:
```liquid
<div class="layout layout--col p--2">
  <!-- Header: Station name and line badge -->
  <div class="flex flex--row flex--between flex--center-y mb--small">
    <div class="title title--large">{{ data.station | upcase }}</div>
    <div class="label label--inverted">{{ data.line_name | upcase }}</div>
  </div>
  
  <!-- Main: Route map + Schedule -->
  <div class="flex flex--row gap--medium flex--1">
    <div class="route-map">...</div>
    <div class="schedule">...</div>
  </div>
  
  <!-- Footer: Alerts -->
  <div class="alerts">...</div>
</div>
```

**Critical Learnings**:
- Route map uses flexbox with station dots positioned along a vertical line
- `data-value-fit` essential for station names (e.g., "UNION STATION" - 13 chars)
- Use `label--inverted` for delayed status badges
- `data-clamp="2"` truncates long alert text to prevent overflow

#### 2. Half Horizontal Layout (`half_horizontal.liquid`)

**Use Case**: Half-size horizontal display (abundant horizontal space, minimal vertical)

**Key Features**:
- Station info on left, departure times spread horizontally on right
- No route map (space constraint)
- Alert indicator only (no full text)

**Layout Structure**:
```liquid
<div class="flex flex--row gap--medium p--2 flex--center-y h--full">
  <!-- Left: Station Info -->
  <div class="flex flex--col min-w--36">
    <div class="title">{{ data.station | upcase }}</div>
    <div class="description">{{ data.line_name }}</div>
  </div>
  
  <!-- Right: Departure Times in row -->
  <div class="flex flex--row gap--medium flex--1">
    <div>ARRIVING: {{ data.direction_1.arriving }}</div>
    <div>NEXT: {{ data.direction_1.next }}</div>
    <div>LATER: {{ data.direction_1.later }}</div>
  </div>
</div>
```

**Critical Learnings**:
- `flex--center-y` centers content vertically in row layouts
- **DO NOT** use `stretch` class on child containers - it conflicts with `flex--center-y`
- Horizontal layout allows all three departure times to be visible at once
- Alert shown as badge indicator (!) only, no text due to space constraints

#### 3. Half Vertical Layout (`half_vertical.liquid`)

**Use Case**: Half-size vertical display (abundant vertical space, limited horizontal)

**Key Features**:
- Station name at top, direction below
- Large "arriving" time as primary focus (center)
- Next and later times in row below
- Truncated alerts at bottom

**Critical Learnings**:
- Vertical layouts allow stacking of departure times
- Primary arrival time can be much larger (`value--xxxlarge`)
- Use `data-clamp="1"` for alerts to keep them to single line

#### 4. Quadrant Layout (`quadrant.liquid`)

**Use Case**: Quarter-size display (most compact)

**Key Features**:
- Station name and line only in header
- Single large arrival time as focus
- "Next" time shown inline with alert indicator
- No alerts text, no route map

**Critical Learnings**:
- Smallest layout requires aggressive space optimization
- Show only the most critical information: station, arriving, next
- Use badge indicator for alerts instead of text

## Design Patterns & Best Practices

### 1. Departure Time Display Structure

Standard pattern for showing departure times across all layouts:

```liquid
<!-- Arriving time (primary, largest) -->
<div class="flex flex--row flex--center-y gap--small mb--small">
  <div class="label label--small w--20">ARRIVING</div>
  <div class="value value--xxlarge" data-value-fit="true">
    {{ data.direction_1.arriving }}
  </div>
  {% if data.direction_1.arriving_status == "On Time" %}
    <div class="label label--small">{{ data.direction_1.arriving_status }}</div>
  {% else %}
    <div class="label label--small label--inverted">{{ data.direction_1.arriving_status }}</div>
  {% endif %}
</div>

<!-- Next departure (secondary, medium) -->
<div class="flex flex--row flex--center-y gap--small">
  <div class="label label--small w--20">NEXT</div>
  <div class="value value--large">{{ data.direction_1.next }}</div>
</div>
```

**Key Points**:
- `label--inverted` for delayed/cancelled status (high contrast)
- Regular `label` for "On Time" status (subtle)
- Time values use `value` class with size variants
- Fixed width (`w--20`) on labels for alignment

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
