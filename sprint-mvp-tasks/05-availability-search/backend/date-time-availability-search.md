# Feature: Date Time Availability Search - Backend

## Overview

Backend API services for precise rental period specification with real-time availability checking, duration calculation, and rental period validation. Supports calendar/time pickers with configurable intervals and enforces business rules for minimum/maximum rental periods and buffer times.

## Sprint Category

MVP - Must have for first release (3 weeks)

## Feature ID

F-SD-003

## User Stories

- As a backend system, I want to validate rental periods against business rules, so that only valid bookings are accepted.
- As a backend system, I want to check real-time vehicle availability, so that double-bookings are prevented.
- As a backend system, I want to calculate rental duration accurately, so that pricing is correct.
- As a backend system, I want to enforce buffer times between bookings, so that vehicles can be prepared for next rental.
- As a backend system, I want to handle timezone conversions, so that international bookings work correctly.

## Backend Specifications

### API Endpoints

**Availability Check**
- **Endpoint**: `POST /api/availability/check`
- **Purpose**: Check vehicle availability for specified date range and location
- **Authentication**: Public (no auth required)
- **Rate Limit**: 100 requests per minute per IP

**Vehicle Calendar**
- **Endpoint**: `GET /api/vehicles/{id}/calendar`
- **Query Parameters**: `start` (ISO8601 date), `end` (ISO8601 date)
- **Purpose**: Retrieve availability calendar for specific vehicle
- **Authentication**: Optional (enhanced details for authenticated users)

**Blocked Dates**
- **Endpoint**: `GET /api/vehicles/{id}/blocked-dates`
- **Purpose**: Get maintenance and blocked periods for vehicle
- **Authentication**: Public

**Period Validation**
- **Endpoint**: `POST /api/availability/validate`
- **Purpose**: Validate rental period meets business constraints
- **Authentication**: Public

**Rental Constraints**
- **Endpoint**: `GET /api/config/rental-constraints`
- **Query Parameters**: `vehicleType` (optional), `locationId` (optional)
- **Purpose**: Retrieve rental period rules and constraints
- **Authentication**: Public

### Request Schemas

**Availability Check Request:**
```json
{
  "vehicleIds": ["string"] (optional - if omitted, checks all vehicles),
  "pickupDateTime": "2026-03-15T10:00:00Z",
  "returnDateTime": "2026-03-18T10:00:00Z",
  "locationId": "string",
  "vehicleType": "string" (optional)
}
```

**Period Validation Request:**
```json
{
  "pickupDateTime": "2026-03-15T10:00:00Z",
  "returnDateTime": "2026-03-18T10:00:00Z",
  "vehicleType": "string" (optional),
  "locationId": "string" (optional)
}
```

### Response Schemas

**Availability Response:**
```json
{
  "available": true,
  "availableVehicles": [
    {
      "vehicleId": "string",
      "available": true,
      "nextAvailableDate": "2026-03-20T10:00:00Z" (if not available)
    }
  ],
  "duration": {
    "days": 3,
    "hours": 72,
    "totalHours": 72
  },
  "requestedPeriod": {
    "pickup": "2026-03-15T10:00:00Z",
    "return": "2026-03-18T10:00:00Z"
  }
}
```

**Calendar Response:**
```json
{
  "vehicleId": "string",
  "calendar": [
    {
      "date": "2026-03-15",
      "status": "available" | "booked" | "maintenance" | "buffer",
      "reason": "string" (optional),
      "bookingId": "string" (if booked)
    }
  ],
  "dateRange": {
    "start": "2026-03-01",
    "end": "2026-03-31"
  }
}
```

**Validation Response:**
```json
{
  "valid": true,
  "errors": [
    {
      "code": "MINIMUM_PERIOD_NOT_MET",
      "message": "Rental period must be at least 1 hour",
      "field": "returnDateTime"
    }
  ],
  "constraints": {
    "minimumHours": 1,
    "maximumDays": 90,
    "bufferHours": 2,
    "timeIntervalMinutes": 30
  }
}
```

**Rental Constraints Response:**
```json
{
  "constraints": [
    {
      "vehicleType": "economy",
      "locationId": "LAX-001",
      "minimumRentalHours": 1,
      "maximumRentalDays": 90,
      "bufferHours": 2,
      "timeIntervalMinutes": 30
    }
  ],
  "defaultConstraints": {
    "minimumRentalHours": 1,
    "maximumRentalDays": 90,
    "bufferHours": 2,
    "timeIntervalMinutes": 30
  }
}
```

### Business Logic

**Duration Calculation**
- Calculate total rental duration in days, hours, and minutes
- Round to nearest time interval (15, 30, or 60 minutes)
- Handle partial days for hourly rentals
- Support both hourly and daily rental models

**Availability Checking**
- Query existing bookings for date range overlap
- Check maintenance schedule for blocked periods
- Apply buffer time between consecutive bookings
- Handle concurrent booking requests with pessimistic locking
- Support multi-vehicle availability checks
- Filter by location and vehicle type

**Period Validation**
- Validate return date/time is after pickup date/time
- Enforce minimum rental period (configurable by vehicle type)
- Enforce maximum rental period (configurable by vehicle type)
- Validate pickup date is not in the past
- Check time intervals match configured increments
- Validate timezone information is present

**Buffer Time Management**
- Apply configurable buffer hours between bookings
- Account for vehicle preparation time (cleaning, inspection)
- Support different buffer times by vehicle type
- Handle back-to-back bookings at different locations

**Timezone Handling**
- Store all datetimes in UTC in database
- Accept ISO8601 format with timezone information
- Convert to location timezone for display
- Handle daylight saving time transitions
- Validate timezone consistency across pickup/return

**Pricing Integration**
- Calculate base rental cost based on duration
- Apply hourly vs daily rate logic
- Support volume discounts for longer rentals
- Pass duration to pricing engine for rate calculation

### Authentication Requirements

**Public Endpoints**
- Availability checking (with rate limiting)
- Period validation
- Rental constraints retrieval

**Authenticated Endpoints**
- Detailed availability calendars (optional enhancement)
- Booking creation (separate workflow)

**Rate Limiting**
- 100 requests per minute per IP for availability checks
- 1000 requests per hour per authenticated user
- Exponential backoff for repeated failures

### Error Handling

**Validation Errors (400 Bad Request)**
- Invalid date format
- Return before pickup
- Past pickup date
- Period too short or too long
- Invalid time interval
- Missing required fields

**Not Found Errors (404)**
- Vehicle ID not found
- Location ID not found

**Conflict Errors (409)**
- Vehicle already booked for period
- Concurrent booking conflict

**Server Errors (500)**
- Database connection failure
- Timezone conversion error
- Unexpected calculation error

### Performance Optimization

**Caching Strategy**
- Cache rental constraints (1 hour TTL)
- Cache vehicle availability (1-2 minutes TTL)
- Invalidate cache on booking creation/cancellation
- Use Redis for distributed caching

**Database Optimization**
- Use indexed date range queries
- Implement efficient overlap detection
- Batch availability checks for multiple vehicles
- Use read replicas for availability queries
- Implement connection pooling

**Concurrent Request Handling**
- Use pessimistic locking for booking creation
- Implement retry logic with exponential backoff
- Queue availability checks during high load
- Use async processing for non-critical operations

## Technology Stack

- Backend: .NET 8+ with C# and ASP.NET Core Web API
- Database: MySQL 8.0+ with InnoDB storage engine
- Caching: Redis for distributed caching
- Date/Time: NodaTime library for timezone handling
- API Documentation: Swagger/OpenAPI 3.0

## Implementation Notes

### Date Range Overlap Detection

Use efficient SQL query to detect booking conflicts:
```sql
SELECT COUNT(*) FROM bookings 
WHERE vehicle_id = @vehicleId 
AND status IN ('confirmed', 'active')
AND (
  (pickup_datetime < @returnDateTime AND return_datetime > @pickupDateTime)
)
```

### Buffer Time Application

Add buffer hours to booking end time when checking availability:
```
effective_return_datetime = return_datetime + buffer_hours
```

### Timezone Best Practices

- Always store UTC in database
- Accept ISO8601 with timezone offset
- Convert to location timezone for display only
- Use NodaTime for reliable timezone handling
- Test DST transition edge cases

### Logging and Monitoring

- Log all availability checks with parameters
- Monitor availability check response times
- Track booking conflict rates
- Alert on high error rates
- Log timezone conversion failures

### Security Considerations

- Validate all date inputs on backend
- Prevent SQL injection in date queries
- Implement rate limiting to prevent abuse
- Sanitize error messages (no sensitive data)
- Log suspicious booking patterns

### Testing Requirements

- Unit tests for duration calculation
- Unit tests for overlap detection
- Integration tests for availability API
- Load tests for concurrent requests
- Timezone handling tests
- Edge case tests (leap years, DST)
