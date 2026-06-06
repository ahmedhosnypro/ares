# Feature: Core Mapping Integration

## Overview

Integrate Google Maps Platform to provide interactive mapping capabilities for vehicle discovery and location visualization. The system displays available vehicles as custom markers on an interactive map, supporting zoom, pan, and marker clustering for dense areas. This foundational mapping integration enables customers to visually discover vehicles and navigate the platform's location-based features.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-MAP-001

## User Stories

As a customer, I want to view available vehicles on an interactive map, so that I can visually discover vehicles near my location or destination.

As a platform operator, I want reliable mapping services with fallback capabilities, so that the system remains functional even during service disruptions.

As a mobile user, I want responsive maps that work on my device, so that I can search for vehicles on the go.

## Frontend Specifications

### Pages

- Vehicle Search Page with Map View
- Vehicle Details Page with Location Map
- Booking Confirmation Page with Pickup Location Map

### UI Components

**Interactive Map Component**:
- Renders Google Maps with custom styling
- Supports zoom controls (min zoom: 3, max zoom: 20)
- Supports pan and drag interactions
- Displays current user location marker
- Handles touch gestures on mobile devices
- Provides map/satellite view toggle
- Shows scale indicator and compass

**Vehicle Marker Component**:
- Custom marker icons differentiated by vehicle type (sedan, SUV, van, truck)
- Marker color coding by availability status (available: green, reserved: yellow)
- Marker size scaling based on zoom level
- Hover state showing vehicle name and price
- Click handler opening vehicle details popup
- Marker animation on selection

**Marker Cluster Component**:
- Groups nearby markers when zoomed out
- Displays count of vehicles in cluster
- Expands cluster on click or zoom
- Color coding by cluster size
- Smooth animation during cluster/uncluster

**Map Popup Component**:
- Vehicle thumbnail image
- Vehicle name and type
- Price per day
- Distance from user location
- Quick view button
- Book now button

### User Flows

1. Customer opens vehicle search page
2. System requests location permission with explanation
3. Map loads centered on user location or default city
4. Vehicle markers appear on map showing available vehicles
5. Customer zooms and pans to explore different areas
6. Markers cluster in dense areas, expand on zoom
7. Customer clicks vehicle marker
8. Popup displays vehicle summary
9. Customer clicks "View Details" to see full vehicle page
10. Map updates in real-time as availability changes

### Data Requirements

**From Backend APIs**:
- GET /api/vehicles/map - Returns vehicles with coordinates, type, price, availability
- GET /api/locations - Returns pickup/dropoff locations with coordinates
- GET /api/map-config - Returns map configuration (API key, default center, zoom levels)

**Map Data Structure**:
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
      thumbnailUrl: string
    }
  ],
  userLocation: {
    latitude: number,
    longitude: number,
    accuracy: number
  }
}
```

## Backend Specifications

### API Endpoints

**GET /api/vehicles/map**
- Purpose: Retrieve vehicles with location data for map display
- Query Parameters: bounds (ne_lat, ne_lng, sw_lat, sw_lng), startDate, endDate, filters
- Response: Array of vehicles with coordinates and availability
- Authentication: Optional (public search) or JWT token (personalized)
- Caching: 5 minutes for public data, no cache for authenticated requests

**GET /api/locations**
- Purpose: Retrieve pickup/dropoff locations with coordinates
- Query Parameters: type (pickup | dropoff | both), bounds (optional)
- Response: Array of locations with coordinates and metadata
- Authentication: None required
- Caching: 1 hour

**GET /api/map-config**
- Purpose: Retrieve map configuration and API credentials
- Response: Map center coordinates, default zoom, API key (restricted)
- Authentication: None required
- Caching: 24 hours

### Request Schemas

**Vehicle Map Query**:
- bounds: { ne_lat, ne_lng, sw_lat, sw_lng } - Map viewport bounds
- startDate: ISO 8601 date - Rental start date
- endDate: ISO 8601 date - Rental end date
- filters: { vehicleTypes, priceRange, features } - Search filters

### Response Schemas

**Vehicle Map Response**:
- vehicles: Array of vehicle objects with id, name, type, coordinates, price, availability, thumbnail
- totalCount: Total vehicles matching criteria
- bounds: Actual bounds of returned vehicles

**Location Response**:
- locations: Array with id, name, address, coordinates, type, operatingHours
- totalCount: Total locations

### Business Logic

- Filter vehicles by availability for requested date range
- Calculate distance from user location to each vehicle
- Apply search filters before returning results
- Limit results to viewport bounds for performance
- Sort by distance from user location (if provided)
- Exclude vehicles that are under maintenance or unavailable

### Authentication Requirements

- Public vehicle search: No authentication required
- Personalized search (saved preferences, favorites): JWT token required
- Map configuration: No authentication required
- API key management: Admin role required

## Database Specifications

### Schema Changes

No new tables required. Existing tables (Vehicles, Locations) already contain coordinate data.

### Table Definitions

**Vehicles Table** (existing, ensure coordinates present):
- latitude: DECIMAL(10, 8) NOT NULL - Vehicle latitude coordinate
- longitude: DECIMAL(11, 8) NOT NULL - Vehicle longitude coordinate
- location_updated_at: DATETIME - Last location update timestamp

**Locations Table** (existing, ensure coordinates present):
- latitude: DECIMAL(10, 8) NOT NULL - Location latitude coordinate
- longitude: DECIMAL(11, 8) NOT NULL - Location longitude coordinate
- address: VARCHAR(500) NOT NULL - Formatted address
- city: VARCHAR(100) NOT NULL - City name
- country: VARCHAR(100) NOT NULL - Country name

### Relationships

- Vehicles.location_id → Locations.id (foreign key)
- Vehicles coordinates may differ from Locations coordinates for P2P vehicles

### Indexes

- CREATE INDEX idx_vehicles_coordinates ON Vehicles(latitude, longitude) - Spatial queries
- CREATE INDEX idx_locations_coordinates ON Locations(latitude, longitude) - Location lookups
- CREATE SPATIAL INDEX idx_vehicles_location ON Vehicles(POINT(longitude, latitude)) - Geospatial queries (MySQL 8.0+)

## Technology Stack

- Backend: .NET 8+ with C#, ASP.NET Core Web API
- Database: MySQL 8.0+ with spatial data support
- Frontend: Next.js 14+ with TypeScript, React 18+
- Mapping: Google Maps JavaScript API
- Geospatial: MySQL spatial functions (ST_Distance_Sphere)

## Implementation Notes

- Use Google Maps JavaScript API for frontend map rendering
- Implement marker clustering using @googlemaps/markerclusterer library
- Store Google Maps API key in environment variables, not in code
- Use restricted API keys with domain and IP restrictions
- Implement map tile caching for performance
- Handle mapping service failures with cached data fallback
- Provide list view toggle for users who prefer non-map interface
- Optimize marker rendering for large datasets (virtualization)
- Consider Mapbox as alternative provider for cost optimization
- Ensure maps are accessible with keyboard navigation and screen reader support
- Test map performance with 1000+ vehicle markers
- Monitor Google Maps API usage and costs through Cloud Console
- Implement rate limiting to prevent API abuse
- Use static maps for email notifications and PDFs to reduce costs
