# API-access-external-public vs API-access Structure

**Quick Reference Guide for Understanding the Two Metrolinx APIs**

---

## Directory Structure

```
project-resources/
├── API-access/                          # Official Metrolinx Open Data API
│   ├── README.md                        # Full documentation of authenticated API
│   ├── sample-response/                 # Real response samples
│   │   ├── Stop-NextService-OS.json    # Departures from Oshawa
│   │   ├── Stop-NextService-UN.json    # Departures from Union
│   │   ├── ServiceAtAGlance-*.json     # Real-time bus/train data
│   │   ├── ServiceAlerts-*.json        # Service alerts
│   │   └── PublicSchedule-*.json       # ⚠️ Actually from external API
│   └── [HTML docs from registration]
│
├── API-access-external-public/          # Discovered External Public API
│   ├── README.md                        # Full documentation of public API
│   ├── INTEGRATION_GUIDE.md             # How to integrate safely
│   └── sample-response/
│       ├── README.md                    # Sample analysis
│       └── Timetable-OS-UN-2026-02-05.json  # Journey response
│
└── docs/
    ├── API_COMPARISON.md                # Detailed comparison report
    └── [Other documentation]
```

---

## Quick Comparison Matrix

### API-access (Official, Authenticated)

**Base URL**: `https://api.openmetrolinx.com/OpenDataAPI/`

| Aspect | Details |
|--------|---------|
| **Status** | ✅ Official, Documented |
| **Authentication** | ✅ Required (API key) |
| **Real-Time** | ✅ Yes (delays, status) |
| **Data Scope** | 3-10 next departures per station |
| **Response Size** | Small (~2-10 KB) |
| **Best For** | Dashboard widget, "arriving soon" display |
| **Stability** | ✅ Guaranteed (official) |
| **Sample Files** | `Stop-NextService-*.json`, `ServiceAtAGlance-*.json` |

### API-access-external-public (Public, Undocumented)

**Base URL**: `https://api.metrolinx.com/external/go/schedules/`

| Aspect | Details |
|--------|---------|
| **Status** | ⚠️ Undocumented, Reverse-Engineered |
| **Authentication** | ❌ Not required (public) |
| **Real-Time** | ❌ No (scheduled only) |
| **Data Scope** | All journeys for a date between two stops |
| **Response Size** | Large (~50-100 KB) |
| **Best For** | Journey planner, "see all options" |
| **Stability** | ⚠️ Could change anytime |
| **Sample Files** | `Timetable-*.json` |

---

## Why Two Folders?

### API-access: The Official Way
- Integrated with the plugin
- Uses Cloudflare worker proxy
- Real-time predictions for departures
- Used in production
- Documented by Metrolinx

### API-access-external-public: The Discovery
- Found by reverse-engineering www.gotransit.com
- Shows what the official website uses
- Complete daily schedules for journeys
- Useful for future features
- **Not documented, use at own risk**

---

## Which One Should I Use?

### For Current Plugin (Dashboard)
→ Use **API-access** (with proxy at `gta-go-transit.gohk.xyz`)
- Real-time "arriving/next/later" display
- Includes delay information
- Official, reliable, documented

### For Journey Planner Feature
→ Consider **API-access-external-public** (with caution)
- Shows all trips for a date
- Complete itineraries
- But undocumented, use graceful fallback

### For Critical/Production Features
→ Always use **API-access** (Official API)
- Guaranteed stability
- Official support available
- Proper rate limiting
- Documentation available

---

## File Organization Rationale

The separate `API-access-external-public` folder exists to:

1. **Clearly distinguish** official vs. reverse-engineered APIs
2. **Document the discovery** for future reference
3. **Provide a safe space** to explore without affecting production code
4. **Enable comparison** between the two approaches
5. **Track assumptions** about undocumented APIs

---

## Documentation Map

| Need | Location |
|------|----------|
| **Official API Details** | `API-access/README.md` |
| **Sample Responses (Official)** | `API-access/sample-response/` |
| **Undocumented API Details** | `API-access-external-public/README.md` |
| **Sample Responses (External)** | `API-access-external-public/sample-response/` |
| **Integration Guidance** | `API-access-external-public/INTEGRATION_GUIDE.md` |
| **Detailed Comparison** | `docs/API_COMPARISON.md` |
| **Response Comparison** | `API-access/sample-response/API_RESPONSE_COMPARISON_GUIDE.md` |

---

## Usage Recommendations

### ✅ Use API-access for:
- Real-time departure boards
- Current vehicle predictions
- Delay tracking
- Production features
- Any feature that needs official support

### ✅ Use API-access-external-public for:
- Journey planning exploration
- Understanding GO Transit's technical setup
- Future enhanced features (with fallback)
- Testing and development
- Learning about API design at Metrolinx

### ❌ Never use API-access-external-public for:
- Critical production features
- Services requiring guaranteed uptime
- High-traffic applications without caching
- Any public API that's not officially documented
- Situations where service disruption would harm users

---

## Migration Strategy

If you want to add journey planner support:

```
Phase 1: Use Open Data API only
├─ Dashboard shows "arriving/next/later"
└─ Works perfectly

Phase 2: Add call to external API
├─ In try-catch wrapper
├─ With 24-hour cache
└─ Graceful fallback if unavailable

Phase 3: Monitor, iterate, improve
├─ Track response times
├─ Monitor for API changes
└─ Gather user feedback

Phase 4: Request official support
├─ Contact Metrolinx
├─ Request documented journey API
└─ Move to official endpoint if available
```

---

## Key Takeaways

1. **Two different APIs, two different purposes**
   - Official (Open Data): Real-time, authenticated, for developers
   - External (Public): Journey planning, undocumented, for website

2. **Current plugin uses the right API**
   - Metrolinx Open Data API via proxy
   - Perfect for real-time dashboard
   - Official, reliable, supported

3. **External API is useful for future features**
   - Shows complete daily schedules
   - No authentication friction
   - But not officially supported, handle carefully

4. **Always prefer official APIs in production**
   - Use Open Data API when available
   - Only use external API as supplement
   - With robust error handling and fallback

5. **This documentation is for learning and reference**
   - Track assumptions about reverse-engineered APIs
   - Enable informed decision-making
   - Support future enhancements

---

## Questions?

- **Why two folders?** To organize official API (production-ready) separately from discovered API (reference/learning)
- **Should I use the external API?** Only for non-critical features with good fallbacks
- **What if external API breaks?** That's exactly why it's documented separately, with integration warnings
- **Is this legal?** The API is public (CORS-enabled from www.gotransit.com), but undocumented

---

**Created**: February 5, 2026  
**Purpose**: Document the discovery and organize two distinct API approaches

