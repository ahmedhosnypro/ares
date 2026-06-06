# Feature: Geofencing

## Overview

Define virtual geographic boundaries and monitor vehicle locations to trigger actions when vehicles enter or exit zones. The system supports circular and polygon geofences for authorized driving areas, cross-border detection, parking zone validation, and theft prevention. Geofencing is critical for P2P and car-sharing platforms to enforce usage policies, recover cross-border fees, and detect unauthorized vehicle movement.

## Sprint Category

sprint-01

## Feature ID

F-INT-MAP-006

## User Stories

As a fleet manager, I want to define authorized driving areas and receive alerts when vehicles leave boundaries, so that I can enforce usage policies and recover cross-border fees.

As a P2P host, I want to set geographic boundaries for my vehicle, so that I'm alerted if the renter takes it outside the permitted area.

As a platform operator, I want to detect cross-border travel automatically, so that I can apply appropriate fees and insurance coverage.

## Frontend Specifications

### Pages

- Fleet Management Dashboard with Geofence Management
- Vehicle Details Page showing Authorized Area
- Booking Page with Geographic Restrictions Display
- Real-Time Vehicle Tracking Map with Geofence Overlay

### UI Components

**Geofence Map Editor**:
- Interactive map for drawing geofences
- Circle tool with radius adjustment
- Polygon tool for custom shapes
- Edit mode for existing geofences
- Delete geofence button
- Geofence name and description fields
- Color picker for geofence visualization
- Save and cancel buttons

**Geofence List Panel**:
- List of all geofences with names
- Active/inactive toggle for each geofence
- Edit and delete buttons
- Geofence type indicator (authorized area, parking zone, country boundary)
- Vehicle count within each geofence
- Alert configuration button

**Geofence Violation Alert**:
- Real-time notification when vehicle exits geofence
- Vehicle name and ID
- Geofence name violated
- Timestamp and location coordinates
- Map showing violation location
- Contact renter button
- View vehicle tracking button

**Authorized Area Display** (customer-facing):
- Map showing permitted driving area
- Shaded region indicating boundaries
- Warning message about restrictions
- Cross-border fee information
- "I understand" acknowledgment checkbox

### User Flows

**Creating Geofence** (fleet manager):
1. Fleet manager opens geofence management page
2. Clicks "Create Geofence" button
3. Selects geofence type (authorized area, parking zone, border)
4. Chooses drawing tool (circle or polygon)
5. Draws geofence on map
6. Adjusts boundaries as needed
7. Enters geofence name and description
8. Configures alert settings
9. Saves geofence
10. System validates and stores geofence

**Geofence Violation Detection**:
1. Vehicle location updates via telematics (every 1-5 minutes)
2. System checks if location is within all applicable geofences
3. If vehicle exits authorized area geofence:
   - Log violation event with timestamp and coordinates
   - Send real-time alert to fleet manager
   - Send notification to renter (warning)
   - Flag booking for review
4. If vehicle crosses international border:
   - Detect border crossing using country boundary geofence
   - Automatically apply cross-border fee to booking
   - Send notification to renter about fee
   - Update booking invoice
5. Fleet manager reviews violation and takes action

**Customer Viewing Restrictions**:
1. Customer views vehicle details during booking
2. System displays authorized driving area on map
3. Customer sees shaded region showing boundaries
4. Warning message explains restrictions
5. Cross-border fee information displayed
6. Customer acknowledges understanding before booking
7. Booking proceeds with geographic restrictions recorded

### Data Requirements

**From Backend APIs**:
- GET /api/geofences - Returns all geofences for fleet manager
- POST /api/geofences - Create new geofence
- PUT /api/geofences/:id - Update existing geofence
- DELETE /api/geofences/:id - Delete geofence
- GET /api/geofences/vehicle/:id - Returns geofences applicable to vehicle
- POST /api/geofences/check - Check if location is within geofence
- GET /api/geofences/violations - Returns geofence violation history
- WebSocket /api/geofences/alerts - Real-time violation alerts

**Geofence Data Structure**:
```
{
  id: string,
  name: string,
  description: string,
  type: 'authorized_area' | 'parking_zone' | 'country_boundary' | 'restricted_area',
  shape: 'circle' | 'polygon',
  geometry: {
    // For circle
    center: { latitude, longitude },
    radius: number, // meters
    // For polygon
    coordinates: [{ latitude, longitude }]
  },
  active: boolean,
  alertEnabled: boolean,
  alertRecipients: [string], // user IDs or email addresses
  applicableVehicles: [string], // vehicle IDs or 'all'
  createdBy: string,
  createdAt: string,
  updatedAt: string
}
```

## Backend Specifications

### API Endpoints

**GET /api/geofences**
- Purpose: Retrieve all geofences for fleet management
- Query Parameters: type (optional), active (optional), vehicleId (optional)
- Response: Array of geofence objects
- Authentication: JWT token required (fleet manager or admin role)
- Caching: 5 minutes

**POST /api/geofences**
- Purpose: Create new geofence
- Request Body: { name, description, type, shape, geometry, alertEnabled, applicableVehicles }
- Response: Created geofence with ID
- Authentication: JWT token required (fleet manager or admin role)
- Validation: Geometry must be valid, radius < 500km for circles

**PUT /api/geofences/:id**
- Purpose: Update existing geofence
- Request Body: Partial geofence object with fields to update
- Response: Updated geofence
- Authentication: JWT token required (fleet manager or admin role)

**DELETE /api/geofences/:id**
- Purpose: Delete geofence
- Response: Success confirmation
- Authentication: JWT token required (fleet manager or admin role)

**GET /api/geofences/vehicle/:id**
- Purpose: Get geofences applicable to specific vehicle
- Response: Array of geofences
- Authentication: JWT token required
- Caching: 5 minutes

**POST /api/geofences/check**
- Purpose: Check if location is within geofence
- Request Body: { geofenceId, latitude, longitude }
- Response: { inside: boolean, distance: number (meters from boundary) }
- Authentication: JWT token required
- Rate Limiting: 1000 requests per minute (high volume for real-time tracking)

**GET /api/geofences/violations**
- Purpose: Retrieve geofence violation history
- Query Parameters: vehicleId, geofenceId, startDate, endDate, limit
- Response: Array of violation events
- Authentication: JWT token required (fleet manager or admin role)
- Caching: 1 minute

**WebSocket /api/geofences/alerts**
- Purpose: Stream real-time geofence violation alerts
- Messages: { type: 'violation', vehicleId, geofenceId, location, timestamp }
- Authentication: JWT token required (fleet manager or admin role)

### Request Schemas

**Create Geofence Request**:
- name: string (required, max 100 characters)
- description: string (optional, max 500 characters)
- type: enum (required)
- shape: 'circle' | 'polygon' (required)
- geometry: object (required, validated based on shape)
- alertEnabled: boolean (default true)
- alertRecipients: array of strings (optional)
- applicableVehicles: array of vehicle IDs or 'all' (default 'all')

**Check Location Request**:
- geofenceId: string (required)
- latitude: number (required, -90 to 90)
- longitude: number (required, -180 to 180)

### Response Schemas

**Geofence Response**:
- Full geofence object with all fields
- vehicleCount: number (vehicles currently within geofence)
- violationCount: number (total violations for this geofence)

**Violation Event Response**:
- id: string
- vehicleId: string
- vehicleName: string
- geofenceId: string
- geofenceName: string
- violationType: 'exit' | 'entry' | 'unauthorized'
- location: { latitude, longitude }
- timestamp: string (ISO 8601)
- resolved: boolean
- resolvedBy: string (user ID)
- resolvedAt: string (ISO 8601)
- notes: string

### Business Logic

**Geofence Validation**:
- Circle radius must be between 100 meters and 500 km
- Polygon must have at least 3 vertices
- Polygon must not self-intersect
- Geofence must be within service area
- Validate coordinates are valid (latitude -90 to 90, longitude -180 to 180)

**Location Checking Algorithm**:
- For circles: Calculate distance from center using Haversine formula, compare to radius
- For polygons: Use ray-casting algorithm or MySQL ST_Contains function
- Cache geofence geometry for performance
- Batch check multiple geofences simultaneously
- Return distance from boundary for proximity alerts

**Violation Detection Logic**:
- Check vehicle location against all applicable geofences every location update
- Detect exit violations when vehicle moves from inside to outside
- Detect entry violations for restricted areas
- Ignore violations if vehicle is stationary (< 5 meters movement)
- Implement hysteresis to prevent alert spam (require 2 consecutive violations)
- Log all violations with timestamp and coordinates

**Cross-Border Fee Application**:
- Detect border crossing using country boundary geofences
- Automatically add cross-border fee to booking
- Send notification to renter about fee
- Update booking invoice in real-time
- Log border crossing event for audit

**Alert Delivery**:
- Send real-time alerts via WebSocket to connected fleet managers
- Send email alerts to configured recipients
- Send SMS alerts for critical violations (theft, unauthorized area)
- Batch alerts to prevent spam (max 1 per 5 minutes per vehicle)
- Include map link showing violation location

### Authentication Requirements

- Geofence management: JWT token required (fleet manager or admin role)
- Geofence viewing: JWT token required (fleet manager, admin, or vehicle owner)
- Violation history: JWT token required (fleet manager or admin role)
- Real-time alerts: JWT token required (fleet manager or admin role)
- Customer viewing restrictions: No authentication required (public vehicle info)

## Database Specifications

### Schema Changes

Add geofences and geofence violations tables.

### Table Definitions

**Geofences Table** (new):
- id: INT PRIMARY KEY AUTO_INCREMENT
- name: VARCHAR(100) NOT NULL
- description: TEXT
- type: ENUM('authorized_area', 'parking_zone', 'country_boundary', 'restricted_area') NOT NULL
- shape: ENUM('circle', 'polygon') NOT NULL
- center_latitude: DECIMAL(10, 8) - For circles
- center_longitude: DECIMAL(11, 8) - For circles
- radius_meters: INT - For circles
- polygon_coordinates: JSON - For polygons, array of {lat, lng}
- active: BOOLEAN DEFAULT TRUE
- alert_enabled: BOOLEAN DEFAULT TRUE
- alert_recipients: JSON - Array of user IDs or emails
- applicable_vehicles: JSON - Array of vehicle IDs or 'all'
- created_by: INT NOT NULL
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
- updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

**GeofenceViolations Table** (new):
- id: INT PRIMARY KEY AUTO_INCREMENT
- vehicle_id: INT NOT NULL
- geofence_id: INT NOT NULL
- violation_type: ENUM('exit', 'entry', 'unauthorized') NOT NULL
- latitude: DECIMAL(10, 8) NOT NULL
- longitude: DECIMAL(11, 8) NOT NULL
- timestamp: DATETIME NOT NULL
- resolved: BOOLEAN DEFAULT FALSE
- resolved_by: INT - User ID who resolved
- resolved_at: DATETIME
- notes: TEXT
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

### Relationships

- Geofences.created_by → Users.id (foreign key)
- GeofenceViolations.vehicle_id → Vehicles.id (foreign key)
- GeofenceViolations.geofence_id → Geofences.id (foreign key)
- GeofenceViolations.resolved_by → Users.id (foreign key)

### Indexes

- CREATE INDEX idx_geofences_active ON Geofences(active)
- CREATE INDEX idx_geofences_type ON Geofences(type)
- CREATE SPATIAL INDEX idx_geofences_center ON Geofences(POINT(center_longitude, center_latitude))
- CREATE INDEX idx_violations_vehicle ON GeofenceViolations(vehicle_id, timestamp DESC)
- CREATE INDEX idx_violations_geofence ON GeofenceViolations(geofence_id, timestamp DESC)
- CREATE INDEX idx_violations_unresolved ON GeofenceViolations(resolved, timestamp DESC)

## Technology Stack

- Backend: .NET 8+ with C#, ASP.NET Core Web API
- Database: MySQL 8.0+ with spatial data support
- Frontend: Next.js 14+ with TypeScript, React 18+
- Mapping: Google Maps JavaScript API with Drawing Library
- Geospatial: MySQL spatial functions (ST_Contains, ST_Distance_Sphere)
- Real-Time: SignalR for WebSocket alerts
- Background Jobs: Hangfire for periodic location checks

## Implementation Notes

- Use Google Maps Drawing Library for geofence creation UI
- Store circle geofences as center point and radius
- Store polygon geofences as JSON array of coordinates
- Use MySQL ST_Contains function for polygon containment checks
- Use Haversine formula for circle containment checks
- Implement background job to check vehicle locations every 5 minutes
- Use SignalR for real-time violation alerts to fleet managers
- Implement hysteresis to prevent alert spam (require 2 consecutive violations)
- Cache geofence geometry in memory for performance
- Batch location checks for multiple vehicles
- Log all violations for audit and analytics
- Automatically apply cross-border fees when country boundary crossed
- Send notifications to renters when approaching geofence boundary
- Provide grace period (5 minutes) before applying penalties
- Support multiple geofences per vehicle (authorized area + parking zones)
- Implement geofence priority (country boundaries override authorized areas)
- Use spatial indexes for efficient containment queries
- Test geofence accuracy with real-world coordinates
- Handle edge cases (vehicle on boundary, GPS inaccuracy)
- Provide manual override for false positive violations
- Monitor geofence check performance (should complete in < 100ms)
- Consider using third-party geofencing services (Radar.io) for advanced features
- Implement geofence templates for common scenarios (city limits, state boundaries)
- Support geofence inheritance (vehicle inherits supplier's geofences)
- Ensure geofencing works with various telematics providers
- Test with vehicles near geofence boundaries
- Implement buffer zone (50 meters) to account for GPS inaccuracy
