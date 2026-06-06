# Feature: Trip Extension

## Overview

Enable customers to extend their active rental duration while the trip is in progress through the mobile app. The system provides real-time availability checking, instant cost calculation, immediate confirmation, and automatic supplier notification to allow customers to adapt to changing plans without incurring late fees.

## Sprint Category

sprint-01

## Feature ID

F-BM-009

## User Stories

### User Story 1: Extend Active Rental
As a customer with an active rental, I want to extend my rental duration from my mobile device, so that I can adapt to changing travel plans without worrying about late return fees.

### User Story 2: Real-Time Availability Check
As a customer requesting an extension, I want to know immediately if the vehicle is available for the extended period, so that I can make alternative arrangements if needed.

### User Story 3: Transparent Cost Calculation
As a customer, I want to see the additional cost for extending my rental before confirming, so that I can make an informed decision about the extension.

### User Story 4: Instant Confirmation
As a customer, I want to receive immediate confirmation of my extension, so that I have peace of mind and can continue my trip without concern.

### User Story 5: Grace Period Protection
As a customer, I want a reasonable grace period for late returns, so that minor delays don't result in excessive fees.

## Frontend Specifications

### Pages

**Active Trip Dashboard** (`/trips/active`)
- Display current trip status and details
- Show current return time prominently
- Provide "Extend Trip" button with easy access
- Display time remaining until return

**Trip Extension Page** (`/trips/[tripId]/extend`)
- Display current booking details
- Show current return date and time
- Provide new return time selector
- Display availability status
- Show cost calculation
- Confirmation screen

### UI Components

**ExtendTripButton Component**
- Prominent button on active trip dashboard
- Display "Extend Trip" with clock icon
- Show badge if extension deadline approaching
- Disabled state if extension not allowed

**ReturnTimeSelector Component**
- Time picker for new return time
- Increment options (1 hour, 2 hours, 4 hours, 1 day)
- Custom time selection with calendar
- Display maximum extension allowed
- Show availability indicator for selected time

**AvailabilityChecker Component**
- Real-time availability status indicator
- Loading state during availability check
- Success state (green checkmark) when available
- Warning state (yellow) when limited availability
- Error state (red X) when unavailable
- Alternative suggestions if unavailable

**CostCalculator Component**
- Display current booking cost
- Show extension period duration
- Calculate additional cost in real-time
- Display hourly/daily rate for extension
- Show total new cost
- Highlight cost difference
- Display payment method to be charged

**ExtensionSummary Component**
- Side-by-side comparison of current vs extended booking
- Original return time vs new return time
- Original cost vs new total cost
- Additional charges breakdown
- Payment confirmation
- Terms and conditions for extension

**GracePeriodIndicator Component**
- Display grace period information
- Show time remaining in grace period
- Warning when grace period expiring
- Countdown timer for grace period end

### User Flows

**Flow 1: Extend Trip During Active Rental**
1. Customer opens mobile app during active trip
2. Customer navigates to active trip dashboard
3. System displays current trip details with return time
4. Customer taps "Extend Trip" button
5. System displays trip extension page
6. Customer selects new return time (e.g., +4 hours)
7. System checks real-time vehicle availability
8. System calculates additional cost
9. System displays extension summary
10. Customer reviews new return time and cost
11. Customer confirms extension
12. System processes payment for additional cost
13. System updates booking with new return time
14. System sends confirmation notification
15. System notifies supplier of extension
16. Customer receives updated booking confirmation

**Flow 2: Extension Unavailable**
1. Customer initiates trip extension
2. Customer selects desired new return time
3. System checks availability
4. System determines vehicle not available (next booking exists)
5. System displays unavailability message
6. System suggests maximum possible extension
7. Customer can accept suggested extension or cancel
8. If accepted, proceed with available extension

**Flow 3: Grace Period Extension**
1. Customer's return time passes
2. System enters grace period (e.g., 30 minutes)
3. System sends push notification about grace period
4. Customer opens app and sees grace period warning
5. Customer initiates extension to avoid late fees
6. System processes extension immediately
7. Grace period charges waived if extension confirmed

### Data Requirements

**From Backend APIs:**
- Current trip details (booking ID, vehicle, return time, location)
- Vehicle availability for extension period
- Pricing rates for extension period
- Maximum extension allowed
- Grace period policy
- Payment method on file
- Supplier contact information

**State Management:**
- Current trip state
- Selected new return time
- Availability status
- Calculated extension cost
- Payment processing status
- Confirmation status
- Grace period status

## Backend Specifications

### API Endpoints

**GET /api/trips/{tripId}/extension-options**
- Purpose: Retrieve extension options and constraints for active trip
- Authentication: Required (JWT token)
- Response: Maximum extension, pricing, availability window

**POST /api/trips/{tripId}/check-extension-availability**
- Purpose: Check if vehicle available for requested extension period
- Authentication: Required
- Request Body: Requested new return time
- Response: Availability status, alternative options

**POST /api/trips/{tripId}/calculate-extension-cost**
- Purpose: Calculate additional cost for trip extension
- Authentication: Required
- Request Body: New return time
- Response: Additional cost, rate breakdown, total new cost

**PUT /api/trips/{tripId}/extend**
- Purpose: Confirm and process trip extension
- Authentication: Required
- Request Body: New return time, payment confirmation
- Response: Updated trip details, confirmation

**GET /api/trips/{tripId}/grace-period-status**
- Purpose: Check grace period status for late return
- Authentication: Required
- Response: Grace period active, time remaining, fees

### Request Schemas

**CheckExtensionAvailabilityRequest**
```
{
  "newReturnTime": "ISO 8601 datetime",
  "currentLocation": {
    "latitude": "number",
    "longitude": "number"
  }
}
```

**CalculateExtensionCostRequest**
```
{
  "newReturnTime": "ISO 8601 datetime"
}
```

**ExtendTripRequest**
```
{
  "newReturnTime": "ISO 8601 datetime",
  "paymentMethodId": "string",
  "acceptTerms": "boolean",
  "currentOdometer": "number (optional)"
}
```

### Response Schemas

**ExtensionOptionsResponse**
```
{
  "tripId": "string",
  "currentReturnTime": "ISO 8601 datetime",
  "maxExtensionHours": "number",
  "maxReturnTime": "ISO 8601 datetime",
  "gracePeriodMinutes": "number",
  "extensionAllowed": "boolean",
  "restrictions": ["array of restriction messages"]
}
```

**AvailabilityCheckResponse**
```
{
  "available": "boolean",
  "availableUntil": "ISO 8601 datetime (if limited)",
  "nextBookingStart": "ISO 8601 datetime (if exists)",
  "maxExtensionPossible": "ISO 8601 datetime",
  "message": "string"
}
```

**ExtensionCostResponse**
```
{
  "currentCost": "number",
  "extensionDuration": "number (hours)",
  "extensionRate": "number (per hour or per day)",
  "additionalCost": "number",
  "newTotalCost": "number",
  "breakdown": {
    "baseExtensionCost": "number",
    "taxes": "number",
    "fees": "number"
  },
  "currency": "string"
}
```

**ExtendedTripResponse**
```
{
  "tripId": "string",
  "extensionId": "string",
  "status": "extended",
  "newReturnTime": "ISO 8601 datetime",
  "additionalCost": "number",
  "paymentStatus": "processed",
  "confirmationSent": "boolean",
  "supplierNotified": "boolean",
  "message": "Trip successfully extended"
}
```

**GracePeriodStatusResponse**
```
{
  "gracePeriodActive": "boolean",
  "gracePeriodEnd": "ISO 8601 datetime",
  "minutesRemaining": "number",
  "lateFeesAccrued": "number",
  "canExtend": "boolean"
}
```

### Business Logic

**Extension Eligibility**
- Trip must be in "active" status
- Current time must be before or during grace period
- Vehicle must not have immediate next booking
- Customer must have valid payment method
- No outstanding issues or disputes on trip

**Availability Validation**
- Check vehicle calendar for next booking
- Verify vehicle not scheduled for maintenance
- Confirm location can accommodate extended return
- Check location operating hours for new return time
- Validate extension doesn't exceed maximum rental duration

**Cost Calculation**
- Determine extension duration in hours/days
- Apply current pricing rate for extension period
- Consider time-of-day pricing if applicable
- Add applicable taxes and fees
- Calculate total additional cost
- Determine payment amount

**Grace Period Logic**
- Grace period starts at original return time
- Typical grace period: 15-30 minutes
- No fees during grace period
- Extension during grace period waives late fees
- After grace period, late fees apply per hour/day

**Extension Processing**
- Validate extension request
- Lock vehicle calendar
- Process payment for additional cost
- Update trip return time
- Update vehicle availability
- Send confirmation to customer
- Notify supplier/location
- Log extension in trip history
- Release calendar lock

### Authentication Requirements

- User must be authenticated with valid JWT token
- User must be the primary renter of the trip
- Trip must belong to authenticated user
- Extension actions logged for audit trail

## Database Specifications

### Schema Changes

**trip_extensions table** (new)
- Tracks all trip extensions with before/after times
- Stores cost and payment information
- Links to original trip

**trips table** (modifications)
- Add `extension_count` column
- Add `total_extension_hours` column
- Add `grace_period_used` boolean column

### Table Definitions

**trip_extensions**
```
CREATE TABLE trip_extensions (
  extension_id VARCHAR(36) PRIMARY KEY,
  trip_id VARCHAR(36) NOT NULL,
  booking_id VARCHAR(36) NOT NULL,
  extended_by_user_id VARCHAR(36) NOT NULL,
  extended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  original_return_time DATETIME NOT NULL,
  new_return_time DATETIME NOT NULL,
  extension_hours DECIMAL(5,2) NOT NULL,
  
  extension_cost DECIMAL(10,2) NOT NULL,
  payment_status ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
  payment_transaction_id VARCHAR(100),
  
  availability_checked_at TIMESTAMP,
  supplier_notified BOOLEAN DEFAULT FALSE,
  supplier_notified_at TIMESTAMP,
  
  in_grace_period BOOLEAN DEFAULT FALSE,
  grace_period_fees_waived DECIMAL(10,2) DEFAULT 0.00,
  
  notes TEXT,
  
  FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
  FOREIGN KEY (extended_by_user_id) REFERENCES users(user_id),
  
  INDEX idx_trip_extensions (trip_id, extended_at DESC),
  INDEX idx_extended_at (extended_at),
  INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**trips table updates**
```
ALTER TABLE trips
ADD COLUMN extension_count INT DEFAULT 0,
ADD COLUMN total_extension_hours DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN grace_period_used BOOLEAN DEFAULT FALSE,
ADD INDEX idx_extension_count (extension_count);
```

### Relationships

**trip_extensions → trips**
- Many-to-one relationship
- Each extension belongs to one trip
- One trip can have multiple extensions
- Foreign key: `trip_id`
- Cascade delete when trip deleted

**trip_extensions → bookings**
- Many-to-one relationship
- Each extension belongs to one booking
- Foreign key: `booking_id`

**trip_extensions → users**
- Many-to-one relationship
- Each extension made by one user
- Foreign key: `extended_by_user_id`

### Indexes

**Trip Extensions Lookup**
```
CREATE INDEX idx_trip_extensions 
ON trip_extensions(trip_id, extended_at DESC);
```

**Payment Status Tracking**
```
CREATE INDEX idx_payment_status 
ON trip_extensions(payment_status, extended_at);
```

**Temporal Analysis**
```
CREATE INDEX idx_extended_at 
ON trip_extensions(extended_at);
```

## Technology Stack

- **Backend**: .NET 8+ with C#, ASP.NET Core Web API
- **Database**: MySQL 8.0+ with InnoDB storage engine
- **Frontend**: Next.js 14+ with React 18+, TypeScript (Mobile-optimized)
- **Real-time**: SignalR for live availability updates
- **Push Notifications**: Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNS)
- **Payment Processing**: Stripe or PayPal SDK

## Implementation Notes

### Mobile-First Design
- Optimize for one-handed mobile use
- Large, touch-friendly buttons
- Minimal steps to complete extension
- Quick access from active trip dashboard
- Support offline queuing with sync when online

### Real-Time Availability
- Check availability immediately when user selects new time
- Use WebSocket or polling for live updates
- Cache availability data for 30 seconds
- Show loading state during availability check
- Provide instant feedback

### Payment Processing
- Use saved payment method for speed
- Process payment immediately upon confirmation
- Support 3D Secure authentication if required
- Handle payment failures gracefully
- Provide retry option for failed payments

### Notification Strategy
- Send push notification when extension confirmed
- Send SMS confirmation with new return time
- Update calendar invite with new time
- Email confirmation with updated booking details
- Notify supplier via their preferred channel

### Grace Period Implementation
- Start grace period timer at original return time
- Send push notification when grace period starts
- Display countdown in app
- Allow extension during grace period
- Waive late fees if extended during grace period
- Apply late fees after grace period expires

### Error Handling
- Handle vehicle unavailability gracefully
- Provide alternative extension options
- Support partial extensions if full extension unavailable
- Clear error messages for payment failures
- Fallback to customer support contact

### Performance Optimization
- Cache vehicle availability data
- Preload extension options on trip dashboard
- Optimize API calls for mobile networks
- Support offline mode with sync
- Minimize data transfer for mobile users

### Security Considerations
- Validate user owns the trip
- Verify trip is actually active
- Prevent extension abuse (max extensions limit)
- Log all extension attempts
- Secure payment processing
- Rate limiting on extension requests
