# Feature: Location-Based Pricing

## Overview

Backend service for geographic price differentiation with location-specific multipliers, regional pricing groups, airport premiums, and competitive positioning. Provides APIs for location pricing configuration, regional management, and price calculation with location context.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

Pricing-Management-1.3

## User Stories

### As a pricing service
I want to apply location-specific multipliers, so that prices reflect local market conditions.

### As a regional pricing manager
I want to group locations into regions, so that I can manage pricing efficiently across similar markets.

### As a competitive intelligence system
I want to track competitor rates by location, so that pricing remains competitive in each market.

## Backend Specifications

### API Endpoints

**GET `/api/v1/locations/:locationId/pricing`**
- Purpose: Get location pricing configuration
- Authentication: Required (JWT)
- Authorization: Supplier (own locations) or Admin
- Path Parameters:
  - `locationId` (guid, required): Location ID
- Response: Complete location pricing config

**POST `/api/v1/locations/:locationId/pricing`**
- Purpose: Update location pricing configuration
- Authentication: Required (JWT)
- Authorization: Supplier (own locations) or Admin
- Path Parameters:
  - `locationId` (guid, required): Location ID
- Request Body: LocationPricingConfiguration
- Response: Updated configuration with validation

**GET `/api/v1/pricing/regions`**
- Purpose: Get all pricing regions
- Authentication: Required (JWT)
- Query Parameters:
  - `supplierId` (guid, optional): Filter by supplier
  - `includeLocations` (boolean, optional): Include location details
- Response: Array of pricing regions

**POST `/api/v1/pricing/regions`**
- Purpose: Create new pricing region
- Authentication: Required (JWT)
- Authorization: Supplier or Admin
- Request Body: PricingRegionConfiguration
- Response: Created region

**PUT `/api/v1/pricing/regions/:regionId`**
- Purpose: Update pricing region
- Authentication: Required (JWT)
- Authorization: Supplier (own regions) or Admin
- Path Parameters:
  - `regionId` (guid, required): Region ID
- Request Body: Partial region updates
- Response: Updated region

**POST `/api/v1/pricing/regions/:regionId/apply-multiplier`**
- Purpose: Apply multiplier to all locations in region
- Authentication: Required (JWT)
- Authorization: Supplier or Admin
- Path Parameters:
  - `regionId` (guid, required): Region ID
- Request Body:
  - `multiplier` (decimal, required)
  - `effectiveDate` (date, optional)
  - `reason` (string, optional)
- Response: Application results for all locations

**POST `/api/v1/pricing/calculate-with-location`**
- Purpose: Calculate price with location context
- Authentication: Optional
- Request Body:
  - `vehicleId` (guid, required)
  - `locationId` (guid, required)
  - `startDate` (datetime, required)
  - `endDate` (datetime, required)
- Response: Price with location multiplier applied

**GET `/api/v1/pricing/location-comparison`**
- Purpose: Compare pricing across locations
- Authentication: Required (JWT)
- Query Parameters:
  - `supplierId` (guid, required)
  - `vehicleCategory` (string, optional)
  - `includeCompetitors` (boolean, optional)
- Response: Location comparison matrix

### Request Schemas

**LocationPricingConfiguration**:
```
{
  locationId: guid,
  priceMultiplier: decimal (0.5 - 2.0),
  airportPremium: {
    enabled: boolean,
    percentage: decimal (0 - 1.0)
  },
  locationType: "airport" | "urban" | "suburban" | "rural",
  regionId: guid (optional),
  effectiveDate: date (default: today),
  reason: string (optional)
}
```

**PricingRegionConfiguration**:
```
{
  regionName: string,
  description: string,
  supplierId: guid,
  locationIds: [guid],
  priceMultiplier: decimal (0.5 - 2.0)
}
```

### Response Schemas

**LocationPricingResponse**:
```
{
  locationId: guid,
  locationName: string,
  address: string,
  locationType: "airport" | "urban" | "suburban" | "rural",
  priceMultiplier: decimal,
  airportPremium: {
    enabled: boolean,
    percentage: decimal
  },
  region: {
    regionId: guid,
    regionName: string,
    regionalMultiplier: decimal
  },
  effectiveMultiplier: decimal,
  appliedTo: {
    vehicleCount: int,
    sampleRates: [
      {
        category: string,
        baseDaily: decimal,
        locationDaily: decimal,
        difference: decimal
      }
    ]
  },
  competitorData: {
    avgMultiplier: decimal,
    position: "below_market" | "competitive" | "premium"
  },
  performance: {
    monthlyRevenue: decimal,
    utilizationRate: decimal,
    bookingCount: int,
    avgBookingValue: decimal
  }
}
```

**RegionApplicationResponse**:
```
{
  regionId: guid,
  regionName: string,
  multiplier: decimal,
  locationsUpdated: int,
  results: [
    {
      locationId: guid,
      locationName: string,
      previousMultiplier: decimal,
      newMultiplier: decimal,
      effectiveMultiplier: decimal,
      vehiclesAffected: int
    }
  ],
  executedAt: datetime,
  executedBy: string
}
```

### Business Logic

**Effective Multiplier Calculation**:
```csharp
public class LocationPricingService
{
    public async Task<decimal> CalculateEffectiveMultiplier(Guid locationId)
    {
        var location = await _dbContext.Locations
            .Include(l => l.Region)
            .FirstAsync(l => l.LocationId == locationId);
        
        decimal multiplier = location.PriceMultiplier;
        
        // Apply regional multiplier
        if (location.RegionId.HasValue && location.Region != null)
        {
            multiplier *= location.Region.PriceMultiplier;
        }
        
        // Apply airport premium
        if (location.IsAirport && location.AirportPremiumEnabled)
        {
            multiplier *= (1 + location.AirportPremiumPercentage);
        }
        
        // Clamp to reasonable range
        multiplier = Math.Clamp(multiplier, 0.5m, 3.0m);
        
        return Math.Round(multiplier, 2);
    }
    
    public async Task<decimal> CalculateLocationPrice(
        decimal baseRate,
        Guid locationId)
    {
        var multiplier = await CalculateEffectiveMultiplier(locationId);
        return Math.Round(baseRate * multiplier, 2);
    }
}
```

**Regional Pricing Management**:
```csharp
public class RegionalPricingService
{
    public async Task<PricingRegion> CreateRegion(
        PricingRegionConfiguration config,
        Guid userId)
    {
        // Validate locations belong to supplier
        var locations = await _dbContext.Locations
            .Where(l => config.LocationIds.Contains(l.LocationId))
            .ToListAsync();
        
        if (locations.Any(l => l.SupplierId != config.SupplierId))
            throw new UnauthorizedAccessException("Cannot add locations from other suppliers");
        
        var region = new PricingRegion
        {
            RegionId = Guid.NewGuid(),
            SupplierId = config.SupplierId,
            RegionName = config.RegionName,
            Description = config.Description,
            PriceMultiplier = config.PriceMultiplier,
            CreatedBy = userId
        };
        
        await _dbContext.PricingRegions.AddAsync(region);
        
        // Assign locations to region
        foreach (var location in locations)
        {
            location.RegionId = region.RegionId;
            await LogLocationChange(location.LocationId, "region_assigned", userId);
        }
        
        await _dbContext.SaveChangesAsync();
        await InvalidateLocationPricingCache(config.LocationIds);
        
        return region;
    }
    
    public async Task<RegionApplicationResult> ApplyRegionalMultiplier(
        Guid regionId,
        decimal multiplier,
        DateTime effectiveDate,
        Guid userId,
        string reason)
    {
        var region = await _dbContext.PricingRegions
            .Include(r => r.Locations)
            .FirstAsync(r => r.RegionId == regionId);
        
        region.PriceMultiplier = multiplier;
        region.UpdatedAt = DateTime.UtcNow;
        
        var results = new List<LocationUpdateResult>();
        
        foreach (var location in region.Locations)
        {
            var previousMultiplier = location.PriceMultiplier;
            var effectiveMultiplier = await CalculateEffectiveMultiplier(location.LocationId);
            
            await LogLocationChange(
                location.LocationId,
                "regional_multiplier_changed",
                userId,
                reason
            );
            
            results.Add(new LocationUpdateResult
            {
                LocationId = location.LocationId,
                LocationName = location.Name,
                PreviousMultiplier = previousMultiplier,
                NewMultiplier = multiplier,
                EffectiveMultiplier = effectiveMultiplier,
                VehiclesAffected = await CountVehiclesAtLocation(location.LocationId)
            });
        }
        
        await _dbContext.SaveChangesAsync();
        await InvalidateLocationPricingCache(region.Locations.Select(l => l.LocationId));
        
        return new RegionApplicationResult
        {
            RegionId = regionId,
            RegionName = region.RegionName,
            Multiplier = multiplier,
            LocationsUpdated = results.Count,
            Results = results,
            ExecutedAt = DateTime.UtcNow,
            ExecutedBy = await GetUserName(userId)
        };
    }
}
```

**Location Comparison**:
```csharp
public async Task<LocationComparisonResponse> CompareLocations(
    Guid supplierId,
    string vehicleCategory = null)
{
    var query = _dbContext.Locations
        .Where(l => l.SupplierId == supplierId)
        .Include(l => l.Region)
        .Include(l => l.Vehicles);
    
    var locations = await query.ToListAsync();
    
    var comparisons = new List<LocationComparison>();
    
    foreach (var location in locations)
    {
        var effectiveMultiplier = await CalculateEffectiveMultiplier(location.LocationId);
        
        var vehicles = vehicleCategory != null
            ? location.Vehicles.Where(v => v.Category == vehicleCategory)
            : location.Vehicles;
        
        var avgBaseRate = vehicles.Average(v => v.Rates.DailyRate);
        var avgLocationRate = avgBaseRate * effectiveMultiplier;
        
        comparisons.Add(new LocationComparison
        {
            LocationId = location.LocationId,
            LocationName = location.Name,
            LocationType = location.Type,
            Multiplier = location.PriceMultiplier,
            EffectiveMultiplier = effectiveMultiplier,
            AvgBaseRate = avgBaseRate,
            AvgLocationRate = avgLocationRate,
            VehicleCount = vehicles.Count(),
            MonthlyRevenue = await GetLocationRevenue(location.LocationId),
            UtilizationRate = await GetLocationUtilization(location.LocationId)
        });
    }
    
    return new LocationComparisonResponse
    {
        SupplierId = supplierId,
        VehicleCategory = vehicleCategory,
        Locations = comparisons,
        Summary = CalculateComparisonSummary(comparisons)
    };
}
```

### Authentication Requirements

- Supplier role for own location pricing management
- Admin role for any location pricing management
- Admin role for regional pricing management
- All changes logged with user ID

### Error Handling

**Invalid Multiplier Range**:
- Return 400 Bad Request
- Message: "Multiplier must be between 0.5 and 2.0"

**Location Not Found**:
- Return 404 Not Found
- Include location ID in error

**Unauthorized Location Access**:
- Return 403 Forbidden
- Log unauthorized attempt

**Region Assignment Conflict**:
- Return 409 Conflict if location already in different region
- Provide option to reassign

## Technology Stack

- Backend: .NET 8+ with C#, ASP.NET Core Web API
- Database: MySQL 8.0+ with Entity Framework Core
- Caching: Redis for location pricing cache

## Implementation Notes

**Caching Strategy**:
- Cache effective multipliers per location
- 30-minute TTL (longer than vehicle rates)
- Invalidate on location or region updates
- Cache key: `location:pricing:{locationId}`

**Performance Optimization**:
- Batch load location multipliers for search
- Use compiled queries for frequent operations
- Optimize regional queries with indexes
- Cache regional assignments

**Monitoring**:
- Track location pricing performance
- Alert on significant rate deviations
- Monitor competitor rate changes
- Track regional pricing effectiveness

**Testing Requirements**:
- Unit tests for multiplier calculation
- Unit tests for regional pricing
- Integration tests for all endpoints
- Property-based tests for price calculation
- Load tests for location comparison queries

