# Feature: Date-Based Seasonal Pricing

## Overview

Time-based rate variation system enabling custom rates for specific date ranges to capitalize on seasonal demand, holidays, events, and market conditions. Supports seasonal rates, event-based pricing, holiday premiums, weekday/weekend differentiation, and advance booking discounts to maximize revenue across all time periods.

## Sprint Category

sprint-mvp (MVP - Must have for first release)

## Feature ID

Pricing-Management-2.1

## User Stories

### As a supplier
I want to set higher rates during peak seasons, so that I can maximize revenue when demand is high.

### As a revenue manager
I want to configure event-based pricing, so that I can capture premium rates during conferences, concerts, and sports events.

### As a customer
I want to see transparent seasonal pricing, so that I understand why rates vary by date.

### As a platform administrator
I want to manage seasonal pricing rules, so that rates automatically adjust based on calendar dates.

## Frontend Specifications

### Pages

**Seasonal Pricing Page** (`/admin/pricing/seasonal`)
- Configure seasonal rate rules
- Set date ranges and multipliers
- Manage holiday pricing
- Event-based pricing configuration
- Weekday/weekend rate differentiation
- Advance booking discount rules

**Pricing Calendar Page** (`/admin/pricing/calendar`)
- Visual calendar showing rate variations
- Color-coded by price level
- Click date to edit pricing
- Drag to select date ranges
- Preview revenue impact
- Conflict resolution interface

**Event Pricing Page** (`/admin/pricing/events`)
- Upcoming events list
- Event impact analysis
- Configure event-based multipliers
- Event radius settings
- Historical event performance

### UI Components

**SeasonalRuleForm Component**
- Rule name input
- Date range picker (start and end dates)
- Seasonal multiplier slider (0.5x - 2.0x)
- Day of week selector (Mon-Sun checkboxes)
- Vehicle category filter
- Location filter
- Priority setting
- Save and preview buttons

**PricingCalendarView Component**
- Month/year navigation
- Color-coded dates by price level
- Hover tooltip showing multiplier
- Click to edit date pricing
- Drag selection for date ranges
- Legend showing price levels
- Conflict indicators

**EventPricingCard Component**
- Event name and details
- Event date and location
- Expected attendance
- Impact radius selector
- Price multiplier input
- Historical performance data
- Enable/disable toggle

**AdvanceBookingDiscountForm Component**
- Discount tiers configuration
- Days in advance thresholds
- Discount percentages
- Minimum booking duration
- Exclusion dates (holidays, events)
- Enable/disable toggle

**WeekdayWeekendRates Component**
- Weekday multiplier input
- Weekend multiplier input
- Friday/Sunday classification
- Preview rate comparison
- Apply to date range selector

### User Flows

**Seasonal Pricing Configuration Flow**:
1. Supplier navigates to seasonal pricing
2. Supplier clicks "Add Seasonal Rule"
3. Supplier names rule "Summer Peak Season"
4. Supplier selects date range: June 1 - August 31
5. Supplier sets multiplier: 1.30 (30% increase)
6. Supplier selects vehicle categories: All
7. Supplier sets priority: High
8. System validates no conflicts with higher priority rules
9. Supplier saves rule
10. System applies rule to pricing calendar
11. System recalculates affected vehicle prices
12. System displays confirmation with revenue impact

**Event-Based Pricing Flow**:
1. System detects upcoming concert via event API
2. System creates event pricing suggestion
3. Revenue manager reviews event details
4. Manager sees: "Taylor Swift Concert, 50,000 attendance, 5 miles from location"
5. System suggests 1.50x multiplier
6. Manager adjusts to 1.60x
7. Manager sets impact radius: 10 miles
8. Manager sets date range: Event date ± 1 day
9. Manager enables event pricing
10. System applies multiplier to affected vehicles
11. System monitors booking velocity
12. System provides post-event performance report

**Holiday Pricing Flow**:
1. Admin navigates to pricing calendar
2. Admin selects Thanksgiving week
3. System shows current rates
4. Admin applies "Holiday Premium" template
5. Template sets 1.40x multiplier for Nov 23-27
6. System previews rate changes
7. Admin confirms application
8. System updates pricing for holiday period
9. System sends notification to suppliers

### Data Requirements

**From Backend APIs**:
- GET `/api/pricing/seasonal-rules` - Get seasonal pricing rules
- POST `/api/pricing/seasonal-rules` - Create seasonal rule
- GET `/api/pricing/calendar` - Get pricing calendar data
- GET `/api/pricing/events` - Get upcoming events
- POST `/api/pricing/events/:id/configure` - Configure event pricing
- GET `/api/pricing/advance-booking-discounts` - Get discount rules

**Seasonal Data**:
- Rule ID, name, description
- Date range (start and end)
- Price multiplier
- Day of week filters
- Vehicle category filters
- Location filters
- Priority level
- Active status

**Event Data**:
- Event ID, name, type
- Event date and time
- Location and venue
- Expected attendance
- Impact radius
- Suggested multiplier
- Historical performance

## Backend Specifications

### API Endpoints

**GET `/api/v1/pricing/seasonal-rules`**
- Purpose: Get all seasonal pricing rules
- Authentication: Required (JWT)
- Authorization: Supplier (own rules) or Admin
- Query Parameters:
  - `supplierId` (guid, optional): Filter by supplier
  - `active` (boolean, optional): Filter by active status
  - `dateRange` (string, optional): Filter by date range
- Response: Array of seasonal rules

**POST `/api/v1/pricing/seasonal-rules`**
- Purpose: Create new seasonal pricing rule
- Authentication: Required (JWT)
- Authorization: Supplier or Admin
- Request Body: SeasonalRuleConfiguration
- Response: Created rule with validation

**PUT `/api/v1/pricing/seasonal-rules/:ruleId`**
- Purpose: Update seasonal pricing rule
- Authentication: Required (JWT)
- Authorization: Supplier (own rules) or Admin
- Path Parameters:
  - `ruleId` (guid, required): Rule ID
- Request Body: Partial rule updates
- Response: Updated rule

**DELETE `/api/v1/pricing/seasonal-rules/:ruleId`**
- Purpose: Deactivate seasonal pricing rule
- Authentication: Required (JWT)
- Authorization: Supplier (own rules) or Admin
- Path Parameters:
  - `ruleId` (guid, required): Rule ID
- Response: Success confirmation

**GET `/api/v1/pricing/calendar`**
- Purpose: Get pricing calendar with all active rules
- Authentication: Required (JWT)
- Query Parameters:
  - `supplierId` (guid, required)
  - `startDate` (date, required)
  - `endDate` (date, required)
  - `vehicleId` (guid, optional): Specific vehicle
- Response: Calendar data with multipliers per date

**GET `/api/v1/pricing/events/upcoming`**
- Purpose: Get upcoming events affecting pricing
- Authentication: Required (JWT)
- Query Parameters:
  - `locationId` (guid, required)
  - `radius` (decimal, optional): Miles (default: 10)
  - `days` (int, optional): Days ahead (default: 30)
- Response: Array of events with pricing suggestions

**POST `/api/v1/pricing/events/:eventId/configure`**
- Purpose: Configure pricing for specific event
- Authentication: Required (JWT)
- Authorization: Supplier or Admin
- Path Parameters:
  - `eventId` (guid, required): Event ID
- Request Body: EventPricingConfiguration
- Response: Created pricing rule

**POST `/api/v1/pricing/calculate-seasonal`**
- Purpose: Calculate price with seasonal adjustments
- Authentication: Optional
- Request Body:
  - `vehicleId` (guid, required)
  - `locationId` (guid, required)
  - `startDate` (datetime, required)
  - `endDate` (datetime, required)
- Response: Price with seasonal multipliers applied

### Request Schemas

**SeasonalRuleConfiguration**:
```
{
  ruleName: string,
  description: string,
  supplierId: guid,
  startDate: date,
  endDate: date,
  priceMultiplier: decimal (0.5 - 2.0),
  daysOfWeek: [string] (optional, e.g., ["Mon", "Tue", "Wed"]),
  vehicleCategories: [string] (optional),
  locationIds: [guid] (optional),
  priority: int (1-10, higher = more important),
  isRecurring: boolean,
  recurrencePattern: string (optional, e.g., "yearly")
}
```

**EventPricingConfiguration**:
```
{
  eventId: guid,
  priceMultiplier: decimal,
  impactRadius: decimal (miles),
  startDate: date (optional, defaults to event date),
  endDate: date (optional, defaults to event date),
  vehicleCategories: [string] (optional),
  enabled: boolean
}
```

### Response Schemas

**SeasonalRuleResponse**:
```
{
  ruleId: guid,
  ruleName: string,
  description: string,
  supplierId: guid,
  startDate: date,
  endDate: date,
  priceMultiplier: decimal,
  daysOfWeek: [string],
  vehicleCategories: [string],
  locationIds: [guid],
  priority: int,
  isActive: boolean,
  isRecurring: boolean,
  recurrencePattern: string,
  affectedVehicles: int,
  estimatedRevenueImpact: decimal,
  createdBy: string,
  createdAt: datetime
}
```

**PricingCalendarResponse**:
```
{
  startDate: date,
  endDate: date,
  dates: [
    {
      date: date,
      dayOfWeek: string,
      rules: [
        {
          ruleId: guid,
          ruleName: string,
          multiplier: decimal,
          priority: int
        }
      ],
      effectiveMultiplier: decimal,
      isHoliday: boolean,
      hasEvent: boolean,
      eventNames: [string]
    }
  ]
}
```

### Business Logic

**Seasonal Rule Application**:
```csharp
public async Task<decimal> ApplySeasonalRules(
    decimal baseRate,
    DateTime rentalDate,
    Guid vehicleId,
    Guid locationId)
{
    // Get all applicable rules for date
    var rules = await _dbContext.SeasonalPricingRules
        .Where(r => r.IsActive &&
                    r.StartDate <= rentalDate &&
                    r.EndDate >= rentalDate)
        .OrderByDescending(r => r.Priority)
        .ToListAsync();
    
    // Filter by vehicle and location
    rules = rules.Where(r => 
        IsApplicableToVehicle(r, vehicleId) &&
        IsApplicableToLocation(r, locationId) &&
        IsApplicableToDayOfWeek(r, rentalDate.DayOfWeek)
    ).ToList();
    
    // Apply highest priority rule
    if (rules.Any())
    {
        var topRule = rules.First();
        return Math.Round(baseRate * topRule.PriceMultiplier, 2);
    }
    
    return baseRate;
}
```

**Event Detection and Pricing**:
```csharp
public async Task<List<PricingEvent>> DetectUpcomingEvents(
    Guid locationId,
    int daysAhead = 30)
{
    var location = await _dbContext.Locations.FindAsync(locationId);
    
    // Query external event API
    var events = await _eventApiClient.GetEvents(
        latitude: location.Latitude,
        longitude: location.Longitude,
        radius: 10, // miles
        startDate: DateTime.UtcNow,
        endDate: DateTime.UtcNow.AddDays(daysAhead)
    );
    
    var pricingEvents = new List<PricingEvent>();
    
    foreach (var evt in events)
    {
        var suggestedMultiplier = CalculateEventMultiplier(
            evt.ExpectedAttendance,
            evt.DistanceFromLocation
        );
        
        pricingEvents.Add(new PricingEvent
        {
            EventId = evt.Id,
            EventName = evt.Name,
            EventDate = evt.Date,
            ExpectedAttendance = evt.ExpectedAttendance,
            Distance = evt.DistanceFromLocation,
            SuggestedMultiplier = suggestedMultiplier,
            HistoricalPerformance = await GetHistoricalEventPerformance(evt.Name)
        });
    }
    
    return pricingEvents;
}

private decimal CalculateEventMultiplier(int attendance, decimal distance)
{
    // Base multiplier on attendance
    decimal multiplier = attendance switch
    {
        > 50000 => 1.60m,  // Major event
        > 20000 => 1.40m,  // Large event
        > 10000 => 1.25m,  // Medium event
        > 5000 => 1.15m,   // Small event
        _ => 1.05m         // Minor event
    };
    
    // Adjust for distance
    if (distance > 10) multiplier *= 0.90m;  // Farther away
    else if (distance > 5) multiplier *= 0.95m;
    
    return Math.Round(multiplier, 2);
}
```

**Advance Booking Discount**:
```csharp
public decimal ApplyAdvanceBookingDiscount(
    decimal baseRate,
    DateTime bookingDate,
    DateTime rentalDate)
{
    var daysInAdvance = (rentalDate - bookingDate).Days;
    
    var discount = daysInAdvance switch
    {
        >= 60 => 0.20m,  // 20% off for 60+ days
        >= 30 => 0.15m,  // 15% off for 30-59 days
        >= 14 => 0.10m,  // 10% off for 14-29 days
        >= 7 => 0.05m,   // 5% off for 7-13 days
        _ => 0m          // No discount for < 7 days
    };
    
    return Math.Round(baseRate * (1 - discount), 2);
}
```

### Authentication Requirements

- Supplier role required to manage own seasonal rules
- Admin role required to manage any seasonal rules
- Public access for viewing seasonal pricing
- All rule changes logged with user attribution

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript
- External APIs: Event APIs (Ticketmaster, Eventbrite), Holiday APIs

## Implementation Notes

**Rule Priority System**:
- Higher priority rules override lower priority
- Same priority: Most specific rule wins
- Specificity order: Vehicle-specific > Category > Location > Global
- Log rule conflicts for review

**Calendar Performance**:
- Pre-calculate pricing calendar monthly
- Cache calendar data (24-hour TTL)
- Invalidate on rule changes
- Use background jobs for recalculation

**Event Integration**:
- Poll event APIs daily
- Store events in database
- Auto-create pricing suggestions
- Require manual approval for application
- Track event pricing performance

**Testing Requirements**:
- Test seasonal rule application
- Test rule priority resolution
- Test date range overlaps
- Test event multiplier calculation
- Test advance booking discounts
- Verify calendar generation
- Test recurring rules

## Related Features

- Multi-Duration Rate Structures: Base rate configuration
- Dynamic Pricing Engine: Real-time pricing optimization
- Location-Based Pricing: Geographic differentiation
- Promotional Pricing: Discount codes and campaigns

