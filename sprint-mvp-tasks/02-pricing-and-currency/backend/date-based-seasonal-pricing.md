# Feature: Date-Based Seasonal Pricing

## Overview

Backend service for time-based rate variations with seasonal rules, event-based pricing, holiday premiums, and advance booking discounts. Provides rule engine for applying date-based multipliers, conflict resolution, and pricing calendar generation.

## Sprint Category

sprint-mvp (MVP - Must have for first release)

## Feature ID

Pricing-Management-2.1

## User Stories

### As a pricing engine
I want to apply seasonal rules to base rates, so that prices automatically adjust based on calendar dates.

### As a rule evaluation system
I want to resolve conflicts between overlapping rules, so that the correct price is always calculated.

### As an event monitoring system
I want to detect upcoming events and suggest pricing adjustments, so that revenue opportunities are not missed.

## Backend Specifications

### API Endpoints

**GET `/api/v1/pricing/seasonal-rules`**
- Purpose: Get all seasonal pricing rules
- Authentication: Required (JWT)
- Authorization: Supplier (own rules) or Admin
- Query Parameters:
  - `supplierId` (guid, optional)
  - `active` (boolean, optional)
  - `startDate` (date, optional): Filter rules affecting this date
  - `endDate` (date, optional)
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
  - `ruleId` (guid, required)
- Request Body: Partial rule updates
- Response: Updated rule

**DELETE `/api/v1/pricing/seasonal-rules/:ruleId`**
- Purpose: Deactivate seasonal pricing rule
- Authentication: Required (JWT)
- Authorization: Supplier (own rules) or Admin
- Path Parameters:
  - `ruleId` (guid, required)
- Response: Success confirmation

**GET `/api/v1/pricing/calendar`**
- Purpose: Get pricing calendar with effective multipliers
- Authentication: Required (JWT)
- Query Parameters:
  - `supplierId` (guid, required)
  - `startDate` (date, required)
  - `endDate` (date, required)
  - `vehicleId` (guid, optional)
  - `locationId` (guid, optional)
- Response: Calendar with daily multipliers

**POST `/api/v1/pricing/calendar/generate`**
- Purpose: Regenerate pricing calendar
- Authentication: Required (JWT)
- Authorization: Admin
- Request Body:
  - `supplierId` (guid, required)
  - `startDate` (date, required)
  - `endDate` (date, required)
- Response: Generation status

**GET `/api/v1/pricing/events/upcoming`**
- Purpose: Get upcoming events with pricing suggestions
- Authentication: Required (JWT)
- Query Parameters:
  - `locationId` (guid, required)
  - `radius` (decimal, optional): Miles (default: 10)
  - `days` (int, optional): Days ahead (default: 30)
- Response: Array of events with pricing data

**POST `/api/v1/pricing/events/:eventId/configure`**
- Purpose: Configure pricing for specific event
- Authentication: Required (JWT)
- Authorization: Supplier or Admin
- Path Parameters:
  - `eventId` (guid, required)
- Request Body: EventPricingConfiguration
- Response: Created seasonal rule for event

**POST `/api/v1/pricing/calculate-seasonal`**
- Purpose: Calculate price with seasonal adjustments
- Authentication: Optional
- Request Body:
  - `vehicleId` (guid, required)
  - `locationId` (guid, required)
  - `startDate` (datetime, required)
  - `endDate` (datetime, required)
  - `bookingDate` (datetime, optional): For advance booking discount
- Response: Price with seasonal multipliers and breakdown

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
  daysOfWeek: [string] (optional, ["Mon", "Tue", ...]),
  vehicleCategories: [string] (optional),
  locationIds: [guid] (optional),
  priority: int (1-10),
  isRecurring: boolean (default: false),
  recurrencePattern: "yearly" | "monthly" | "weekly" (optional)
}
```

**EventPricingConfiguration**:
```
{
  eventId: guid,
  priceMultiplier: decimal,
  impactRadius: decimal (miles),
  startDate: date (optional),
  endDate: date (optional),
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
  conflicts: [
    {
      conflictingRuleId: guid,
      conflictingRuleName: string,
      resolution: string
    }
  ],
  affectedVehicles: int,
  estimatedRevenueImpact: decimal,
  createdBy: string,
  createdAt: datetime,
  updatedAt: datetime
}
```

**PricingCalendarResponse**:
```
{
  supplierId: guid,
  startDate: date,
  endDate: date,
  vehicleId: guid (optional),
  locationId: guid (optional),
  calendar: [
    {
      date: date,
      dayOfWeek: string,
      rules: [
        {
          ruleId: guid,
          ruleName: string,
          multiplier: decimal,
          priority: int,
          source: "seasonal" | "event" | "holiday"
        }
      ],
      effectiveMultiplier: decimal,
      baseRate: decimal (if vehicleId provided),
      adjustedRate: decimal (if vehicleId provided),
      isHoliday: boolean,
      holidayName: string,
      events: [
        {
          eventName: string,
          distance: decimal
        }
      ]
    }
  ],
  summary: {
    avgMultiplier: decimal,
    peakDays: int,
    standardDays: int,
    discountDays: int
  }
}
```

### Business Logic

**Rule Evaluation Engine**:
```csharp
public class SeasonalPricingEngine
{
    public async Task<decimal> CalculateSeasonalPrice(
        decimal baseRate,
        DateTime rentalDate,
        Guid vehicleId,
        Guid locationId)
    {
        // Get all applicable rules
        var rules = await GetApplicableRules(rentalDate, vehicleId, locationId);
        
        if (!rules.Any())
            return baseRate;
        
        // Sort by priority (highest first)
        rules = rules.OrderByDescending(r => r.Priority).ToList();
        
        // Apply highest priority rule
        var topRule = rules.First();
        var adjustedRate = baseRate * topRule.PriceMultiplier;
        
        // Log rule application
        await LogRuleApplication(topRule.RuleId, vehicleId, rentalDate, adjustedRate);
        
        return Math.Round(adjustedRate, 2);
    }
    
    private async Task<List<SeasonalPricingRule>> GetApplicableRules(
        DateTime date,
        Guid vehicleId,
        Guid locationId)
    {
        var vehicle = await _dbContext.Vehicles.FindAsync(vehicleId);
        var dayOfWeek = date.DayOfWeek.ToString().Substring(0, 3);
        
        return await _dbContext.SeasonalPricingRules
            .Where(r => r.IsActive &&
                        r.StartDate <= date &&
                        r.EndDate >= date &&
                        (r.VehicleCategories == null || 
                         r.VehicleCategories.Contains(vehicle.Category)) &&
                        (r.LocationIds == null || 
                         r.LocationIds.Contains(locationId)) &&
                        (r.DaysOfWeek == null || 
                         r.DaysOfWeek.Contains(dayOfWeek)))
            .ToListAsync();
    }
}
```

**Event-Based Pricing**:
```csharp
public class EventPricingService
{
    public async Task<List<PricingEvent>> GetUpcomingEvents(
        Guid locationId,
        decimal radius = 10,
        int daysAhead = 30)
    {
        var location = await _dbContext.Locations.FindAsync(locationId);
        
        // Query event API
        var events = await _eventApiClient.SearchEvents(
            latitude: location.Latitude,
            longitude: location.Longitude,
            radius: radius,
            startDate: DateTime.UtcNow,
            endDate: DateTime.UtcNow.AddDays(daysAhead)
        );
        
        var pricingEvents = new List<PricingEvent>();
        
        foreach (var evt in events)
        {
            var distance = CalculateDistance(
                location.Latitude,
                location.Longitude,
                evt.Latitude,
                evt.Longitude
            );
            
            var suggestedMultiplier = CalculateEventMultiplier(
                evt.ExpectedAttendance,
                distance
            );
            
            // Check if rule already exists
            var existingRule = await _dbContext.SeasonalPricingRules
                .FirstOrDefaultAsync(r => r.EventId == evt.Id);
            
            pricingEvents.Add(new PricingEvent
            {
                EventId = evt.Id,
                EventName = evt.Name,
                EventType = evt.Type,
                EventDate = evt.Date,
                Venue = evt.Venue,
                ExpectedAttendance = evt.ExpectedAttendance,
                Distance = distance,
                SuggestedMultiplier = suggestedMultiplier,
                ExistingRule = existingRule,
                HistoricalData = await GetHistoricalEventData(evt.Name, location.LocationId)
            });
        }
        
        return pricingEvents;
    }
    
    public async Task<SeasonalPricingRule> ConfigureEventPricing(
        EventPricingConfiguration config,
        Guid userId)
    {
        var evt = await _eventApiClient.GetEvent(config.EventId);
        
        var rule = new SeasonalPricingRule
        {
            RuleId = Guid.NewGuid(),
            RuleName = $"Event: {evt.Name}",
            Description = $"Pricing for {evt.Name} at {evt.Venue}",
            SupplierId = config.SupplierId,
            StartDate = config.StartDate ?? evt.Date.AddDays(-1),
            EndDate = config.EndDate ?? evt.Date.AddDays(1),
            PriceMultiplier = config.PriceMultiplier,
            VehicleCategories = config.VehicleCategories,
            Priority = 8, // High priority for events
            EventId = config.EventId,
            IsActive = config.Enabled,
            CreatedBy = userId
        };
        
        // Find locations within radius
        var affectedLocations = await FindLocationsWithinRadius(
            evt.Latitude,
            evt.Longitude,
            config.ImpactRadius
        );
        
        rule.LocationIds = affectedLocations.Select(l => l.LocationId).ToList();
        
        await _dbContext.SeasonalPricingRules.AddAsync(rule);
        await _dbContext.SaveChangesAsync();
        
        return rule;
    }
}
```

**Pricing Calendar Generation**:
```csharp
public async Task<PricingCalendar> GenerateCalendar(
    Guid supplierId,
    DateTime startDate,
    DateTime endDate,
    Guid? vehicleId = null,
    Guid? locationId = null)
{
    var calendar = new PricingCalendar
    {
        SupplierId = supplierId,
        StartDate = startDate,
        EndDate = endDate,
        Dates = new List<CalendarDate>()
    };
    
    for (var date = startDate; date <= endDate; date = date.AddDays(1))
    {
        var rules = await GetApplicableRules(date, vehicleId, locationId);
        var effectiveMultiplier = CalculateEffectiveMultiplier(rules);
        
        var calendarDate = new CalendarDate
        {
            Date = date,
            DayOfWeek = date.DayOfWeek.ToString(),
            Rules = rules.Select(r => new AppliedRule
            {
                RuleId = r.RuleId,
                RuleName = r.RuleName,
                Multiplier = r.PriceMultiplier,
                Priority = r.Priority,
                Source = DetermineRuleSource(r)
            }).ToList(),
            EffectiveMultiplier = effectiveMultiplier,
            IsHoliday = await IsHoliday(date),
            HolidayName = await GetHolidayName(date),
            Events = await GetEventsForDate(date, locationId)
        };
        
        // Add rate calculations if vehicle specified
        if (vehicleId.HasValue)
        {
            var baseRate = await GetVehicleBaseRate(vehicleId.Value);
            calendarDate.BaseRate = baseRate;
            calendarDate.AdjustedRate = baseRate * effectiveMultiplier;
        }
        
        calendar.Dates.Add(calendarDate);
    }
    
    calendar.Summary = CalculateCalendarSummary(calendar.Dates);
    
    return calendar;
}

private decimal CalculateEffectiveMultiplier(List<SeasonalPricingRule> rules)
{
    if (!rules.Any())
        return 1.0m;
    
    // Apply highest priority rule
    var topRule = rules.OrderByDescending(r => r.Priority).First();
    return topRule.PriceMultiplier;
}
```

**Advance Booking Discount Service**:
```csharp
public class AdvanceBookingDiscountService
{
    public async Task<decimal> CalculateAdvanceBookingDiscount(
        decimal baseRate,
        DateTime bookingDate,
        DateTime rentalDate,
        Guid supplierId)
    {
        var daysInAdvance = (rentalDate.Date - bookingDate.Date).Days;
        
        // Get supplier's advance booking discount configuration
        var config = await _dbContext.AdvanceBookingDiscounts
            .Where(d => d.SupplierId == supplierId && d.IsActive)
            .OrderBy(d => d.DaysInAdvance)
            .ToListAsync();
        
        if (!config.Any())
            return baseRate; // No discounts configured
        
        // Find applicable discount tier
        var applicableDiscount = config
            .Where(d => daysInAdvance >= d.DaysInAdvance)
            .OrderByDescending(d => d.DaysInAdvance)
            .FirstOrDefault();
        
        if (applicableDiscount == null)
            return baseRate;
        
        var discountAmount = baseRate * applicableDiscount.DiscountPercentage;
        var discountedRate = baseRate - discountAmount;
        
        return Math.Round(discountedRate, 2);
    }
}
```

**Holiday Detection**:
```csharp
public class HolidayService
{
    private readonly Dictionary<DateTime, string> _holidays = new()
    {
        { new DateTime(2026, 1, 1), "New Year's Day" },
        { new DateTime(2026, 7, 4), "Independence Day" },
        { new DateTime(2026, 11, 26), "Thanksgiving" },
        { new DateTime(2026, 12, 25), "Christmas" }
        // ... more holidays
    };
    
    public async Task<bool> IsHoliday(DateTime date)
    {
        // Check static holidays
        if (_holidays.ContainsKey(date.Date))
            return true;
        
        // Check database for custom holidays
        return await _dbContext.Holidays
            .AnyAsync(h => h.Date == date.Date && h.IsActive);
    }
    
    public async Task<string> GetHolidayName(DateTime date)
    {
        if (_holidays.TryGetValue(date.Date, out var name))
            return name;
        
        var holiday = await _dbContext.Holidays
            .FirstOrDefaultAsync(h => h.Date == date.Date && h.IsActive);
        
        return holiday?.Name;
    }
}
```

### Authentication Requirements

- Supplier role for own seasonal rule management
- Admin role for any seasonal rule management
- Admin role for calendar generation
- Public access for seasonal price calculation
- All changes logged with user attribution

### Error Handling

**Rule Conflict Detection**:
- Detect overlapping rules with same priority
- Log conflicts for manual resolution
- Apply most specific rule by default
- Notify administrators of conflicts

**Invalid Date Ranges**:
- Return 400 Bad Request
- Message: "End date must be after start date"
- Validate date ranges on creation

**Event API Failures**:
- Log error and continue
- Use cached event data if available
- Return empty event list if no data
- Alert administrators of API issues

**Calendar Generation Failures**:
- Return partial calendar if possible
- Log generation errors
- Retry failed date calculations
- Provide error summary

## Technology Stack

- Backend: .NET 8+ with C#, ASP.NET Core Web API
- Database: MySQL 8.0+ with Entity Framework Core
- External APIs: Event APIs, Holiday APIs
- Background Jobs: Hangfire for calendar generation
- Caching: Redis for calendar caching

## Implementation Notes

**Background Jobs**:
- Daily job: Fetch upcoming events
- Daily job: Generate pricing calendars
- Weekly job: Analyze seasonal rule performance
- Monthly job: Archive old calendar data

**Performance Optimization**:
- Cache pricing calendars (24-hour TTL)
- Pre-calculate common date ranges
- Use indexes for date range queries
- Batch process rule evaluations

**Rule Conflict Resolution**:
- Priority-based resolution (highest wins)
- Specificity-based resolution (most specific wins)
- Log all conflicts for review
- Provide conflict resolution UI

**Testing Requirements**:
- Unit tests for rule evaluation
- Unit tests for conflict resolution
- Unit tests for event multiplier calculation
- Integration tests for all endpoints
- Property-based tests for date range handling
- Load tests for calendar generation

