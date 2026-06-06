# Feature: Trip Extension (Backend)

## Overview

Backend services for extending active rental duration during trips, including real-time availability checking, cost calculation, payment processing, and supplier notification.

## Sprint Category

sprint-01

## Feature ID

F-BM-009

## API Endpoints

### GET /api/trips/{tripId}/extension-options

Retrieve available extension options and constraints.

**Response**: 200 OK
```json
{
  "tripId": "TRP-2026-001234",
  "currentReturnTime": "2026-03-20T18:00:00Z",
  "maxExtensionHours": 48,
  "maxReturnTime": "2026-03-22T18:00:00Z",
  "gracePeriodMinutes": 30,
  "extensionAllowed": true,
  "hourlyRate": 15.00,
  "dailyRate": 75.00,
  "restrictions": []
}
```

### POST /api/trips/{tripId}/check-extension-availability

Check vehicle availability for extension period.

**Request Body:**
```json
{
  "newReturnTime": "2026-03-21T10:00:00Z"
}
```

**Response**: 200 OK
```json
{
  "available": true,
  "availableUntil": "2026-03-23T10:00:00Z",
  "nextBookingStart": null,
  "maxExtensionPossible": "2026-03-23T10:00:00Z",
  "message": "Vehicle available for requested extension"
}
```

### POST /api/trips/{tripId}/calculate-extension-cost

Calculate cost for trip extension.

**Request Body:**
```json
{
  "newReturnTime": "2026-03-21T10:00:00Z"
}
```

**Response**: 200 OK
```json
{
  "currentCost": 300.00,
  "extensionDuration": 16,
  "extensionRate": 15.00,
  "additionalCost": 240.00,
  "newTotalCost": 540.00,
  "breakdown": {
    "baseExtensionCost": 220.00,
    "taxes": 15.00,
    "fees": 5.00
  },
  "currency": "USD"
}
```

### PUT /api/trips/{tripId}/extend

Process trip extension.

**Request Body:**
```json
{
  "newReturnTime": "2026-03-21T10:00:00Z",
  "paymentMethodId": "PM-CARD-1234",
  "acceptTerms": true
}
```

**Response**: 200 OK
```json
{
  "tripId": "TRP-2026-001234",
  "extensionId": "EXT-2026-5678",
  "status": "extended",
  "newReturnTime": "2026-03-21T10:00:00Z",
  "additionalCost": 240.00,
  "paymentStatus": "processed",
  "confirmationSent": true,
  "supplierNotified": true,
  "message": "Trip successfully extended"
}
```

### GET /api/trips/{tripId}/grace-period-status

Check grace period status.

**Response**: 200 OK
```json
{
  "gracePeriodActive": true,
  "gracePeriodEnd": "2026-03-20T18:30:00Z",
  "minutesRemaining": 15,
  "lateFeesAccrued": 0.00,
  "canExtend": true
}
```

## Business Logic

### Extension Eligibility Validation
- Trip status must be "active"
- Current time before grace period expiration
- No immediate next booking on vehicle
- Valid payment method on file
- No outstanding disputes

### Availability Checking
```
1. Query vehicle calendar for conflicts
2. Check maintenance schedule
3. Verify location operating hours
4. Validate maximum rental duration not exceeded
5. Return availability status with alternatives
```

### Cost Calculation Algorithm
```
extensionHours = (newReturnTime - currentReturnTime) / 3600
if (extensionHours >= 24) {
  rate = dailyRate
  units = extensionHours / 24
} else {
  rate = hourlyRate
  units = extensionHours
}
baseExtensionCost = rate * units
taxes = baseExtensionCost * taxRate
fees = calculateFees()
additionalCost = baseExtensionCost + taxes + fees
```

### Grace Period Logic
- Grace period: 15-30 minutes after return time
- No fees during grace period
- Extension during grace period waives late fees
- Push notification sent when grace period starts
- Late fees apply after grace period expires

### Extension Processing Workflow
```
1. Validate extension request
2. Check user authorization
3. Verify trip is active
4. Lock vehicle calendar
5. Check availability
6. Calculate cost
7. Process payment
8. Update trip return time
9. Update vehicle calendar
10. Notify customer
11. Notify supplier
12. Log extension
13. Release locks
```

## Authentication & Authorization

- JWT Bearer token required
- User must be trip owner
- Trip must belong to authenticated user
- All actions logged with user ID

## Error Handling

**400 Bad Request**: Invalid request data
**401 Unauthorized**: Missing/invalid token
**403 Forbidden**: User not authorized
**402 Payment Required**: Payment failed
**409 Conflict**: Vehicle unavailable or trip state conflict
**422 Unprocessable Entity**: Business rule violation

## Technology Stack

- **Framework**: .NET 8+ with C#
- **API**: ASP.NET Core Web API
- **ORM**: Entity Framework Core
- **Database**: MySQL 8.0+
- **Real-time**: SignalR for live updates
- **Payment**: Stripe or PayPal SDK
- **Notifications**: Firebase Cloud Messaging

## Implementation Notes

### Performance
- Cache vehicle availability (30 second TTL)
- Use async/await for all I/O
- Implement connection pooling
- Optimize database queries with indexes

### Concurrency
- Lock trip record during extension
- Use optimistic locking with version numbers
- Handle race conditions gracefully
- Provide clear conflict error messages

### Monitoring
- Log all extension requests
- Track success/failure rates
- Monitor payment processing
- Alert on unusual patterns
- Track grace period usage
