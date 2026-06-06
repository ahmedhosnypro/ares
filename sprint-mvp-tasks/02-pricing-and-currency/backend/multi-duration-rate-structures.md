# Feature: Multi-Duration Rate Structures

## Overview

Backend pricing service supporting multiple rental duration rate structures (hourly, daily, weekly, bi-weekly, monthly) with automatic rate selection, volume discount calculation, and rate management APIs. Provides flexible pricing calculation engine that optimizes revenue across all booking patterns.

## Sprint Category

sprint-mvp (MVP - Must have for first release)

## Feature ID

Pricing-Management-1.1

## User Stories

### As a backend service
I want to calculate the optimal rate for any rental duration, so that customers are charged appropriately and revenue is maximized.

### As a pricing API
I want to support rate configuration and retrieval, so that administrators can manage pricing effectively.

### As a booking service
I want accurate price calculations, so that bookings are created with correct pricing.

## Backend Specifications

### API Endpoints

**GET `/api/v1/pricing/rates/:vehicleId`**
- Purpose: Get all rate structures for a vehicle
- Authentication: Optional (public pricing)
- Path Parameters:
  - `vehicleId` (guid, required): Vehicle ID
- Query Parameters:
  - `effectiveDate` (date, optional): Date for rate lookup (default: today)
- Response: Complete rate structure with all duration options

**POST `/api/v1/pricing/rates`**
- Purpose: Create or update vehicle rate structure
- Authentication: Required (JWT)
- Authorization: Supplier (own vehicles) or Admin (any vehicle)
- Request Body: RateConfiguration
- Response: Created/updated rate structure

**PUT `/api/v1/pricing/rates/:rateId`**
- Purpose: Update existing rate structure
- Authentication: Required (JWT)
- Authorization: Supplier (own vehicles) or Admin (any vehicle)
- Path Parameters:
  - `rateId` (guid, required): Rate ID
- Request Body: Partial rate updates
- Response: Updated rate structure

**DELETE `/api/v1/pricing/rates/:rateId`**
- Purpose: Deactivate rate structure
- Authentication: Required (JWT)
- Authorization: Supplier (own vehicles) or Admin (any vehicle)
- Path Parameters:
  - `rateId` (guid, required): Rate ID
- Response: Success confirmation

**POST `/api/v1/pricing/calculate-duration`**
- Purpose: Calculate total cost for specific duration
- Authentication: Optional
- Request Body:
  - `vehicleId` (guid, required)
  - `startDate` (datetime, required)
  - `endDate` (datetime, required)
  - `applyDiscounts` (boolean, optional): Apply volume discounts
- Response: Detailed calculation with rate type and total

**POST `/api/v1/pricing/rates/bulk-update`**
- Purpose: Update rates for multiple vehicles
- Authentication: Required (JWT)
- Authorization: Supplier or Admin
- Request Body:
  - `vehicleIds` (array<guid>, required)
  - `rateUpdates` (object, required)
  - `updateType` ("replace" | "multiply" | "add")
  - `effectiveDate` (date, required)
- Response: Update summary with success/failure counts

**GET `/api/v1/pricing/rates/history/:vehicleId`**
- Purpose: Get rate change history for vehicle
- Authentication: Required (JWT)
- Authorization: Supplier (own vehicles) or Admin
- Path Parameters:
  - `vehicleId` (guid, required): Vehicle ID
- Query Parameters:
  - `startDate` (date, optional): History start date
  - `endDate` (date, optional): History end date
  - `limit` (int, optional): Max records (default: 50)
- Response: Array of rate changes with timestamps and users

### Request Schemas

**RateConfiguration**:
```
{
  vehicleId: guid,
  supplierId: guid,
  rates: {
    hourly: decimal (optional),
    daily: decimal (required),
    weekly: decimal (optional),
    biWeekly: decimal (optional),
    monthly: decimal (optional)
  },
  minimumDuration: int (hours, default: 1),
  maximumDuration: int (days, default: 90),
  currency: string (default: "USD"),
  effectiveDate: date (default: today),
  expirationDate: date (optional)
}
```

### Response Schemas

**RateStructureResponse**: See Frontend section

**DurationCalculationResponse**:
```
{
  vehicleId: guid,
  startDate: datetime,
  endDate: datetime,
  duration: {
    totalHours: int,
    days: int,
    weeks: int,
    months: int
  },
  rateTypeUsed: "hourly" | "daily" | "weekly" | "biWeekly" | "monthly",
  ratePerUnit: decimal,
  units: decimal,
  baseSubtotal: decimal,
  volumeDiscount: {
    applicable: boolean,
    percentage: decimal,
    amount: decimal
  },
  total: decimal,
  currency: string,
  breakdown: string,
  savingsVsStandard: decimal
}
```

### Business Logic

**Rate Selection Algorithm**:
```csharp
public RateType SelectOptimalRate(TimeSpan duration, VehicleRates rates)
{
    var totalHours = duration.TotalHours;
    
    // Hourly for < 24 hours
    if (totalHours < 24 && rates.HourlyRate.HasValue)
        return RateType.Hourly;
    
    var days = Math.Ceiling(totalHours / 24);
    
    // Monthly for >= 30 days
    if (days >= 30 && rates.MonthlyRate.HasValue)
        return RateType.Monthly;
    
    // Bi-weekly for >= 14 days
    if (days >= 14 && rates.BiWeeklyRate.HasValue)
        return RateType.BiWeekly;
    
    // Weekly for >= 7 days
    if (days >= 7 && rates.WeeklyRate.HasValue)
        return RateType.Weekly;
    
    // Default to daily
    return RateType.Daily;
}
```

**Price Calculation**:
```csharp
public decimal CalculatePrice(DateTime start, DateTime end, VehicleRates rates)
{
    var duration = end - start;
    var rateType = SelectOptimalRate(duration, rates);
    
    decimal basePrice = rateType switch
    {
        RateType.Hourly => Math.Ceiling(duration.TotalHours) * rates.HourlyRate.Value,
        RateType.Daily => Math.Ceiling(duration.TotalDays) * rates.DailyRate,
        RateType.Weekly => Math.Ceiling(duration.TotalDays / 7) * rates.WeeklyRate.Value,
        RateType.BiWeekly => Math.Ceiling(duration.TotalDays / 14) * rates.BiWeeklyRate.Value,
        RateType.Monthly => Math.Ceiling(duration.TotalDays / 30) * rates.MonthlyRate.Value,
        _ => throw new InvalidOperationException("Invalid rate type")
    };
    
    // Apply volume discounts if using daily rate
    if (rateType == RateType.Daily)
    {
        var days = Math.Ceiling(duration.TotalDays);
        var discount = GetVolumeDiscount(days);
        basePrice *= (1 - discount);
    }
    
    return Math.Round(basePrice, 2);
}

private decimal GetVolumeDiscount(double days)
{
    if (days >= 28) return 0.20m;
    if (days >= 14) return 0.15m;
    if (days >= 7) return 0.10m;
    return 0m;
}
```

**Rate Validation**:
```csharp
public ValidationResult ValidateRates(VehicleRates rates)
{
    var errors = new List<string>();
    
    // Daily rate is required
    if (rates.DailyRate <= 0)
        errors.Add("Daily rate must be positive");
    
    // Weekly rate should be less than 7 daily rates
    if (rates.WeeklyRate.HasValue && rates.WeeklyRate >= rates.DailyRate * 7)
        errors.Add("Weekly rate should be less than 7 daily rates");
    
    // Monthly rate should be less than 30 daily rates
    if (rates.MonthlyRate.HasValue && rates.MonthlyRate >= rates.DailyRate * 30)
        errors.Add("Monthly rate should be less than 30 daily rates");
    
    // Hourly rate × 24 should be >= daily rate
    if (rates.HourlyRate.HasValue && rates.HourlyRate * 24 < rates.DailyRate)
        errors.Add("Hourly rate × 24 should be >= daily rate");
    
    // Duration constraints
    if (rates.MinimumDuration < 1)
        errors.Add("Minimum duration must be at least 1 hour");
    
    if (rates.MaximumDuration > 365)
        errors.Add("Maximum duration cannot exceed 365 days");
    
    return new ValidationResult(errors.Count == 0, errors);
}
```

**Bulk Update Processing**:
```csharp
public async Task<BulkUpdateResult> BulkUpdateRates(
    List<Guid> vehicleIds,
    RateUpdates updates,
    UpdateType updateType,
    Guid userId)
{
    var results = new BulkUpdateResult();
    
    using var transaction = await _dbContext.Database.BeginTransactionAsync();
    
    try
    {
        foreach (var vehicleId in vehicleIds)
        {
            var currentRates = await GetActiveRates(vehicleId);
            var newRates = ApplyUpdate(currentRates, updates, updateType);
            
            var validation = ValidateRates(newRates);
            if (!validation.IsValid)
            {
                results.Failures.Add(new UpdateFailure(vehicleId, validation.Errors));
                continue;
            }
            
            await UpdateRates(vehicleId, newRates, userId);
            results.SuccessCount++;
        }
        
        await transaction.CommitAsync();
        return results;
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
```

### Authentication Requirements

- Public access for rate retrieval
- Supplier role required to manage own vehicle rates
- Admin role required to manage any vehicle rates
- Admin role required for bulk updates
- All rate changes logged with user ID

### Error Handling

**Invalid Rate Configuration**:
- Return 400 Bad Request with validation errors
- Provide specific error messages for each validation failure
- Suggest corrective actions

**Vehicle Not Found**:
- Return 404 Not Found
- Include vehicle ID in error message

**Unauthorized Access**:
- Return 403 Forbidden
- Log unauthorized access attempts

**Database Errors**:
- Return 500 Internal Server Error
- Log detailed error for debugging
- Rollback transaction if in progress

## Technology Stack

- Backend: .NET 8+ with C#, ASP.NET Core Web API
- Database: MySQL 8.0+ with Entity Framework Core
- Caching: Redis for rate caching
- Background Jobs: Hangfire for rate expiration processing

## Implementation Notes

**Caching Strategy**:
- Cache active rates per vehicle (15-minute TTL)
- Invalidate cache on rate updates
- Use Redis for distributed caching
- Cache key format: `rates:vehicle:{vehicleId}`

**Rate Expiration**:
- Background job runs daily at midnight
- Deactivates expired rates
- Logs expiration events
- Sends notifications to suppliers

**Audit Trail**:
- Log all rate changes to RateHistory
- Include previous and new values
- Store user ID and timestamp
- Optional change reason field

**Performance Considerations**:
- Index optimization for fast rate lookups
- Batch rate calculations for search results
- Use read replicas for rate queries
- Minimize database round trips

**Testing Requirements**:
- Unit tests for rate selection algorithm
- Unit tests for price calculation
- Unit tests for rate validation
- Integration tests for API endpoints
- Property-based tests for calculation accuracy
- Load tests for search performance

