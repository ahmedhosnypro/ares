# Feature: Dynamic Pricing Engine

## Overview

AI-powered real-time pricing optimization system that adjusts rental rates based on demand signals, external events, flight data, weather forecasts, historical patterns, competitor rates, and fleet utilization. Implements multiple pricing strategies including flat rate, seasonal pricing, demand-based pricing, event-based surge pricing, and last-minute discounts to maximize revenue while maintaining competitive market rates.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

F-PB-011

## User Stories

### As a platform operator
I want automated pricing optimization, so that I can maximize revenue without manual price adjustments.

### As a supplier
I want dynamic pricing based on demand, so that I can increase rates during high-demand periods and offer discounts during low-demand periods.

### As a customer
I want fair market-based pricing, so that I pay competitive rates based on current market conditions.

### As a revenue manager
I want pricing analytics and insights, so that I can understand pricing performance and optimize strategies.

## Backend Specifications

### API Endpoints

**POST `/api/v1/pricing/calculate-dynamic`**
- Purpose: Calculate dynamic price for vehicle and dates
- Authentication: Optional (public pricing)
- Request Body:
  - `vehicleId` (guid, required): Vehicle ID
  - `startDate` (datetime, required): Rental start
  - `endDate` (datetime, required): Rental end
  - `locationId` (guid, required): Pickup location
- Response: Dynamic price with strategy breakdown

**GET `/api/v1/pricing/strategies`**
- Purpose: Get active pricing strategies for supplier
- Authentication: Required (JWT)
- Authorization: Supplier or Admin role
- Query Parameters:
  - `supplierId` (guid, required): Supplier ID
- Response: Array of pricing strategies with configurations

**POST `/api/v1/pricing/strategies`**
- Purpose: Create or update pricing strategy
- Authentication: Required (JWT)
- Authorization: Supplier or Admin role
- Request Body: PricingStrategyConfiguration
- Response: Created/updated strategy

**GET `/api/v1/pricing/analytics`**
- Purpose: Get pricing performance analytics
- Authentication: Required (JWT)
- Authorization: Supplier or Admin role
- Query Parameters:
  - `supplierId` (guid, required)
  - `startDate` (date, required)
  - `endDate` (date, required)
- Response: Pricing analytics with revenue impact

**POST `/api/v1/pricing/competitor-sync`**
- Purpose: Sync competitor pricing data
- Authentication: Required (JWT)
- Authorization: Admin role
- Request Body:
  - `locationId` (guid, required)
  - `vehicleCategory` (string, required)
- Response: Competitor pricing data

### Request Schemas

**DynamicPriceRequest**:
```
{
  vehicleId: guid,
  startDate: datetime,
  endDate: datetime,
  locationId: guid,
  includeBreakdown: boolean
}
```

**PricingStrategyConfiguration**:
```
{
  supplierId: guid,
  strategyType: "flat" | "seasonal" | "demand" | "event" | "last_minute",
  baseRate: decimal,
  parameters: {
    seasonalMultipliers: {
      peak: decimal,
      standard: decimal,
      offPeak: decimal
    },
    demandSensitivity: decimal,
    targetUtilization: decimal,
    minPrice: decimal,
    maxPrice: decimal,
    lastMinuteThreshold: int (hours),
    lastMinuteDiscount: decimal
  },
  isActive: boolean
}
```

### Response Schemas

**DynamicPriceResponse**:
```
{
  basePrice: decimal,
  adjustedPrice: decimal,
  currency: string,
  strategy: string,
  factors: {
    demandMultiplier: decimal,
    seasonalMultiplier: decimal,
    eventMultiplier: decimal,
    competitorAdjustment: decimal,
    utilizationFactor: decimal
  },
  breakdown: {
    baseRate: decimal,
    demandAdjustment: decimal,
    seasonalAdjustment: decimal,
    eventAdjustment: decimal,
    finalPrice: decimal
  },
  priceRange: {
    min: decimal,
    max: decimal,
    average: decimal
  },
  competitorComparison: {
    ourPrice: decimal,
    avgCompetitorPrice: decimal,
    lowestCompetitorPrice: decimal,
    position: "lowest" | "competitive" | "premium"
  }
}
```

### Business Logic

**Pricing Input Collection**:
- **Demand Signals**: Query booking velocity (bookings per hour), search volume, competitor inventory levels
- **External Events**: Check event calendar APIs for concerts, conferences, sports events, holidays
- **Flight Data**: Query flight arrival volumes at nearby airports (if available)
- **Weather Forecasts**: Fetch weather data and predict impact on vehicle type demand
- **Historical Patterns**: Analyze historical booking data for seasonal trends and day-of-week patterns
- **Competitor Rates**: Scrape or API-fetch competitor pricing for similar vehicles
- **Utilization Rates**: Calculate current fleet utilization percentage

**Pricing Strategy Algorithms**:

**Flat Rate Strategy**:
```
Price = BaseRate × Duration
```

**Seasonal Strategy**:
```
Price = BaseRate × SeasonalMultiplier × Duration
Where SeasonalMultiplier:
  - Peak (summer, holidays): 1.2 - 1.5
  - Standard: 1.0
  - Off-Peak: 0.8 - 0.9
```

**Demand-Based Strategy**:
```
Price = BaseRate × (1 + (Utilization% - TargetUtilization%) × Sensitivity) × Duration
Where:
  - Utilization% = (Booked Vehicles / Total Fleet) × 100
  - TargetUtilization% = 70% (configurable)
  - Sensitivity = 0.5 - 2.0 (how aggressively to adjust)
Example:
  - 90% utilization, 70% target, 1.0 sensitivity: 1.2x multiplier
  - 50% utilization, 70% target, 1.0 sensitivity: 0.8x multiplier
```

**Event-Based Strategy**:
```
Price = BaseRate × EventMultiplier × Duration
Where EventMultiplier:
  - Major event within 5 miles: 1.5 - 2.0
  - Medium event within 10 miles: 1.2 - 1.4
  - No nearby events: 1.0
```

**Last-Minute Strategy**:
```
If BookingTime < PickupTime - LastMinuteThreshold:
  Price = BaseRate × (1 - LastMinuteDiscount) × Duration
Where:
  - LastMinuteThreshold = 24 hours (configurable)
  - LastMinuteDiscount = 10-30% (configurable)
```

**Combined Strategy**:
```
Price = BaseRate × SeasonalMultiplier × DemandMultiplier × EventMultiplier × Duration
Price = MAX(MinPrice, MIN(MaxPrice, Price))
```

**Price Optimization**:
- Run pricing calculations every 15 minutes
- Update vehicle prices in database
- Cache calculated prices for 15 minutes
- Invalidate cache on strategy changes
- Log pricing decisions for analytics

**Competitor Price Monitoring**:
- Scrape competitor websites daily
- Store competitor prices in database
- Calculate average competitor price
- Identify lowest competitor price
- Adjust pricing to maintain competitive position
- Alert if significantly underpriced or overpriced

**Machine Learning Integration** (Future Enhancement):
- Train ML model on historical booking data
- Features: date, time, location, vehicle type, price, weather, events
- Target: booking conversion rate
- Predict optimal price for maximum revenue
- A/B test ML prices vs rule-based prices
- Continuously retrain model with new data

### Authentication Requirements

- No authentication for price calculation (public)
- Supplier or Admin role required for strategy management
- Admin role required for competitor sync
- Supplier role required for pricing analytics

### Error Handling

**Data Source Failures**:
- Event API unavailable: Fall back to historical event data
- Weather API unavailable: Use historical weather patterns
- Competitor data unavailable: Use last known prices
- Flight data unavailable: Skip flight-based adjustments

**Calculation Errors**:
- Invalid parameters: Return base rate with warning
- Strategy conflict: Apply highest priority strategy
- Price out of bounds: Clamp to min/max limits

## Database Specifications

### Schema Changes

**New Tables**:
- `PricingStrategies` - Strategy configurations
- `DynamicPriceHistory` - Historical price calculations
- `CompetitorPrices` - Competitor pricing data
- `PricingEvents` - External events affecting pricing
- `PricingAnalytics` - Pricing performance metrics

### Table Definitions

**PricingStrategies Table**:
```sql
CREATE TABLE PricingStrategies (
  StrategyId CHAR(36) PRIMARY KEY,
  SupplierId CHAR(36) NOT NULL,
  VehicleId CHAR(36) NULL COMMENT 'NULL for supplier-wide',
  StrategyType ENUM('flat', 'seasonal', 'demand', 'event', 'last_minute', 'combined') NOT NULL,
  BaseRate DECIMAL(10,2) NOT NULL,
  Configuration JSON NOT NULL COMMENT 'Strategy-specific parameters',
  MinPrice DECIMAL(10,2) NOT NULL,
  MaxPrice DECIMAL(10,2) NOT NULL,
  Priority INT NOT NULL DEFAULT 0,
  IsActive BOOLEAN DEFAULT TRUE,
  EffectiveDate DATE NOT NULL,
  ExpirationDate DATE NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (SupplierId) REFERENCES Suppliers(SupplierId) ON DELETE CASCADE,
  FOREIGN KEY (VehicleId) REFERENCES Vehicles(VehicleId) ON DELETE CASCADE,
  
  INDEX idx_supplier_active (SupplierId, IsActive, Priority DESC),
  INDEX idx_vehicle_active (VehicleId, IsActive),
  INDEX idx_effective_dates (EffectiveDate, ExpirationDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**DynamicPriceHistory Table**:
```sql
CREATE TABLE DynamicPriceHistory (
  PriceHistoryId CHAR(36) PRIMARY KEY,
  VehicleId CHAR(36) NOT NULL,
  CalculatedAt DATETIME NOT NULL,
  BasePrice DECIMAL(10,2) NOT NULL,
  AdjustedPrice DECIMAL(10,2) NOT NULL,
  Currency CHAR(3) NOT NULL,
  StrategyUsed VARCHAR(50) NOT NULL,
  Factors JSON NOT NULL COMMENT 'Multipliers and adjustments',
  UtilizationRate DECIMAL(5,2) NOT NULL,
  CompetitorAvgPrice DECIMAL(10,2) NULL,
  EventsNearby INT DEFAULT 0,
  WeatherCondition VARCHAR(50) NULL,
  
  FOREIGN KEY (VehicleId) REFERENCES Vehicles(VehicleId) ON DELETE CASCADE,
  
  INDEX idx_vehicle_calculated (VehicleId, CalculatedAt DESC),
  INDEX idx_calculated_at (CalculatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**CompetitorPrices Table**:
```sql
CREATE TABLE CompetitorPrices (
  CompetitorPriceId CHAR(36) PRIMARY KEY,
  CompetitorName VARCHAR(100) NOT NULL,
  LocationId CHAR(36) NOT NULL,
  VehicleCategory VARCHAR(50) NOT NULL,
  Price DECIMAL(10,2) NOT NULL,
  Currency CHAR(3) NOT NULL,
  RentalDuration INT NOT NULL COMMENT 'Days',
  ScrapedAt DATETIME NOT NULL,
  SourceUrl VARCHAR(500) NULL,
  
  FOREIGN KEY (LocationId) REFERENCES Locations(LocationId) ON DELETE CASCADE,
  
  INDEX idx_location_category (LocationId, VehicleCategory, ScrapedAt DESC),
  INDEX idx_scraped_at (ScrapedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**PricingEvents Table**:
```sql
CREATE TABLE PricingEvents (
  EventId CHAR(36) PRIMARY KEY,
  EventName VARCHAR(255) NOT NULL,
  EventType VARCHAR(50) NOT NULL COMMENT 'concert, conference, sports, holiday',
  LocationId CHAR(36) NOT NULL,
  StartDate DATETIME NOT NULL,
  EndDate DATETIME NOT NULL,
  ExpectedAttendance INT NULL,
  ImpactRadius DECIMAL(5,2) NOT NULL COMMENT 'Miles',
  PriceMultiplier DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  Source VARCHAR(100) NULL COMMENT 'API or manual entry',
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (LocationId) REFERENCES Locations(LocationId) ON DELETE CASCADE,
  
  INDEX idx_location_dates (LocationId, StartDate, EndDate),
  INDEX idx_dates (StartDate, EndDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

- `PricingStrategies.SupplierId` → `Suppliers.SupplierId` (Many-to-One)
- `PricingStrategies.VehicleId` → `Vehicles.VehicleId` (Many-to-One)
- `DynamicPriceHistory.VehicleId` → `Vehicles.VehicleId` (Many-to-One)
- `CompetitorPrices.LocationId` → `Locations.LocationId` (Many-to-One)
- `PricingEvents.LocationId` → `Locations.LocationId` (Many-to-One)

### Indexes

- `idx_supplier_active` on `PricingStrategies(SupplierId, IsActive, Priority DESC)` - Strategy lookup
- `idx_vehicle_calculated` on `DynamicPriceHistory(VehicleId, CalculatedAt DESC)` - Price history
- `idx_location_category` on `CompetitorPrices(LocationId, VehicleCategory, ScrapedAt DESC)` - Competitor comparison
- `idx_location_dates` on `PricingEvents(LocationId, StartDate, EndDate)` - Event lookup

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+
- Machine Learning: ML.NET or Azure Machine Learning
- External APIs: Weather API, Event API, Flight API
- Background Jobs: Hangfire or Quartz.NET

## Implementation Notes

**Pricing Calculation Service**:
- Run as background job every 15 minutes
- Calculate prices for all active vehicles
- Store results in DynamicPriceHistory
- Update vehicle base prices
- Cache calculated prices in Redis

**Data Collection**:
- Integrate with weather API (OpenWeatherMap)
- Integrate with event API (Ticketmaster, Eventbrite)
- Integrate with flight API (FlightAware, FlightStats)
- Scrape competitor websites (respect robots.txt)
- Store raw data for analysis

**Strategy Selection**:
- Load active strategies for supplier/vehicle
- Apply strategies in priority order
- Combine multiple strategies if configured
- Clamp final price to min/max bounds
- Log strategy application for analytics

**Performance Optimization**:
- Cache pricing calculations for 15 minutes
- Use Redis for fast price lookups
- Batch process price calculations
- Optimize database queries with indexes
- Use read replicas for analytics

**Testing Requirements**:
- Test each pricing strategy independently
- Test combined strategy calculations
- Test price clamping to min/max bounds
- Test competitor price integration
- Test event-based pricing
- Test utilization-based pricing
- Verify pricing analytics accuracy

## Related Features

- F-PB-007: Transparent Pricing Breakdown (Price display)
- F-ADMIN-PRICE-001: Pricing Strategy Management (Strategy configuration)
- F-OPS-ANAL-001: Business Intelligence (Pricing analytics)
