# Feature: Geolocation Services

## Overview

Automatically detect customer's current location using GPS, browser Geolocation API, or IP-based fallback to enable proximity-based vehicle search and personalized recommendations. The system requests location permission with clear explanation, respects user privacy, and provides manual override options. Location detection enables automatic "near me" searches and location-aware features throughout the platform.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-MAP-002

## User Stories

As a customer, I want the system to detect my current location automatically, so that I can find nearby vehicles without manual address entry.

As a mobile user, I want accurate GPS-based location detection, so that I receive relevant vehicle suggestions based on where I am.

As a privacy-conscious user, I want control over my location data, so that I can choose whether to share my location with the platform.

## Frontend Specifications

### Pages

- Vehicle Search Page with "Near Me" functionality
- Location Permission Request Modal
- Location Settings Page in User Profile

### UI Components

**Location Permission Modal**:
- Clear explanation of why location is needed
- Benefits of sharing location (faster search, nearby vehicles)
- Allow/Deny buttons
- "Not now" option to dismiss
- Link to privacy policy
- Visual icon showing location usage

**Location Indicator Component**:
- Displays current detected location
- Shows accuracy estimate (e.g., "Accurate to 50 meters")
- Edit button to manually override location
- Location source indicator (GPS, IP, Manual)
- Refresh button to update location

**Near Me Button**:
- Prominent button on search page
- Icon showing location pin
- Triggers location detection on click
- Loading state during detection
- Success/error feedback

**Manual Location Override**:
- Address search input with autocomplete
- Map picker for visual location selection
- Save location for future use option
- Clear current location button

### User Flows

**First-Time Location Detection**:
1. Customer opens vehicle search page
2. System checks if location permission previously granted
3. If not granted, display permission modal with explanation
4. Customer clicks "Allow" or "Deny"
5. If allowed, system detects location using GPS/browser API
6. Display detected location with accuracy estimate
7. Update search results to show nearby vehicles
8. Cache location for session duration

**Subsequent Location Usage**:
1. Customer returns to search page
2. System uses cached location from session
3. Display location indicator showing current location
4. Customer can refresh or override location
5. Location updates periodically (every 5 minutes) if permission granted

**Location Detection Failure**:
1. GPS/browser API fails or times out
2. System falls back to IP-based geolocation
3. Display lower accuracy warning
4. Offer manual location entry option
5. Continue with best available location data

### Data Requirements

**From Backend APIs**:
- POST /api/location/detect - Sends IP address, returns approximate location
- GET /api/vehicles/nearby - Returns vehicles near coordinates with distance
- POST /api/location/validate - Validates and geocodes manual address entry

**Location Data Structure**:
```
{
  latitude: number,
  longitude: number,
  accuracy: number, // meters
  source: 'gps' | 'browser' | 'ip' | 'manual',
  address: string, // reverse geocoded address
  timestamp: string, // ISO 8601
  cached: boolean
}
```

## Backend Specifications

### API Endpoints

**POST /api/location/detect**
- Purpose: Detect user location from IP address when GPS unavailable
- Request Body: { ipAddress: string }
- Response: { latitude, longitude, accuracy, city, country }
- Authentication: None required
- Rate Limiting: 100 requests per minute per IP

**GET /api/vehicles/nearby**
- Purpose: Find vehicles near specified coordinates
- Query Parameters: latitude, longitude, radius (km), limit
- Response: Array of vehicles with distance from coordinates
- Authentication: Optional (JWT for personalized results)
- Caching: 2 minutes

**POST /api/location/validate**
- Purpose: Validate and geocode manually entered address
- Request Body: { address: string }
- Response: { valid: boolean, coordinates, formattedAddress, components }
- Authentication: None required
- Rate Limiting: 50 requests per minute per user

**POST /api/location/reverse-geocode**
- Purpose: Convert coordinates to human-readable address
- Request Body: { latitude: number, longitude: number }
- Response: { address: string, components: object }
- Authentication: None required
- Caching: 1 hour per coordinate pair

### Request Schemas

**Location Detection Request**:
- ipAddress: string (IPv4 or IPv6)

**Nearby Vehicles Query**:
- latitude: number (required, -90 to 90)
- longitude: number (required, -180 to 180)
- radius: number (optional, default 10km, max 50km)
- limit: number (optional, default 50, max 200)

**Address Validation Request**:
- address: string (required, max 500 characters)
- country: string (optional, ISO country code for better accuracy)

### Response Schemas

**Location Detection Response**:
- latitude: number
- longitude: number
- accuracy: number (estimated accuracy in meters)
- city: string
- country: string
- source: 'ip'

**Nearby Vehicles Response**:
- vehicles: Array with id, name, type, coordinates, pricePerDay, distance (km)
- totalCount: number
- searchRadius: number (km)
- centerPoint: { latitude, longitude }

**Address Validation Response**:
- valid: boolean
- coordinates: { latitude, longitude }
- formattedAddress: string
- components: { street, city, state, postalCode, country }
- accuracy: string ('rooftop' | 'street' | 'city' | 'approximate')

### Business Logic

**Location Detection Priority**:
1. Use GPS/browser geolocation if permission granted (highest accuracy)
2. Fall back to IP-based geolocation if GPS unavailable (city-level accuracy)
3. Use cached location if recent (< 5 minutes old)
4. Allow manual override at any time

**Distance Calculation**:
- Use Haversine formula for straight-line distance
- Calculate driving distance using mapping API for distances > 5km
- Display walking distance for vehicles < 2km away
- Display driving distance for vehicles > 2km away

**Privacy Protection**:
- Do not store location history without explicit consent
- Anonymize location data for analytics (round to 0.01 degree precision)
- Clear location data on session end unless user opts to save
- Comply with GDPR and CCPA location data requirements

### Authentication Requirements

- Location detection: No authentication required
- Nearby vehicle search: Optional authentication (personalized results for logged-in users)
- Location history access: JWT token required
- Location data deletion: JWT token required with user ownership verification

## Database Specifications

### Schema Changes

Add location caching table for performance optimization.

### Table Definitions

**LocationCache Table** (new):
- id: INT PRIMARY KEY AUTO_INCREMENT
- ip_address: VARCHAR(45) UNIQUE - IPv4 or IPv6 address
- latitude: DECIMAL(10, 8) NOT NULL
- longitude: DECIMAL(11, 8) NOT NULL
- city: VARCHAR(100)
- country: VARCHAR(100)
- accuracy: INT - Accuracy in meters
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
- expires_at: DATETIME - Cache expiration (24 hours from creation)

**UserLocationHistory Table** (new, optional):
- id: INT PRIMARY KEY AUTO_INCREMENT
- user_id: INT NOT NULL
- latitude: DECIMAL(10, 8) NOT NULL
- longitude: DECIMAL(11, 8) NOT NULL
- accuracy: INT
- source: ENUM('gps', 'browser', 'ip', 'manual')
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
- consent_given: BOOLEAN DEFAULT FALSE

### Relationships

- UserLocationHistory.user_id → Users.id (foreign key, CASCADE on delete)

### Indexes

- CREATE INDEX idx_location_cache_ip ON LocationCache(ip_address)
- CREATE INDEX idx_location_cache_expires ON LocationCache(expires_at)
- CREATE INDEX idx_user_location_history_user ON UserLocationHistory(user_id, created_at DESC)
- CREATE INDEX idx_user_location_history_created ON UserLocationHistory(created_at)

## Technology Stack

- Backend: .NET 8+ with C#, ASP.NET Core Web API
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript, React 18+
- Mapping: Google Maps JavaScript API
- Geolocation: Browser Geolocation API, IP geolocation service (ipapi.co or similar)

## Implementation Notes

- Request location permission only when needed (just-in-time), not on page load
- Provide clear value proposition before requesting permission
- Handle permission denial gracefully without blocking core functionality
- Use HTTPS for all location-related requests (required by browser APIs)
- Implement location caching to reduce API calls and improve performance
- Set reasonable timeout for GPS detection (10 seconds)
- Fall back to IP geolocation if GPS times out
- Display accuracy estimate to set user expectations
- Allow users to manually override detected location
- Respect "Do Not Track" browser settings
- Implement location data retention policy (delete after 30 days unless consent given)
- Use environment variables for IP geolocation API keys
- Monitor IP geolocation API usage and costs
- Consider self-hosted IP geolocation database for cost optimization
- Test location detection across different devices and browsers
- Ensure location features work in areas with poor GPS signal
- Provide offline fallback using last known location
