# Feature: Heat Maps and Demand Visualization

## Overview

Visualize demand patterns and vehicle availability across geographic areas using heat maps and density visualizations. The system generates heat maps showing booking demand by location, vehicle availability density, and historical demand patterns. Fleet managers use these visualizations to optimize fleet distribution, identify high-demand areas for repositioning, and make data-driven decisions about vehicle allocation.

## Sprint Category

sprint-01

## Feature ID

F-INT-MAP-010

## User Stories

As a fleet manager, I want to visualize demand patterns and vehicle availability across geographic areas, so that I can optimize fleet distribution.

As a business analyst, I want to see historical demand heat maps, so that I can identify trends and plan for seasonal variations.

As a platform operator, I want demand visualization to inform dynamic pricing decisions, so that I can maximize revenue in high-demand areas.

## Frontend Specifications

### Pages

- Fleet Management Dashboard with Heat Map View
- Analytics Dashboard with Demand Visualization
- Vehicle Repositioning Tool with Heat Map Overlay
- Pricing Strategy Page with Demand Heat Maps

### UI Components

**Heat Map Viewer**:
- Interactive map with heat map overlay
- Intensity gradient (blue: low, yellow: medium, red: high)
- Opacity slider for heat map layer
- Toggle heat map on/off
- Legend showing intensity scale
- Time range selector (today, this week, this month, custom)
- Heat map type selector (demand, availability, revenue)

**Heat Map Controls**:
- Date range picker
- Time of day filter (morning, afternoon, evening, night)
- Day of week filter (weekdays, weekends, specific days)
- Vehicle type filter
- Metric selector (bookings, revenue, utilization)
- Refresh button
- Export button (PNG, PDF)

**Demand Statistics Panel**:
- Total bookings in selected area
- Average demand by time of day
- Peak demand hours
- Demand trend (increasing, stable, decreasing)
- Comparison to previous period
- Top 5 high-demand locations

**Fleet Distribution Overlay**:
- Current vehicle locations as markers
- Heat map showing demand
- Mismatch indicators (high demand, low supply)
- Suggested repositioning actions
- Estimated revenue impact of repositioning

**Demand Forecast Widget**:
- Predicted demand for next 7 days
- Confidence intervals
- Historical comparison
- Event-based predictions (holidays, conferences)
- Weather impact on demand

### User Flows

**Viewing Demand Heat Map**:
1. Fleet manager opens analytics dashboard
2. Selects "Demand Heat Map" view
3. System loads booking data for selected time range
4. Generates heat map showing demand intensity
5. Displays heat map overlay on map
6. Fleet manager adjusts time range to see patterns
7. Identifies high-demand areas (red zones)
8. Identifies low-demand areas (blue zones)
9. Compares demand to current vehicle distribution
10. Identifies repositioning opportunities

**Fleet Repositioning Based on Heat Map**:
1. Fleet manager views demand heat map
2. Overlays current vehicle locations
3. Identifies mismatch (high demand area with few vehicles)
4. Clicks "Suggest Repositioning" button
5. System calculates optimal vehicle moves
6. Displays suggested repositioning plan
7. Shows estimated revenue impact
8. Fleet manager approves repositioning
9. System creates repositioning tasks for drivers
10. Monitors impact on demand fulfillment

**Historical Demand Analysis**:
1. Business analyst opens analytics dashboard
2. Selects historical time range (last 3 months)
3. System generates heat map for each week
4. Displays time-lapse animation of demand changes
5. Identifies seasonal patterns
6. Identifies growing/declining areas
7. Exports data for further analysis
8. Uses insights for strategic planning

### Data Requirements

**From Backend APIs**:
- GET /api/analytics/heat-map - Returns heat map data for specified area and time range
- GET /api/analytics/demand-forecast - Returns predicted demand
- GET /api/analytics/fleet-distribution - Returns current vehicle distribution vs demand
- POST /api/analytics/repositioning-suggestions - Calculates optimal vehicle moves

**Heat Map Data Structure**:
```
{
  bounds: { ne: {lat, lng}, sw: {lat, lng} },
  timeRange: { start: string, end: string },
  metric: 'bookings' | 'revenue' | 'utilization',
  dataPoints: [
    {
      latitude: number,
      longitude: number,
      intensity: number, // 0-1 normalized
      value: number, // Actual metric value
      radius: number // Influence radius in meters
    }
  ],
  statistics: {
    total: number,
    average: number,
    peak: number,
    peakLocation: { latitude, longitude }
  }
}
```

## Backend Specifications

### API Endpoints

**GET /api/analytics/heat-map**
- Purpose: Generate heat map data for demand visualization
- Query Parameters: bounds, startDate, endDate, metric, vehicleType, granularity
- Response: Heat map data points with intensity values
- Authentication: JWT token required (fleet manager or admin role)
- Caching: 10 minutes
- Rate Limiting: 20 requests per minute

**GET /api/analytics/demand-forecast**
- Purpose: Predict future demand by location
- Query Parameters: bounds, forecastDays (default 7)
- Response: Predicted demand by location and time
- Authentication: JWT token required (fleet manager or admin role)
- Caching: 1 hour

**GET /api/analytics/fleet-distribution**
- Purpose: Compare current vehicle distribution to demand
- Query Parameters: bounds
- Response: { vehicles, demand, mismatches, suggestions }
- Authentication: JWT token required (fleet manager or admin role)
- Caching: 5 minutes

**POST /api/analytics/repositioning-suggestions**
- Purpose: Calculate optimal vehicle repositioning
- Request Body: { bounds, targetMetric: 'demand_fulfillment' | 'revenue' }
- Response: Array of suggested vehicle moves with impact estimates
- Authentication: JWT token required (fleet manager or admin role)

### Request Schemas

**Heat Map Request**:
- bounds: { ne: {lat, lng}, sw: {lat, lng} } (required)
- startDate: string (ISO 8601, required)
- endDate: string (ISO 8601, required)
- metric: 'bookings' | 'revenue' | 'utilization' (default 'bookings')
- vehicleType: string (optional, filter by type)
- granularity: 'high' | 'medium' | 'low' (affects data point density)

**Demand Forecast Request**:
- bounds: { ne, sw } (required)
- forecastDays: number (default 7, max 30)
- includeEvents: boolean (consider holidays, events)

### Response Schemas

**Heat Map Response**:
- dataPoints: Array of { latitude, longitude, intensity, value, radius }
- bounds: Actual bounds of data
- timeRange: { start, end }
- metric: string
- statistics: { total, average, peak, peakLocation }
- generatedAt: string (ISO 8601)

**Demand Forecast Response**:
- forecasts: Array of { date, location, predictedDemand, confidence }
- historicalComparison: { lastYear, lastMonth }
- events: Array of { date, name, expectedImpact }

**Fleet Distribution Response**:
- vehicles: Array of current vehicle locations
- demandAreas: Array of { location, demand, supply, gap }
- mismatches: Array of { location, demandSupplyRatio, severity }
- suggestions: Array of { action, vehicleId, fromLocation, toLocation, estimatedImpact }

### Business Logic

**Heat Map Generation Algorithm**:
1. Query bookings within specified bounds and time range
2. Extract pickup locations from bookings
3. Aggregate bookings by location (grid-based or clustering)
4. Calculate intensity for each grid cell or cluster
5. Normalize intensity values to 0-1 scale
6. Apply Gaussian blur for smooth visualization
7. Generate data points with coordinates and intensity
8. Return data points for frontend rendering

**Demand Aggregation**:
- Grid-based: Divide area into grid cells (e.g., 1km x 1km)
- Cluster-based: Use k-means clustering for natural groupings
- Time-based: Aggregate by hour, day, week, or month
- Metric-based: Count bookings, sum revenue, or calculate utilization rate

**Demand Forecasting**:
- Use historical data (last 12 months) for baseline
- Apply seasonal adjustments (summer vs winter)
- Consider day of week patterns (weekends vs weekdays)
- Factor in known events (holidays, conferences, festivals)
- Use time series forecasting (ARIMA, Prophet)
- Provide confidence intervals for predictions

**Fleet Repositioning Optimization**:
- Identify high-demand areas with low vehicle supply
- Identify low-demand areas with excess vehicles
- Calculate repositioning cost (driver time, fuel)
- Estimate revenue impact of repositioning
- Prioritize moves with highest ROI
- Consider vehicle availability and booking schedules
- Generate repositioning tasks for drivers

### Authentication Requirements

- Heat map viewing: JWT token required (fleet manager or admin role)
- Demand forecast: JWT token required (fleet manager or admin role)
- Fleet distribution analysis: JWT token required (fleet manager or admin role)
- Repositioning suggestions: JWT token required (fleet manager or admin role)

## Database Specifications

### Schema Changes

Add demand analytics and heat map cache tables.

### Table Definitions

**DemandAnalytics Table** (new):
- id: INT PRIMARY KEY AUTO_INCREMENT
- latitude: DECIMAL(10, 8) NOT NULL
- longitude: DECIMAL(11, 8) NOT NULL
- grid_cell: VARCHAR(50) - Grid cell identifier (e.g., "lat_40.75_lng_-73.98")
- date: DATE NOT NULL
- hour: INT - 0-23
- day_of_week: INT - 0-6 (Sunday-Saturday)
- booking_count: INT DEFAULT 0
- revenue: DECIMAL(10, 2) DEFAULT 0
- utilization_rate: DECIMAL(5, 2) - Percentage
- vehicle_type: VARCHAR(50)
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

**HeatMapCache Table** (new):
- id: INT PRIMARY KEY AUTO_INCREMENT
- cache_key: VARCHAR(255) UNIQUE NOT NULL - Hash of query parameters
- bounds: JSON - { ne, sw }
- start_date: DATE NOT NULL
- end_date: DATE NOT NULL
- metric: VARCHAR(50) NOT NULL
- data_points: JSON - Array of heat map data points
- statistics: JSON - Aggregated statistics
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
- expires_at: DATETIME - Cache expiration (10 minutes)

### Relationships

No direct foreign key relationships (analytics data is aggregated).

### Indexes

- CREATE INDEX idx_demand_analytics_location ON DemandAnalytics(latitude, longitude, date)
- CREATE INDEX idx_demand_analytics_grid ON DemandAnalytics(grid_cell, date, hour)
- CREATE INDEX idx_demand_analytics_date ON DemandAnalytics(date, hour, day_of_week)
- CREATE INDEX idx_heat_map_cache_key ON HeatMapCache(cache_key)
- CREATE INDEX idx_heat_map_cache_expires ON HeatMapCache(expires_at)

## Technology Stack

- Backend: .NET 8+ with C#, ASP.NET Core Web API
- Database: MySQL 8.0+ with spatial data support
- Frontend: Next.js 14+ with TypeScript, React 18+
- Visualization: Google Maps JavaScript API with Heat Map Layer
- Analytics: Custom aggregation queries, optional ML for forecasting
- Caching: Redis for heat map cache (optional)

## Implementation Notes

- Use Google Maps Heat Map Layer for visualization
- Aggregate booking data into grid cells for performance
- Use 1km x 1km grid cells for city-level heat maps
- Use 5km x 5km grid cells for regional heat maps
- Implement data aggregation as background job (run hourly)
- Cache heat map data for 10 minutes to reduce computation
- Use Redis for heat map cache if high traffic
- Implement demand forecasting using time series analysis
- Consider using Prophet library for forecasting
- Factor in external events (holidays, conferences) for predictions
- Provide confidence intervals for forecasts
- Track forecast accuracy and adjust models
- Implement fleet repositioning optimization algorithm
- Calculate repositioning ROI (revenue gain vs cost)
- Generate repositioning tasks automatically
- Monitor repositioning effectiveness
- Provide heat map export for presentations (PNG, PDF)
- Implement heat map animation for time-lapse visualization
- Support multiple metrics (bookings, revenue, utilization)
- Allow filtering by vehicle type, customer segment
- Provide drill-down from heat map to detailed data
- Implement real-time heat map updates (optional)
- Use WebSocket for live demand visualization
- Test heat map performance with large datasets
- Optimize heat map rendering for mobile devices
- Ensure heat maps are accessible (provide data table alternative)
- Monitor heat map API usage and costs
- Consider using Mapbox for custom heat map styling
- Implement heat map comparison (this week vs last week)
- Provide insights and recommendations based on heat map patterns
- Integrate heat map data with dynamic pricing engine
- Use demand visualization for marketing campaign targeting
