# Feature: Saved Preferences & Locations - Backend

## Overview

The backend system for Saved Preferences & Locations provides RESTful APIs and business logic to store, retrieve, and manage user preferences and saved locations. The system handles preference validation, location geocoding, deduplication, and ensures data consistency across user sessions. It integrates with external geocoding services for address validation and provides efficient querying capabilities for preference application during the booking flow.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature IDs

- F-AM-013: Saved Preferences
- F-AM-014: Saved Locations
- F-FUNC-UM-009: User Preferences (Functional Requirements)

## Backend Specifications

### API Endpoints

#### User Preferences Endpoints

##### GET /api/users/{userId}/preferences
Retrieve all saved preferences for a user.

**Authentication**: Required (JWT token)
**Authorization**: User can only access their own preferences, or admin role

**Path Parameters**:
- `userId` (string, required): User identifier

**Response** (200 OK):
```json
{
  "userId": "usr_123456",
  "vehiclePreferences": {
    "categories": ["SUV", "Luxury"],
    "transmissionType": "Automatic",
    "fuelType": "Electric",
    "features": ["GPS", "Bluetooth", "Backup Camera"],
    "seatingCapacity": 5,
    "luggageCapacity": "Large"
  },
  "insurancePreferences": {
    "defaultTier": "Premium",
    "autoSelect": true,
    "notes": "Always include comprehensive coverage"
  },
  "extrasPreferences": {
    "gps": { "enabled": true, "autoAdd": true },
    "childSeat": { "enabled": true, "autoAdd": true, "age": "4-7 years" },
    "additionalDriver": { "enabled": false, "autoAdd": false },
    "tollPass": { "enabled": true, "autoAdd": true },
    "wifiHotspot": { "enabled": false, "autoAdd": false },
    "snowChains": { "enabled": false, "autoAdd": false },
    "skiRack": { "enabled": false, "autoAdd": false },
    "notes": ""
  },
  "paymentPreferences": {
    "defaultMethod": "credit_card",
    "savedPaymentMethodId": "pm_987654",
    "paymentTiming": "pay_now",
    "autoApply": true,
    "invoiceDelivery": "email"
  },
  "communicationPreferences": {
    "email": { "enabled": true, "address": "user@example.com" },
    "sms": { "enabled": true, "phone": "+1234567890" },
    "push": { "enabled": true },
    "notificationTypes": ["booking_confirmations", "payment_receipts", "trip_reminders"],
    "quietHours": { "start": "22:00", "end": "08:00" },
    "frequency": "real_time",
    "language": "en",
    "preferredContact": "email"
  },
  "accessibilityPreferences": {
    "mobilityRequirements": ["wheelchair_accessible", "hand_controls"],
    "visualRequirements": ["large_text"],
    "hearingRequirements": [],
    "cognitiveRequirements": [],
    "serviceAnimal": false,
    "notes": "Require vehicles with hand controls"
  },
  "lastUpdated": "2026-02-23T10:30:00Z"
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing authentication token
- 403 Forbidden: User not authorized to access these preferences
- 404 Not Found: User not found or no preferences saved

##### PUT /api/users/{userId}/preferences
Update user preferences (partial or complete update).

**Authentication**: Required (JWT token)
**Authorization**: User can only update their own preferences

**Path Parameters**:
- `userId` (string, required): User identifier

**Request Body** (partial update supported):
```json
{
  "vehiclePreferences": {
    "categories": ["SUV", "Luxury"],
    "transmissionType": "Automatic"
  },
  "insurancePreferences": {
    "defaultTier": "Premium",
    "autoSelect": true
  }
}
```

**Validation Rules**:
- At least one preference category must be provided
- Vehicle categories must be from valid enum
- Insurance tier must be from valid enum
- Email and phone must be valid formats if provided
- Quiet hours end time must be after start time
- Notification types must be from valid enum

**Response** (200 OK):
```json
{
  "userId": "usr_123456",
  "vehiclePreferences": { ... },
  "insurancePreferences": { ... },
  "lastUpdated": "2026-02-23T10:35:00Z"
}
```

**Error Responses**:
- 400 Bad Request: Invalid preference data or validation failure
- 401 Unauthorized: Invalid or missing authentication token
- 403 Forbidden: User not authorized to update these preferences
- 404 Not Found: User not found

##### PATCH /api/users/{userId}/preferences/{category}
Update a specific preference category.

**Authentication**: Required (JWT token)
**Authorization**: User can only update their own preferences

**Path Parameters**:
- `userId` (string, required): User identifier
- `category` (string, required): Preference category (vehicle, insurance, extras, payment, communication, accessibility)

**Request Body**:
```json
{
  "defaultTier": "Comprehensive",
  "autoSelect": false
}
```

**Response** (200 OK):
```json
{
  "category": "insurance",
  "preferences": {
    "defaultTier": "Comprehensive",
    "autoSelect": false,
    "notes": "Always include comprehensive coverage"
  },
  "lastUpdated": "2026-02-23T10:40:00Z"
}
```

**Error Responses**:
- 400 Bad Request: Invalid category or preference data
- 401 Unauthorized: Invalid or missing authentication token
- 403 Forbidden: User not authorized to update these preferences
- 404 Not Found: User or category not found

##### DELETE /api/users/{userId}/preferences
Delete all user preferences (reset to defaults).

**Authentication**: Required (JWT token)
**Authorization**: User can only delete their own preferences

**Path Parameters**:
- `userId` (string, required): User identifier

**Response** (204 No Content)

**Error Responses**:
- 401 Unauthorized: Invalid or missing authentication token
- 403 Forbidden: User not authorized to delete these preferences
- 404 Not Found: User not found

#### Saved Locations Endpoints

##### GET /api/users/{userId}/locations
Retrieve all saved locations for a user.

**Authentication**: Required (JWT token)
**Authorization**: User can only access their own locations

**Path Parameters**:
- `userId` (string, required): User identifier

**Query Parameters**:
- `sort` (string, optional): Sort order (most_used, recently_used, alphabetical, created_date)
- `filter` (string, optional): Filter by location type (home, work, airport, hotel, custom)
- `limit` (integer, optional): Maximum number of results (default: 20, max: 50)
- `offset` (integer, optional): Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "locations": [
    {
      "locationId": "loc_123456",
      "userId": "usr_123456",
      "nickname": "Home",
      "locationType": "home",
      "address": {
        "street": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "postalCode": "94102",
        "country": "USA",
        "coordinates": {
          "lat": 37.7749,
          "lng": -122.4194
        }
      },
      "notes": "Parking in driveway",
      "isDefaultPickup": true,
      "isDefaultReturn": true,
      "usageCount": 15,
      "lastUsed": "2026-02-20T14:30:00Z",
      "createdAt": "2025-06-15T10:00:00Z",
      "updatedAt": "2026-02-20T14:30:00Z"
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing authentication token
- 403 Forbidden: User not authorized to access these locations
- 404 Not Found: User not found

##### POST /api/users/{userId}/locations
Create a new saved location.

**Authentication**: Required (JWT token)
**Authorization**: User can only create locations for themselves

**Path Parameters**:
- `userId` (string, required): User identifier

**Request Body**:
```json
{
  "nickname": "Office",
  "locationType": "work",
  "address": {
    "street": "456 Market St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94105",
    "country": "USA"
  },
  "notes": "Use visitor parking",
  "isDefaultPickup": false,
  "isDefaultReturn": false
}
```

**Validation Rules**:
- Nickname is required and must be unique per user
- Nickname must be 1-50 characters
- Location type must be from valid enum
- Address must be valid and geocodable
- User cannot have more than 20 saved locations
- Only one location can be default pickup
- Only one location can be default return

**Business Logic**:
- System geocodes address to obtain coordinates
- System validates address is within service area
- System checks for duplicate locations (same coordinates within 50m)
- If setting as default, system unsets previous default

**Response** (201 Created):
```json
{
  "locationId": "loc_789012",
  "userId": "usr_123456",
  "nickname": "Office",
  "locationType": "work",
  "address": {
    "street": "456 Market St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94105",
    "country": "USA",
    "coordinates": {
      "lat": 37.7946,
      "lng": -122.3999
    }
  },
  "notes": "Use visitor parking",
  "isDefaultPickup": false,
  "isDefaultReturn": false,
  "usageCount": 0,
  "lastUsed": null,
  "createdAt": "2026-02-23T10:45:00Z",
  "updatedAt": "2026-02-23T10:45:00Z"
}
```

**Error Responses**:
- 400 Bad Request: Invalid location data, validation failure, or duplicate location
- 401 Unauthorized: Invalid or missing authentication token
- 403 Forbidden: User not authorized or location limit reached
- 404 Not Found: User not found
- 422 Unprocessable Entity: Address cannot be geocoded or outside service area

##### GET /api/users/{userId}/locations/{locationId}
Retrieve a specific saved location.

**Authentication**: Required (JWT token)
**Authorization**: User can only access their own locations

**Path Parameters**:
- `userId` (string, required): User identifier
- `locationId` (string, required): Location identifier

**Response** (200 OK):
```json
{
  "locationId": "loc_123456",
  "userId": "usr_123456",
  "nickname": "Home",
  "locationType": "home",
  "address": { ... },
  "notes": "Parking in driveway",
  "isDefaultPickup": true,
  "isDefaultReturn": true,
  "usageCount": 15,
  "lastUsed": "2026-02-20T14:30:00Z",
  "createdAt": "2025-06-15T10:00:00Z",
  "updatedAt": "2026-02-20T14:30:00Z"
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing authentication token
- 403 Forbidden: User not authorized to access this location
- 404 Not Found: Location not found

##### PUT /api/users/{userId}/locations/{locationId}
Update an existing saved location.

**Authentication**: Required (JWT token)
**Authorization**: User can only update their own locations

**Path Parameters**:
- `userId` (string, required): User identifier
- `locationId` (string, required): Location identifier

**Request Body** (partial update supported):
```json
{
  "nickname": "Home Office",
  "notes": "Ring doorbell for access",
  "isDefaultPickup": true
}
```

**Validation Rules**:
- Same validation rules as POST
- Nickname must remain unique if changed

**Business Logic**:
- If address is changed, system re-geocodes
- If setting as default, system unsets previous default
- System updates updatedAt timestamp

**Response** (200 OK):
```json
{
  "locationId": "loc_123456",
  "userId": "usr_123456",
  "nickname": "Home Office",
  "locationType": "home",
  "address": { ... },
  "notes": "Ring doorbell for access",
  "isDefaultPickup": true,
  "isDefaultReturn": true,
  "usageCount": 15,
  "lastUsed": "2026-02-20T14:30:00Z",
  "createdAt": "2025-06-15T10:00:00Z",
  "updatedAt": "2026-02-23T10:50:00Z"
}
```

**Error Responses**:
- 400 Bad Request: Invalid location data or validation failure
- 401 Unauthorized: Invalid or missing authentication token
- 403 Forbidden: User not authorized to update this location
- 404 Not Found: Location not found
- 422 Unprocessable Entity: Address cannot be geocoded

##### DELETE /api/users/{userId}/locations/{locationId}
Delete a saved location.

**Authentication**: Required (JWT token)
**Authorization**: User can only delete their own locations

**Path Parameters**:
- `userId` (string, required): User identifier
- `locationId` (string, required): Location identifier

**Response** (204 No Content)

**Error Responses**:
- 401 Unauthorized: Invalid or missing authentication token
- 403 Forbidden: User not authorized to delete this location
- 404 Not Found: Location not found

##### GET /api/users/{userId}/location-history
Retrieve location usage history.

**Authentication**: Required (JWT token)
**Authorization**: User can only access their own history

**Path Parameters**:
- `userId` (string, required): User identifier

**Query Parameters**:
- `limit` (integer, optional): Maximum number of results (default: 50, max: 100)
- `startDate` (string, optional): Filter by start date (ISO 8601 format)
- `endDate` (string, optional): Filter by end date (ISO 8601 format)

**Response** (200 OK):
```json
{
  "history": [
    {
      "historyId": "hist_123456",
      "userId": "usr_123456",
      "locationId": "loc_123456",
      "address": {
        "street": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "postalCode": "94102",
        "country": "USA",
        "coordinates": {
          "lat": 37.7749,
          "lng": -122.4194
        }
      },
      "bookingId": "bkg_789012",
      "usedAt": "2026-02-20T14:30:00Z",
      "locationType": "pickup"
    }
  ],
  "total": 45,
  "limit": 50
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing authentication token
- 403 Forbidden: User not authorized to access this history
- 404 Not Found: User not found

#### Geocoding Endpoints

##### POST /api/locations/geocode
Convert address to coordinates and validate.

**Authentication**: Required (JWT token)

**Request Body**:
```json
{
  "street": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "94102",
  "country": "USA"
}
```

**Response** (200 OK):
```json
{
  "address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94102",
    "country": "USA",
    "formattedAddress": "123 Main St, San Francisco, CA 94102, USA",
    "coordinates": {
      "lat": 37.7749,
      "lng": -122.4194
    }
  },
  "isValid": true,
  "inServiceArea": true,
  "nearestRentalLocation": {
    "locationId": "rental_456",
    "name": "Downtown SF Rental",
    "distance": 1.2
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid address format
- 401 Unauthorized: Invalid or missing authentication token
- 422 Unprocessable Entity: Address cannot be geocoded

##### POST /api/locations/reverse-geocode
Convert coordinates to address.

**Authentication**: Required (JWT token)

**Request Body**:
```json
{
  "lat": 37.7749,
  "lng": -122.4194
}
```

**Response** (200 OK):
```json
{
  "address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94102",
    "country": "USA",
    "formattedAddress": "123 Main St, San Francisco, CA 94102, USA",
    "coordinates": {
      "lat": 37.7749,
      "lng": -122.4194
    }
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid coordinates
- 401 Unauthorized: Invalid or missing authentication token
- 422 Unprocessable Entity: Coordinates cannot be reverse geocoded

### Business Logic

#### Preference Management Logic

**Preference Initialization**:
- When a new user registers, create default preferences with empty/null values
- Do not auto-populate preferences without user input
- Track whether user has explicitly set preferences vs using defaults

**Preference Application**:
- Apply saved preferences when user starts new booking flow
- Pre-fill search filters with vehicle preferences
- Auto-select insurance tier if autoSelect is enabled
- Auto-add extras if autoAdd is enabled for each extra
- Pre-select payment method if autoApply is enabled
- Allow user to override any pre-filled preference during booking
- Do not persist overrides unless user explicitly updates preferences

**Preference Validation**:
- Validate all preference values against allowed enums
- Ensure email and phone formats are valid
- Verify payment method exists and belongs to user
- Check that quiet hours are logically valid
- Validate that at least one notification channel is enabled

**Preference Conflict Resolution**:
- If user sets new default pickup location, unset previous default
- If user sets new default return location, unset previous default
- If user disables all notification channels, show warning but allow
- If user sets conflicting preferences (e.g., electric vehicle + gas station preference), show warning

#### Location Management Logic

**Location Creation**:
- Geocode address using external service (Google Maps API or Mapbox)
- Validate that coordinates are within service area
- Check for duplicate locations within 50 meters
- If duplicate found, suggest using existing location instead
- Generate unique locationId
- Set usageCount to 0
- Set lastUsed to null
- Set createdAt and updatedAt to current timestamp

**Location Deduplication**:
- Calculate distance between new location and all existing locations
- If distance < 50 meters, consider duplicate
- Prompt user to merge or keep separate
- If merging, update existing location with new nickname/notes
- Increment usage count of existing location

**Location Usage Tracking**:
- When location is used in a booking, increment usageCount
- Update lastUsed timestamp
- Create location history entry
- If location was not previously saved, suggest saving it

**Location Suggestions**:
- If user has used same address 3+ times without saving, suggest saving
- Analyze booking patterns to suggest location types (home, work, airport)
- Suggest nicknames based on usage patterns and time of day

**Default Location Management**:
- Only one location can be default pickup per user
- Only one location can be default return per user
- When setting new default, automatically unset previous default
- Use database transaction to ensure atomicity

**Location Limit Enforcement**:
- Enforce maximum of 20 saved locations per user
- When limit is reached, suggest deleting unused locations
- Sort by usage count and last used date to identify candidates for deletion
- Allow user to override limit with premium account (future enhancement)

#### Geocoding Integration

**Address Validation**:
- Use Google Geocoding API or Mapbox Geocoding API
- Validate address components (street, city, state, postal code, country)
- Return formatted address with standardized components
- Include confidence score for geocoding result
- Reject addresses with low confidence scores

**Service Area Validation**:
- Check if coordinates fall within defined service area polygons
- Query nearest rental location to coordinates
- Calculate distance to nearest rental location
- Reject locations more than 50km from nearest rental location
- Provide alternative nearby locations if outside service area

**Geocoding Error Handling**:
- Retry failed geocoding requests up to 3 times with exponential backoff
- Cache geocoding results for 30 days to reduce API calls
- Fall back to alternative geocoding service if primary fails
- Log geocoding failures for monitoring and debugging

### Authentication Requirements

**JWT Token Validation**:
- All endpoints require valid JWT token in Authorization header
- Token must contain userId claim
- Token must not be expired
- Token must have appropriate scope for operation

**Authorization Rules**:
- Users can only access their own preferences and locations
- Admin users can access any user's preferences and locations (read-only)
- System administrators can modify any user's preferences and locations
- Service accounts can read preferences for booking application logic

**Rate Limiting**:
- Limit preference updates to 10 per minute per user
- Limit location creation to 5 per minute per user
- Limit geocoding requests to 20 per minute per user
- Return 429 Too Many Requests if limits exceeded

### Data Validation

**Preference Validation Rules**:
- Vehicle categories: Must be from enum (Economy, Compact, Midsize, SUV, Luxury, Van, Truck, Electric, Hybrid)
- Transmission type: Must be from enum (Automatic, Manual, No preference)
- Fuel type: Must be from enum (Gasoline, Diesel, Electric, Hybrid, No preference)
- Insurance tier: Must be from enum (Basic, Standard, Premium, Comprehensive)
- Payment method: Must be from enum (credit_card, debit_card, digital_wallet, bank_transfer)
- Payment timing: Must be from enum (pay_now, pay_at_pickup, split_payment)
- Notification frequency: Must be from enum (real_time, daily_digest, weekly_digest)
- Language: Must be valid ISO 639-1 code
- Email: Must match email regex pattern
- Phone: Must match E.164 format

**Location Validation Rules**:
- Nickname: 1-50 characters, alphanumeric and spaces only
- Location type: Must be from enum (home, work, airport, hotel, custom)
- Street: 1-100 characters
- City: 1-50 characters
- State: 2-50 characters
- Postal code: 3-10 characters
- Country: Valid ISO 3166-1 alpha-3 code
- Coordinates: Latitude -90 to 90, Longitude -180 to 180
- Notes: 0-500 characters

### Error Handling

**Validation Errors**:
- Return 400 Bad Request with detailed error messages
- Include field name and validation rule that failed
- Provide suggestions for correction
- Use consistent error response format

**Geocoding Errors**:
- Return 422 Unprocessable Entity if address cannot be geocoded
- Include reason for failure (ambiguous address, invalid format, outside service area)
- Suggest alternative addresses if available
- Log geocoding failures for analysis

**Database Errors**:
- Return 500 Internal Server Error for database failures
- Log full error details for debugging
- Return generic error message to client (do not expose internal details)
- Implement retry logic for transient failures

**External Service Errors**:
- Implement circuit breaker pattern for geocoding API
- Fall back to cached results if external service is unavailable
- Return 503 Service Unavailable if critical external service is down
- Queue requests for retry when service recovers

### Performance Optimization

**Caching Strategy**:
- Cache user preferences in Redis for 1 hour
- Cache geocoding results for 30 days
- Invalidate preference cache on update
- Use cache-aside pattern for reads

**Database Optimization**:
- Index userId on preferences and locations tables
- Index coordinates for geospatial queries
- Use database connection pooling
- Implement read replicas for high-traffic queries

**Query Optimization**:
- Use pagination for location lists
- Limit location history to last 100 entries
- Use database views for complex preference queries
- Implement query result caching

**API Response Optimization**:
- Use gzip compression for responses
- Implement ETag headers for caching
- Support conditional requests (If-None-Match)
- Minimize response payload size

## Technology Stack

- **Backend Framework**: .NET 8+ with C# and ASP.NET Core Web API
- **ORM**: Entity Framework Core for database access
- **Authentication**: JWT tokens with .NET Identity
- **Validation**: FluentValidation library
- **Geocoding**: Google Maps Geocoding API or Mapbox Geocoding API
- **Caching**: Redis for distributed caching
- **Logging**: Serilog for structured logging
- **API Documentation**: Swagger/OpenAPI

## Implementation Notes

### Database Transactions
- Use transactions for operations that modify multiple records (e.g., setting default location)
- Implement optimistic concurrency control using row versioning
- Handle deadlocks with retry logic

### External Service Integration
- Implement retry logic with exponential backoff for geocoding API calls
- Use circuit breaker pattern to prevent cascading failures
- Monitor API usage and costs
- Implement fallback to alternative geocoding service

### Security Considerations
- Sanitize all user input to prevent SQL injection
- Validate and escape address data before geocoding
- Do not expose internal error details in API responses
- Implement rate limiting to prevent abuse
- Log all preference and location modifications for audit trail

### Testing Requirements
- Unit tests for all business logic methods
- Integration tests for API endpoints
- Mock external geocoding service in tests
- Test concurrent updates to default locations
- Test preference application logic in booking flow
- Property-based tests for validation rules

### Monitoring and Logging
- Log all API requests with userId and endpoint
- Track geocoding API usage and costs
- Monitor preference update frequency
- Alert on high error rates or slow response times
- Track location creation and deletion patterns
