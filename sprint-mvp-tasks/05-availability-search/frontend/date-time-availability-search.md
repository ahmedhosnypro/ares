# Feature: Date Time Availability Search

## Overview

Precise rental period specification with calendar/time pickers, duration calculation, real-time availability checking, visual availability calendar, blocked dates display, and buffer time enforcement.

## Sprint Category

MVP - Must have for first release (3 weeks)

## Feature ID

F-SD-003

## User Stories

- As a customer, I want to specify exact pickup and return dates and times, so that I see only vehicles available for my specific rental period.
- As a customer, I want to see rental duration calculated automatically, so that I understand the total rental length.
- As a customer, I want real-time availability checking, so that I don't waste time on unavailable vehicles.
- As a customer, I want to see a visual availability calendar, so that I can choose alternative dates if needed.
- As a customer, I want to see blocked dates for maintenance, so that I understand why certain dates are unavailable.

## Frontend Specifications

### Pages

- Search page with date/time selection components
- Vehicle details page with availability calendar
- Booking flow with date/time confirmation

### UI Components

- Calendar picker component for date selection
- Time picker component with configurable intervals (15/30/60 minutes)
- Duration display component showing rental length
- Availability calendar component with visual indicators
- Blocked dates overlay showing maintenance periods
- Quick date selection buttons ("This Weekend", "Next Week")
- Date range validation component
- Minimum/maximum rental period indicators

### User Flows

1. User selects pickup date using calendar picker
2. User selects pickup time using time picker
3. User selects return date using calendar picker
4. User selects return time using time picker
5. System calculates and displays rental duration
6. System performs real-time availability check
7. System displays available vehicles for selected period
8. User views vehicle details with availability calendar
9. System shows blocked dates and buffer times
10. User confirms dates and proceeds to booking

### Data Requirements

- API endpoint for checking vehicle availability by date range
- API endpoint for retrieving blocked dates and maintenance schedules
- API endpoint for validating rental period constraints
- Response schema with availability status and blocked dates
- Real-time availability updates via WebSocket or polling

## Backend Specifications

### API Endpoints

- `POST /api/availability/check` - Check vehicle availability for date range
- `GET /api/vehicles/{id}/calendar?start={date}&end={date}` - Get availability calendar for vehicle
- `GET /api/vehicles/{id}/blocked-dates` - Retrieve blocked dates for maintenance
- `POST /api/availability/validate` - Validate rental period meets constraints
- `GET /api/config/rental-constraints` - Get minimum/maximum rental period rules

### Request Schemas

**Availability Check Request:**
```
POST Body:
{
  "vehicleIds": string[] (optional),
  "pickupDateTime": ISO8601 datetime,
  "returnDateTime": ISO8601 datetime,
  "locationId": string
}
```

**Period Validation Request:**
```
POST Body:
{
  "pickupDateTime": ISO8601 datetime,
  "returnDateTime": ISO8601 datetime,
  "vehicleType": string (optional)
}
```

### Response Schemas

**Availability Response:**
```
{
  "available": boolean,
  "availableVehicles": [
    {
      "vehicleId": string,
      "available": boolean,
      "nextAvailableDate": ISO8601 datetime (if not available)
    }
  ],
  "duration": {
    "days": integer,
    "hours": integer,
    "totalHours": integer
  }
}
```

**Calendar Response:**
```
{
  "vehicleId": string,
  "calendar": [
    {
      "date": ISO8601 date,
      "status": "available" | "booked" | "maintenance" | "buffer",
      "reason": string (optional)
    }
  ]
}
```

**Validation Response:**
```
{
  "valid": boolean,
  "errors": [
    {
      "code": string,
      "message": string
    }
  ],
  "constraints": {
    "minimumHours": integer,
    "maximumDays": integer,
    "bufferHours": integer
  }
}
```

### Business Logic

- Calculate rental duration in days, hours, and total hours
- Validate return date/time is after pickup date/time
- Enforce minimum rental period (e.g., 1 hour or 1 day)
- Enforce maximum rental period (e.g., 30 or 90 days)
- Apply buffer time between bookings for vehicle preparation
- Check real-time vehicle availability against existing bookings
- Identify blocked dates for maintenance or other reasons
- Handle timezone conversions for international bookings
- Calculate pricing based on rental duration
- Support flexible time intervals (15, 30, 60 minutes)

### Authentication Requirements

- Public access for availability checking (no authentication required)
- Authenticated access for viewing detailed availability calendars
- Rate limiting on availability check API to prevent abuse

## Database Specifications

### Schema Changes

**Bookings Table:**
```
CREATE TABLE bookings (
  id VARCHAR(50) PRIMARY KEY,
  vehicle_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  pickup_datetime DATETIME NOT NULL,
  return_datetime DATETIME NOT NULL,
  status ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  INDEX idx_vehicle_dates (vehicle_id, pickup_datetime, return_datetime),
  INDEX idx_status (status)
);
```

**Vehicle Maintenance Schedule Table:**
```
CREATE TABLE vehicle_maintenance_schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id VARCHAR(50) NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  maintenance_type VARCHAR(100),
  notes TEXT,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_vehicle_dates (vehicle_id, start_datetime, end_datetime)
);
```

**Rental Constraints Table:**
```
CREATE TABLE rental_constraints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_type VARCHAR(50),
  location_id VARCHAR(50),
  minimum_rental_hours INT NOT NULL DEFAULT 1,
  maximum_rental_days INT NOT NULL DEFAULT 90,
  buffer_hours INT NOT NULL DEFAULT 2,
  time_interval_minutes INT NOT NULL DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vehicle_type (vehicle_type),
  INDEX idx_location (location_id)
);
```

### Table Definitions

**bookings**: Stores all vehicle reservations with date/time ranges
- Tracks pickup and return datetime for availability checking
- Status field enables filtering active vs completed bookings
- Indexed on vehicle_id and dates for fast availability queries

**vehicle_maintenance_schedule**: Tracks planned maintenance periods
- Blocks vehicle availability during maintenance windows
- Supports different maintenance types
- Indexed for efficient date range queries

**rental_constraints**: Configurable rules for rental periods
- Defines minimum and maximum rental durations
- Specifies buffer time between bookings
- Can be customized by vehicle type or location

### Relationships

- vehicles → bookings (one-to-many): A vehicle can have multiple bookings
- vehicles → vehicle_maintenance_schedule (one-to-many): A vehicle can have multiple maintenance periods
- users → bookings (one-to-many): A user can have multiple bookings

### Indexes

- `idx_vehicle_dates` on bookings: Fast availability checking by vehicle and date range
- `idx_status` on bookings: Filter active bookings efficiently
- `idx_vehicle_dates` on vehicle_maintenance_schedule: Quick maintenance period lookups
- `idx_vehicle_type` on rental_constraints: Retrieve constraints by vehicle type
- `idx_location` on rental_constraints: Retrieve constraints by location

## Technology Stack

- Backend: .NET 8+ with C# and ASP.NET Core Web API
- Database: MySQL 8.0+ with InnoDB storage engine
- Frontend: Next.js 14+ with React 18+, TypeScript, and Tailwind CSS
- Date/Time Library: date-fns or Day.js for date manipulation
- Calendar Component: react-datepicker or custom calendar component

## Implementation Notes

### Performance Considerations

- Cache availability data with short TTL (1-2 minutes)
- Use database indexes for fast date range queries
- Implement efficient overlap detection for booking conflicts
- Optimize calendar queries to fetch only visible date range
- Use connection pooling for high-concurrency availability checks

### User Experience

- Provide instant feedback on date selection
- Show clear visual indicators for available/unavailable dates
- Display helpful error messages for invalid date ranges
- Support keyboard navigation in date pickers
- Implement mobile-optimized date/time selection
- Show loading states during availability checks
- Provide quick date selection shortcuts

### Accessibility

- Ensure date pickers are keyboard accessible
- Provide ARIA labels for calendar components
- Support screen reader announcements for date changes
- Maintain sufficient color contrast for date indicators
- Provide text alternatives for visual calendar elements

### Integration Points

- Connect to booking system for reservation creation
- Integrate with pricing engine for duration-based rates
- Link to vehicle availability service
- Connect to maintenance scheduling system
- Integrate with notification service for availability alerts

### Error Handling

- Validate date ranges on both client and server
- Handle past date selections gracefully
- Provide clear messages for unavailable periods
- Manage timezone conversion errors
- Handle network timeouts with retry mechanisms

### Security

- Validate all date inputs on backend
- Prevent booking manipulation through date tampering
- Implement rate limiting on availability checks
- Log suspicious booking patterns
- Sanitize date inputs to prevent injection attacks

### Testing Requirements

- Unit tests for date validation logic
- Integration tests for availability checking
- End-to-end tests for complete booking flow
- Performance tests for concurrent availability checks
- Timezone handling tests
- Edge case tests (leap years, DST transitions)
