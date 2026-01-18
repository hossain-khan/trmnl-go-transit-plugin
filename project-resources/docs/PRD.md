This Product Requirements Document (PRD) outlines the development of a **TRMNL Recipe** designed to display real-time **GO Transit** departure and arrival information, mirroring the clean, e-ink-friendly aesthetic.

---

## **PRD: GO Transit Dashboard for TRMNL**

### **1. Product Overview**

The **GO Transit Dashboard** is a TRMNL plugin that provides commuters with "at-a-glance" status updates for their preferred GO Rail or Bus station. It utilizes the Metrolinx Open Data API to fetch real-time vehicle positions, trip updates, and service alerts.

### **2. Target Audience**

* **Daily Commuters:** Who need to know exactly when the next train is arriving before leaving their house.
* **E-ink Enthusiasts:** Users of the TRMNL display who want a distraction-free transit monitor.

### **3. Functional Requirements**

#### **3.1 User Configuration (TRMNL Web Portal)**

Users must be able to configure the following variables in their TRMNL plugin settings:

* **API Access Key:** A field to input their unique Metrolinx Open Data Access Key.
* **Home Station:** A dropdown or search field to select the primary monitoring station (e.g., "Oshawa GO").
* **Direction/Filter:** Optional toggle to filter for specific directions (e.g., "Towards Union Station").

#### **3.2 Data Integration & Logic**

The plugin's backend must interact with the **Metrolinx Open Data API**:

* **Station Information:** Fetch schedules and real-time "Trip Updates" for the configured station.
* **Service Alerts:** Fetch any active alerts or cancellations specifically impacting the user's selected line.
* **Polling Frequency:** Data should refresh every 5–10 minutes (consistent with TRMNL's battery-saving protocols).

---

### **4. Technical Specifications**

| Component | Description | API Endpoint (GO API) |
| --- | --- | --- |
| **Header** | Current Station Name & Line Icon | `/Station/All` |
| **Real-time Schedule** | Arriving/Next departure times | `/ServiceAtAGlance/All` |
| **Alerts** | Delay or maintenance text | `/ServiceAlerts/All` |
| **Authentication** | API Key header | Required for all calls |

#### **JSON Payload Example (for TRMNL Rendering)**

The plugin backend should transform Metrolinx data into a simplified JSON for the TRMNL display:

```json
{
  "station": "Oshawa GO",
  "line_name": "Lakeshore East",
  "direction_1": {
    "label": "To Union Station",
    "arriving": "9:34 PM",
    "next": "9:44 PM"
  },
  "alerts": "Starting Dec 22, maintenance on Lakeshore East line..."
}

```

---

### **5. UI/UX Design Requirements**

Since the TRMNL display is 1-bit (Black and White), the UI should follow the structure of the provided image:

* **Left Pane (Route Map):** A simplified, stylized vertical line representing the transit corridor with a "dot" indicating the current station's position relative to the line.
* **Right Pane (Schedule):** * **"Arriving"** displayed in bold, high-contrast blocks.
* **"Next"** and **"Later"** displayed in smaller or outlined text to indicate hierarchy.


* **Footer (Alerts):** A scrolling or truncated text area at the bottom for service alerts to ensure they don't crowd the schedule.

---

### **6. Success Metrics**

* **Accuracy:** Displayed times must match the official GO Transit "Real-Time" board within a 60-second margin of error.
* **Readability:** Text must be legible from 5 feet away on the physical TRMNL hardware.

---
