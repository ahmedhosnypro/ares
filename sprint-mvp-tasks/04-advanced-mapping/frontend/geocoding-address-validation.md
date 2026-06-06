# Feature: Geocoding and Address Validation

## Overview

Convert addresses to geographic coordinates and validate address accuracy using geocoding APIs. The system provides address autocomplete suggestions as users type, validates and standardizes addresses before storing, and extracts address components for structured data storage. This ensures accurate location data throughout the booking process and reduces errors in pickup and dropoff locations.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-MAP-003

## User Stories

As a customer, I want address autocomplete and validation, so that I can enter pickup and dropoff locations accurately and quickly.

As a customer entering an address, I want suggestions as I type, so that I don't have to type the complete address manually.

As a platform operator, I want standardized address data, so that location information is consistent and reliable across the system.

## Frontend Specifications

### Pages

- Vehicle Search Page with Location Input
- Booking Page with Pickup/Dropoff Address Entry
- User Profile Page with Saved Addresses
- Location Management Page

### UI Components

**Address Autocomplete Input**:
- Text input with real-time suggestions dropdown
- Debounced input (300ms) to reduce API calls
- Dropdown showing top 5 address suggestions
- Each suggestion shows formatted address with icon
- Keyboard navigation (arrow keys, enter to select)
- Clear button to reset input
- Loading indicator during API calls
- "Use current location" quick action button

**Address Validation Indicator**:
- Green checkmark for validated addresses
- Yellow warning for ambiguous addresses
- Red error for invalid addresses
- Tooltip explaining validation status
- "Edit" button to modify address

**Address Component Display**:
- Structured display of address parts
- Street address line 1
- Street address line 2 (optional)
- City, State/Province
- Postal code
- Country
- Coordinates (latitude, longitude) - hidden from user, stored for backend

**Saved Address Card**:
- Nickname (Home, Work, Airport)
- Formatted address
- Edit and delete buttons
- Set as default option
- Quick select for booking

### User Flows

**Address Entry with Autocomplete**:
1. Customer focuses on address input field
2. Customer types first few characters (e.g., "123 Main")
3. System debounces input for 300ms
4. System calls geocoding API for suggestions
5. Dropdown displays top 5 matching addresses
6. Customer selects address from dropdown or continues typing
7. System validates selected address
8. System displays validation indicator (checkmark)
9. System extracts and stores address components and coordinates
10. Customer proceeds with booking

**Ambiguous Address Resolution**:
1. Customer enters ambiguous address (e.g., "Main Street")
2. System detects multiple matches
3. System displays all matching options with map preview
4. Customer selects correct address
5. System validates and stores selected address

**Manual Coordinate Entry** (for P2P hosts):
1. Host clicks "Set location on map"
2. System displays map with draggable marker
3. Host drags marker to vehicle location
4. System reverse geocodes coordinates to address
5. System displays formatted address for confirmation
6. Host confirms or adjusts address
7. System stores coordinates and address

### Data Requirements

**From Backend APIs**:
- GET /api/geocoding/autocomplete - Returns address suggestions
- POST /api/geocoding/validate - Validates and geocodes address
- POST /api/geocoding/reverse - Converts coordinates to address
- GET /api/addresses/saved - Returns user's saved addresses

**Address Data Structure**:
```
{
  formattedAddress: string,
  components: {
    street: string,
    city: string,
    state: string,
    postalCode: string,
    country: string
  },
  coordinates: {
    latitude: number,
    longitude: number
  },
  accuracy: 'rooftop' | 'street' | 'city' | 'approximate',
  validated: boolean
}
```

## Backend Specifications

### API Endpoints

**GET /api/geocoding/autocomplete**
- Purpose: Provide address suggestions as user types
- Query Parameters: input (search text), sessionToken (for billing), country (optional)
- Response: Array of address predictions with place IDs
- Authentication: None required
- Rate Limiting: 100 requests per minute per user
- Caching: No caching (real-time suggestions)

**POST /api/geocoding/validate**
- Purpose: Validate address and return coordinates
- Request Body: { address: string, country: string (optional) }
- Response: { valid, coordinates, formattedAddress, components, accuracy }
- Authentication: None required
- Rate Limiting: 50 requests per minute per user
- Caching: 1 hour per unique address

**POST /api/geocoding/reverse**
- Purpose: Convert coordinates to human-readable address
- Request Body: { latitude: number, longitude: number }
- Response: { formattedAddress, components }
- Authentication: None required
- Rate Limiting: 50 requests per minute per user
- Caching: 1 hour per coordinate pair

**GET /api/addresses/saved**
- Purpose: Retrieve user's saved addresses
- Response: Array of saved addresses with nicknames
- Authentication: JWT token required
- Caching: No caching (user-specific data)

**POST /api/addresses/saved**
- Purpose: Save address to user profile
- Request Body: { nickname, address, coordinates, components }
- Response: Created address with ID
- Authentication: JWT token required

### Request Schemas

**Autocomplete Request**:
- input: string (required, min 3 characters)
- sessionToken: string (optional, for billing optimization)
- country: string (optional, ISO country code)
- types: array (optional, filter by address type)

**Validation Request**:
- address: string (required, max 500 characters)
- country: string (optional, improves accuracy)

**Reverse Geocoding Request**:
- latitude: number (required, -90 to 90)
- longitude: number (required, -180 to 180)
- language: string (optional, for localized addresses)

### Response Schemas

**Autocomplete Response**:
- predictions: Array with description (formatted address), placeId, types
- sessionToken: string (for subsequent requests)

**Validation Response**:
- valid: boolean
- coordinates: { latitude, longitude }
- formattedAddress: string
- components: { street, city, state, postalCode, country }
- accuracy: string ('rooftop' | 'street' | 'city' | 'approximate')
- placeId: string (for future reference)

**Reverse Geocoding Response**:
- formattedAddress: string
- components: { street, city, state, postalCode, country }
- placeId: string

### Business Logic

**Address Validation Rules**:
- Require minimum 3 characters before showing suggestions
- Validate address has street, city, and country components
- Reject addresses that cannot be geocoded
- Standardize address format using geocoding API
- Store both user-entered and standardized addresses

**Geocoding Cache Strategy**:
- Cache validated addresses for 1 hour
- Cache reverse geocoding results for 1 hour
- Use session tokens to optimize autocomplete billing
- Implement LRU cache eviction for memory management

**International Address Support**:
- Support address formats for all countries in service area
- Use country-specific validation rules
- Display addresses in local format
- Handle right-to-left languages for Middle East

### Authentication Requirements

- Address autocomplete: No authentication required
- Address validation: No authentication required
- Saved addresses: JWT token required
- Address history: JWT token required with user ownership verification

## Database Specifications

### Schema Changes

Add geocoding cache table and saved addresses table.

### Table Definitions

**GeocodingCache Table** (new):
- id: INT PRIMARY KEY AUTO_INCREMENT
- address_hash: VARCHAR(64) UNIQUE NOT NULL - SHA256 hash of address
- formatted_address: VARCHAR(500) NOT NULL
- latitude: DECIMAL(10, 8) NOT NULL
- longitude: DECIMAL(11, 8) NOT NULL
- street: VARCHAR(200)
- city: VARCHAR(100)
- state: VARCHAR(100)
- postal_code: VARCHAR(20)
- country: VARCHAR(100)
- accuracy: ENUM('rooftop', 'street', 'city', 'approximate')
- place_id: VARCHAR(200) - Google Maps Place ID
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
- expires_at: DATETIME - Cache expiration

**SavedAddresses Table** (new):
- id: INT PRIMARY KEY AUTO_INCREMENT
- user_id: INT NOT NULL
- nickname: VARCHAR(50) - Home, Work, Airport, etc.
- formatted_address: VARCHAR(500) NOT NULL
- latitude: DECIMAL(10, 8) NOT NULL
- longitude: DECIMAL(11, 8) NOT NULL
- street: VARCHAR(200)
- city: VARCHAR(100)
- state: VARCHAR(100)
- postal_code: VARCHAR(20)
- country: VARCHAR(100)
- is_default: BOOLEAN DEFAULT FALSE
- usage_count: INT DEFAULT 0 - Track frequency of use
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
- updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

### Relationships

- SavedAddresses.user_id → Users.id (foreign key, CASCADE on delete)

### Indexes

- CREATE INDEX idx_geocoding_cache_hash ON GeocodingCache(address_hash)
- CREATE INDEX idx_geocoding_cache_expires ON GeocodingCache(expires_at)
- CREATE INDEX idx_saved_addresses_user ON SavedAddresses(user_id)
- CREATE INDEX idx_saved_addresses_default ON SavedAddresses(user_id, is_default)

## Technology Stack

- Backend: .NET 8+ with C#, ASP.NET Core Web API
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript, React 18+
- Geocoding: Google Maps Geocoding API, Places API (Autocomplete)
- Caching: Redis for geocoding cache (optional, for high-volume)

## Implementation Notes

- Use Google Maps Places API (Autocomplete) for address suggestions
- Implement session tokens to optimize autocomplete billing (charged per session, not per request)
- Debounce autocomplete requests to 300ms to reduce API calls
- Cache geocoding results aggressively (addresses rarely change)
- Use address hash (SHA256) as cache key to handle duplicate addresses
- Implement cache expiration (1 hour for geocoding, 24 hours for reverse geocoding)
- Store both formatted address and components for flexibility
- Validate addresses before storing in database
- Handle international address formats correctly
- Support address entry in local language
- Provide clear error messages for invalid addresses
- Allow manual coordinate entry for P2P hosts (drag marker on map)
- Implement reverse geocoding for coordinate-based entries
- Monitor geocoding API usage and costs
- Consider alternative providers (Mapbox, HERE) for cost optimization
- Implement rate limiting to prevent API abuse
- Use environment variables for API keys
- Test with addresses from all supported countries
- Ensure accessibility for keyboard-only address entry
- Provide skip validation option for edge cases (with admin approval)
