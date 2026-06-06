# Feature: Distance and Route Calculation

## Overview

Calculate accurate distances, travel times, and optimal routes between customer locations and vehicle locations using mapping APIs. The system accounts for real-time traffic conditions, provides turn-by-turn directions, and displays walking or driving distances based on proximity. Route calculation enables customers to choose the most convenient vehicles and plan their pickup efficiently.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-MAP-004

## User Stories

As a customer, I want to see accurate distances and travel times to vehicles, so that I can choose the most convenient option.

As a customer planning pickup, I want turn-by-turn directions to the vehicle location, so that I can navigate there easily.

As a fleet manager, I want route optimization for vehicle repositioning, so that I can minimize operational costs.

## Frontend Specifications

### Pages

- Vehicle Search Results with Distance Display
- Vehicle Details Page with Directions
- Booking Confirmation with Pickup Directions
- Fleet Management Dashboard with Route Planning

### UI Components

**Distance Display Component**:
- Shows distance from user location to vehicle
- Walking distance for nearby vehicles (< 2km)
- Driving distance for distant vehicles (> 2km)
- Travel time estimate with traffic consideration
- Icon indicating travel mode (walk/drive)
- Updates in real-time with traffic changes

**Directions Panel**:
- Turn-by-turn directions list
- Estimated travel time with traffic
- Total distance
- Alternative routes option
- Traffic condition indicator (light, moderate, heavy)
- "Start Navigation" button (opens native maps app)
- Print directions button

**Route Map Visualization**:
- Route polyline on map
- Start and end markers
- Traffic overlay showing congestion
- Alternative routes in different colors
- Waypoint markers for multi-stop trips
- Distance and time labels along route

**Travel Mode Selector**:
- Walking, Driving, Transit, Bicycling options
- Icon for each mode
- Estimated time for each mode
- Recommended mode highlighted
- Updates route when mode changes

### User Flows

**Distance Display on Search Results**:
1. Customer searches for vehicles
2. System detects customer location
3. For each vehicle, system calculates distance
4. Display walking distance if < 2km
5. Display driving distance if > 2km
6. Show travel time estimate
7. Sort results by distance (optional)
8. Update distances if customer location changes

**Getting Directions to Vehicle**:
1. Customer views vehicle details
2. Customer clicks "Get Directions" button
3. System calculates route from current location to vehicle
4. Display route on map with polyline
5. Show turn-by-turn directions in panel
6. Display travel time with current traffic
7. Show alternative routes if available
8. Customer clicks "Start Navigation"
9. System opens native maps app with directions
10. Customer navigates to vehicle location

**Multi-Stop Route Planning** (for fleet managers):
1. Fleet manager selects multiple vehicles to reposition
2. System calculates optimal route visiting all locations
3. Display route on map with numbered waypoints
4. Show total distance and time
5. Allow manual reordering of stops
6. Recalculate route on changes
7. Export route to navigation app

### Data Requirements

**From Backend APIs**:
- GET /api/routing/distance - Calculate distance between two points
- POST /api/routing/matrix - Calculate distances for multiple origin-destination pairs
- GET /api/routing/directions - Get turn-by-turn directions
- POST /api/routing/optimize - Optimize multi-stop route

**Distance Data Structure**:
```
{
  origin: { latitude, longitude },
  destination: { latitude, longitude },
  distance: {
    value: number, // meters
    text: string // "2.5 km"
  },
  duration: {
    value: number, // seconds
    text: string // "15 mins"
  },
  mode: 'walking' | 'driving' | 'transit' | 'bicycling'
}
```

**Directions Data Structure**:
```
{
  routes: [
    {
      summary: string,
      legs: [
        {
          distance: { value, text },
          duration: { value, text },
          steps: [
            {
              instruction: string,
              distance: { value, text },
              duration: { value, text },
              maneuver: string
            }
          ]
        }
      ],
      polyline: string, // encoded polyline
      trafficCondition: 'light' | 'moderate' | 'heavy'
    }
  ],
  alternativeRoutes: []
}
```

## Backend Specifications

### API Endpoints

**GET /api/routing/distance**
- Purpose: Calculate distance and travel time between two points
- Query Parameters: originLat, originLng, destLat, destLng, mode (optional)
- Response: { distance, duration, mode }
- Authentication: None required
- Caching: 5 minutes per origin-destination pair

**POST /api/routing/matrix**
- Purpose: Calculate distances for multiple origin-destination pairs
- Request Body: { origins: [coordinates], destinations: [coordinates], mode }
- Response: Matrix of distances and durations
- Authentication: None required
- Rate Limiting: 10 requests per minute per user
- Caching: 5 minutes per unique matrix

**GET /api/routing/directions**
- Purpose: Get detailed turn-by-turn directions
- Query Parameters: originLat, originLng, destLat, destLng, mode, alternatives (boolean)
- Response: { routes, alternativeRoutes }
- Authentication: None required
- Caching: 10 minutes per route

**POST /api/routing/optimize**
- Purpose: Optimize route for multiple waypoints
- Request Body: { waypoints: [coordinates], mode, optimize: boolean }
- Response: { optimizedRoute, totalDistance, totalDuration, waypointOrder }
- Authentication: JWT token required (fleet manager role)
- Rate Limiting: 20 requests per minute

### Request Schemas

**Distance Request**:
- originLat: number (required, -90 to 90)
- originLng: number (required, -180 to 180)
- destLat: number (required, -90 to 90)
- destLng: number (required, -180 to 180)
- mode: string (optional, default 'driving')

**Distance Matrix Request**:
- origins: array of { latitude, longitude } (max 25)
- destinations: array of { latitude, longitude } (max 25)
- mode: string (optional, default 'driving')
- departureTime: string (optional, ISO 8601 for traffic-aware routing)

**Directions Request**:
- originLat, originLng: numbers (required)
- destLat, destLng: numbers (required)
- mode: string (optional, default 'driving')
- alternatives: boolean (optional, default false)
- avoidTolls: boolean (optional, default false)
- avoidHighways: boolean (optional, default false)

**Route Optimization Request**:
- waypoints: array of { latitude, longitude, name } (required, 2-25 waypoints)
- mode: string (optional, default 'driving')
- optimize: boolean (required, true for optimization)

### Response Schemas

**Distance Response**:
- distance: { value (meters), text (formatted) }
- duration: { value (seconds), text (formatted) }
- mode: string
- trafficDuration: { value, text } (if traffic data available)

**Distance Matrix Response**:
- rows: Array of { elements: [{ distance, duration, status }] }
- originAddresses: Array of formatted addresses
- destinationAddresses: Array of formatted addresses

**Directions Response**:
- routes: Array of route objects with legs, steps, polyline, bounds
- status: string ('OK' | 'NOT_FOUND' | 'ZERO_RESULTS')
- alternativeRoutes: Array of alternative route objects

**Route Optimization Response**:
- optimizedRoute: Route object with optimized waypoint order
- totalDistance: { value, text }
- totalDuration: { value, text }
- waypointOrder: Array of indices showing optimal order
- savings: { distance, duration } compared to original order

### Business Logic

**Distance Calculation Strategy**:
- Use Haversine formula for straight-line distance (fast, no API call)
- Use Distance Matrix API for accurate driving/walking distance
- Cache frequent origin-destination pairs
- Batch multiple distance calculations when possible
- Apply traffic data for realistic travel times

**Travel Mode Selection**:
- Walking: For distances < 2km
- Driving: For distances > 2km
- Transit: Optional, for urban areas with public transport
- Bicycling: Optional, for bike-friendly cities

**Route Optimization Algorithm**:
- Use Google Maps Directions API with waypoint optimization
- Minimize total travel time (not just distance)
- Consider traffic conditions
- Respect waypoint constraints (must-visit order)
- Limit to 25 waypoints per route (API limitation)

**Caching Strategy**:
- Cache distance calculations for 5 minutes (traffic changes)
- Cache directions for 10 minutes
- Use origin-destination pair as cache key
- Invalidate cache on traffic condition changes
- Implement LRU eviction for memory management

### Authentication Requirements

- Distance calculation: No authentication required
- Directions: No authentication required
- Route optimization: JWT token required (fleet manager or admin role)
- Saved routes: JWT token required with user ownership verification

## Database Specifications

### Schema Changes

Add route cache table for performance optimization.

### Table Definitions

**RouteCache Table** (new):
- id: INT PRIMARY KEY AUTO_INCREMENT
- origin_hash: VARCHAR(64) NOT NULL - Hash of origin coordinates
- destination_hash: VARCHAR(64) NOT NULL - Hash of destination coordinates
- mode: ENUM('walking', 'driving', 'transit', 'bicycling') NOT NULL
- distance_meters: INT NOT NULL
- duration_seconds: INT NOT NULL
- polyline: TEXT - Encoded polyline for route visualization
- traffic_duration_seconds: INT - Duration with traffic
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
- expires_at: DATETIME - Cache expiration (5-10 minutes)

**SavedRoutes Table** (new, optional):
- id: INT PRIMARY KEY AUTO_INCREMENT
- user_id: INT NOT NULL
- name: VARCHAR(100) - Route nickname
- waypoints: JSON - Array of coordinates and names
- optimized: BOOLEAN DEFAULT FALSE
- total_distance_meters: INT
- total_duration_seconds: INT
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

### Relationships

- SavedRoutes.user_id → Users.id (foreign key, CASCADE on delete)

### Indexes

- CREATE UNIQUE INDEX idx_route_cache_lookup ON RouteCache(origin_hash, destination_hash, mode)
- CREATE INDEX idx_route_cache_expires ON RouteCache(expires_at)
- CREATE INDEX idx_saved_routes_user ON SavedRoutes(user_id)

## Technology Stack

- Backend: .NET 8+ with C#, ASP.NET Core Web API
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript, React 18+
- Routing: Google Maps Directions API, Distance Matrix API
- Caching: Redis (optional, for high-volume route caching)

## Implementation Notes

- Use Google Maps Distance Matrix API for bulk distance calculations
- Use Google Maps Directions API for detailed turn-by-turn directions
- Implement aggressive caching to reduce API costs
- Use session tokens for autocomplete to optimize billing
- Batch distance calculations when possible (up to 25x25 matrix)
- Display walking distance for nearby vehicles to encourage sustainable transport
- Show real-time traffic conditions on routes
- Provide alternative routes when available
- Handle API failures gracefully with cached data
- Implement retry logic for transient failures
- Monitor API usage and costs through Google Cloud Console
- Set usage quotas and alerts for cost control
- Use environment variables for API keys
- Restrict API keys to specific domains and IP addresses
- Consider Mapbox Directions API as alternative for cost optimization
- Implement route caching with 5-10 minute expiration
- Use coordinate hashing for cache keys
- Optimize for mobile performance (minimize API calls)
- Provide offline fallback using straight-line distance
- Test with various origin-destination pairs and traffic conditions
- Ensure directions work internationally
- Support right-to-left languages for Middle East markets
- Integrate with native maps apps (Google Maps, Apple Maps) for navigation
- Provide "Open in Maps" button for seamless handoff
