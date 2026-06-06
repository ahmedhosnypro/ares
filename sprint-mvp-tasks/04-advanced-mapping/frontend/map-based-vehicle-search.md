# Feature: Map-Based Vehicle Search

## Overview

Display available vehicles as interactive markers on a map, enabling customers to visually discover and select vehicles based on location proximity. The system filters vehicles by type, price, and features directly on the map view, updates markers in real-time as availability changes, and clusters markers in dense areas. This visual search interface is especially valuable for P2P and car-sharing platforms where vehicle locations vary.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-MAP-005

## User Stories

As a customer, I want to search for vehicles on a map relative to my location or destination, so that I can find conveniently located vehicles visually.

As a customer in an unfamiliar city, I want to see vehicle locations on a map, so that I can choose vehicles near my destination or points of interest.

As a P2P host, I want my vehicle to appear on the map search, so that customers can discover my vehicle based on its convenient location.

## Frontend Specifications

### Pages

- Vehicle Search Page with Map View (primary)
- Map View Toggle on Search Results Page
- Embedded Map on Homepage showing nearby vehicles

### UI Components

**Map Search Container**:
- Full-screen or split-screen map view
- Search filters sidebar (collapsible on mobile)
- Vehicle list panel (toggleable)
- Map controls (zoom, center on user, fullscreen)
- View toggle (map view / list view)
- Results counter showing vehicles in viewport

**Vehicle Marker Component**:
- Custom icon by vehicle type (sedan, SUV, van, truck)
- Color coding by availability (green: available, yellow: reserved)
- Price badge overlay on marker
- Hover tooltip with vehicle name and price
- Click opens vehicle details popup
- Selected state highlighting
- Pulse animation for newly available vehicles

**Marker Cluster Component**:
- Circular cluster icon with vehicle count
- Size scales with cluster size
- Color gradient by density
- Click to zoom into cluster
- Hover shows cluster summary
- Spider-leg expansion on click (alternative to zoom)

**Vehicle Info Popup**:
- Vehicle thumbnail image
- Vehicle name and type
- Price per day
- Distance from user location
- Walking/driving time estimate
- Rating and review count
- Quick availability check
- "View Details" button
- "Book Now" button

**Map Filter Panel**:
- Vehicle type checkboxes (sedan, SUV, van, truck)
- Price range slider
- Features checkboxes (automatic, electric, luxury)
- Capacity selector
- Supplier filter
- "Apply Filters" button
- "Clear All" button
- Active filter badges

**Map Controls**:
- Zoom in/out buttons
- Center on user location button
- Fullscreen toggle
- Map/satellite view toggle
- Traffic layer toggle
- "Search this area" button (appears on map pan)

### User Flows

**Map-Based Vehicle Search**:
1. Customer opens vehicle search page
2. System loads map centered on user location or default city
3. System fetches vehicles in viewport bounds
4. Display vehicles as markers on map
5. Customer applies filters (vehicle type, price range)
6. Map updates showing only matching vehicles
7. Customer pans map to explore different areas
8. "Search this area" button appears
9. Customer clicks button to load vehicles in new area
10. Markers update with new results
11. Customer clicks vehicle marker
12. Popup displays vehicle summary
13. Customer clicks "View Details" or "Book Now"

**Marker Clustering Interaction**:
1. Map displays many vehicles in small area
2. System clusters nearby markers automatically
3. Cluster shows count (e.g., "15")
4. Customer clicks cluster
5. Map zooms into cluster area
6. Cluster expands into individual markers
7. Customer can now select individual vehicles

**Real-Time Availability Updates**:
1. Customer viewing map search
2. Vehicle becomes unavailable (booked by another user)
3. System receives real-time update via WebSocket
4. Marker changes color to yellow (reserved)
5. Marker becomes unclickable or shows "No longer available"
6. Results counter updates
7. Customer sees current availability without refresh

### Data Requirements

**From Backend APIs**:
- GET /api/vehicles/map - Returns vehicles in viewport with coordinates
- GET /api/vehicles/map/realtime - WebSocket for real-time availability updates
- POST /api/vehicles/map/filter - Apply filters and return matching vehicles
- GET /api/map/bounds - Calculate optimal map bounds for search criteria

**Map Search Data Structure**:
```
{
  vehicles: [
    {
      id: string,
      name: string,
      type: 'sedan' | 'suv' | 'van' | 'truck',
      latitude: number,
      longitude: number,
      pricePerDay: number,
      availability: 'available' | 'reserved',
      thumbnailUrl: string,
      rating: number,
      reviewCount: number,
      distance: { value: number, text: string },
      travelTime: { value: number, text: string }
    }
  ],
  totalCount: number,
  bounds: { ne: {lat, lng}, sw: {lat, lng} },
  userLocation: { latitude, longitude }
}
```

## Backend Specifications

### API Endpoints

**GET /api/vehicles/map**
- Purpose: Retrieve vehicles within map viewport bounds
- Query Parameters: ne_lat, ne_lng, sw_lat, sw_lng, startDate, endDate, filters (JSON)
- Response: Array of vehicles with coordinates and availability
- Authentication: Optional (JWT for personalized results)
- Caching: 2 minutes for public data
- Rate Limiting: 100 requests per minute per user

**POST /api/vehicles/map/filter**
- Purpose: Apply complex filters and return matching vehicles
- Request Body: { bounds, filters: { vehicleTypes, priceRange, features, capacity, supplier } }
- Response: Filtered vehicles array
- Authentication: Optional
- Caching: 2 minutes
- Rate Limiting: 50 requests per minute per user

**GET /api/vehicles/map/realtime** (WebSocket)
- Purpose: Stream real-time availability updates
- Connection: WebSocket upgrade
- Messages: { vehicleId, availability, timestamp }
- Authentication: Optional
- Throttling: Max 1 update per second per vehicle

**GET /api/map/bounds**
- Purpose: Calculate optimal map bounds for search criteria
- Query Parameters: location, radius, vehicleCount
- Response: { bounds: { ne, sw }, center, zoom }
- Authentication: None required
- Caching: 5 minutes

### Request Schemas

**Map Vehicles Request**:
- ne_lat: number (required, northeast corner latitude)
- ne_lng: number (required, northeast corner longitude)
- sw_lat: number (required, southwest corner latitude)
- sw_lng: number (required, southwest corner longitude)
- startDate: string (ISO 8601, required)
- endDate: string (ISO 8601, required)
- filters: object (optional)

**Filter Request**:
- bounds: { ne: {lat, lng}, sw: {lat, lng} }
- filters: {
  - vehicleTypes: array of strings
  - priceRange: { min, max }
  - features: array of strings
  - capacity: number
  - supplier: string
  - rating: number (minimum rating)
}

### Response Schemas

**Map Vehicles Response**:
- vehicles: Array of vehicle objects with full details
- totalCount: number (total matching vehicles, not just in viewport)
- bounds: { ne, sw } (actual bounds of returned vehicles)
- clusteringEnabled: boolean
- timestamp: string (ISO 8601)

**Real-Time Update Message**:
- type: 'availability_change'
- vehicleId: string
- availability: 'available' | 'reserved' | 'unavailable'
- timestamp: string (ISO 8601)

### Business Logic

**Viewport-Based Querying**:
- Query vehicles within map bounds using spatial indexes
- Limit results to 500 vehicles per viewport (performance)
- If more than 500 vehicles, suggest zooming in or applying filters
- Calculate distance from user location to each vehicle
- Sort by distance (closest first)

**Real-Time Availability**:
- Subscribe to vehicle availability changes via WebSocket
- Push updates to connected clients when vehicle status changes
- Throttle updates to max 1 per second per vehicle
- Batch multiple updates for efficiency
- Disconnect inactive connections after 30 minutes

**Marker Clustering Logic**:
- Enable clustering when more than 50 markers in viewport
- Cluster markers within 50 pixels of each other
- Expand clusters at zoom level 15+
- Use grid-based clustering algorithm for performance
- Update clusters on map pan/zoom

**Filter Application**:
- Apply filters server-side before returning results
- Support multiple simultaneous filters (AND logic)
- Validate filter values before querying database
- Return empty results if no vehicles match filters
- Suggest relaxing filters if no results found

### Authentication Requirements

- Public map search: No authentication required
- Personalized search (saved filters, favorites): JWT token required
- Real-time updates: Optional authentication (enhanced for logged-in users)
- Fleet manager map view: JWT token required with fleet manager role

## Database Specifications

### Schema Changes

Ensure spatial indexes exist for efficient map queries.

### Table Definitions

**Vehicles Table** (existing, ensure spatial support):
- latitude: DECIMAL(10, 8) NOT NULL
- longitude: DECIMAL(11, 8) NOT NULL
- location_point: POINT NOT NULL - MySQL spatial type for efficient queries
- location_updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

### Relationships

No new relationships required.

### Indexes

- CREATE SPATIAL INDEX idx_vehicles_location_point ON Vehicles(location_point) - Efficient spatial queries
- CREATE INDEX idx_vehicles_availability ON Vehicles(availability, latitude, longitude) - Filtered map queries
- CREATE INDEX idx_vehicles_type_location ON Vehicles(type, latitude, longitude) - Type-filtered searches

## Technology Stack

- Backend: .NET 8+ with C#, ASP.NET Core Web API
- Database: MySQL 8.0+ with spatial data support
- Frontend: Next.js 14+ with TypeScript, React 18+
- Mapping: Google Maps JavaScript API
- Clustering: @googlemaps/markerclusterer library
- Real-Time: SignalR for WebSocket connections
- Spatial Queries: MySQL spatial functions (ST_Distance_Sphere, ST_Contains)

## Implementation Notes

- Use Google Maps JavaScript API for map rendering
- Implement marker clustering using @googlemaps/markerclusterer
- Use custom marker icons for different vehicle types
- Implement marker click handlers for vehicle details popup
- Use MySQL spatial indexes for efficient viewport queries
- Query vehicles using ST_Contains with bounding box
- Calculate distances using ST_Distance_Sphere function
- Implement real-time updates using SignalR WebSocket
- Throttle real-time updates to prevent overwhelming clients
- Cache map queries for 2 minutes to reduce database load
- Implement "Search this area" button that appears on map pan
- Provide list view toggle for users who prefer non-map interface
- Remember user's preferred view (map/list) in local storage
- Optimize marker rendering for large datasets (virtualization)
- Implement lazy loading for vehicle images in popups
- Handle map service failures with cached data fallback
- Provide clear error messages when map fails to load
- Test map performance with 1000+ vehicle markers
- Ensure map is accessible with keyboard navigation
- Provide alternative text for screen readers
- Support touch gestures on mobile (pinch to zoom, swipe to pan)
- Implement map bounds padding to show all relevant markers
- Use traffic layer to show congestion on routes
- Consider Mapbox as alternative provider for custom styling
- Monitor Google Maps API usage and costs
- Implement rate limiting to prevent API abuse
- Use static maps for email notifications to reduce costs
- Test across different screen sizes and devices
- Ensure map works in areas with poor internet connectivity
- Provide offline fallback using cached map tiles
