# Feature: Promotional Pricing and Discounts - Backend

## Overview

Backend implementation for marketing-driven price reduction system supporting discount codes, percentage/fixed discounts, usage limits, customer segment targeting, and promotional campaign management. Provides robust validation, usage tracking, analytics, and fraud prevention capabilities.

## Sprint Category

sprint-01 (First Sprint - High priority features)

## Feature ID

Pricing-Management-2.2

## API Endpoints

### GET `/api/v1/promotions/discounts`

List all discount codes with filtering and pagination.

**Authentication**: Required (JWT)
**Authorization**: Supplier or Admin role

**Query Parameters**:
- `status` (string, optional): Filter by status ("active" | "expired" | "all")
- `supplierId` (guid, optional): Filter by supplier
- `page` (int, optional, default: 1): Page number
- `pageSize` (int, optional, default: 20): Results per page

**Response** (200 OK):
```json
{
  "data": [
    {
      "discountId": "123e4567-e89b-12d3-a456-426614174000",
      "code": "SUMMER2024",
      "description": "Summer promotion - 20% off all rentals",
      "discountType": "percentage",
      "discountValue": 20.00,
      "validFrom": "2024-06-01",
      "validTo": "2024-08-31",
      "usageLimitTotal": 500,
      "usageLimitPerCustomer": 1,
      "currentUsageCount": 247,
      "remainingUses": 253,
      "isActive": true,
      "createdAt": "2024-05-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 45,
    "totalPages": 3
  }
}
```

### POST `/api/v1/promotions/discounts`

Create new discount code.

**Authentication**: Required (JWT)
**Authorization**: Supplier or Admin role

**Request Body**:
```json
{
  "code": "SUMMER2024",
  "description": "Summer promotion - 20% off all rentals",
  "discountType": "percentage",
  "discountValue": 20.00,
  "validFrom": "2024-06-01",
  "validTo": "2024-08-31",
  "usageLimitTotal": 500,
  "usageLimitPerCustomer": 1,
  "customerSegments": ["all"],
  "vehicleCategories": [],
  "minimumDuration": 72,
  "minimumValue": 200.00,
  "allowStacking": false,
  "isAutomatic": false,
  "supplierId": "123e4567-e89b-12d3-a456-426614174001"
}
```

**Response** (201 Created):
```json
{
  "discountId": "123e4567-e89b-12d3-a456-426614174000",
  "code": "SUMMER2024",
  "message": "Discount code created successfully"
}
```

**Error Responses**:
- 400: Invalid request (duplicate code, invalid dates, invalid values)
- 401: Unauthorized
- 403: Forbidden (insufficient permissions)

### PUT `/api/v1/promotions/discounts/:discountId`

Update existing discount code.

**Authentication**: Required (JWT)
**Authorization**: Supplier (own codes) or Admin role

**Path Parameters**:
- `discountId` (guid, required): Discount ID

**Request Body**:
```json
{
  "description": "Updated description",
  "validTo": "2024-09-30",
  "usageLimitTotal": 1000,
  "isActive": true
}
```

**Response** (200 OK):
```json
{
  "discountId": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Discount code updated successfully"
}
```

### DELETE `/api/v1/promotions/discounts/:discountId`

Delete or deactivate discount code.

**Authentication**: Required (JWT)
**Authorization**: Supplier (own codes) or Admin role

**Path Parameters**:
- `discountId` (guid, required): Discount ID

**Query Parameters**:
- `permanent` (boolean, optional, default: false): Permanently delete vs deactivate

**Response** (200 OK):
```json
{
  "message": "Discount code deactivated successfully"
}
```

### POST `/api/v1/promotions/validate`

Validate discount code for booking.

**Authentication**: Optional (public endpoint)

**Request Body**:
```json
{
  "code": "SUMMER2024",
  "vehicleId": "123e4567-e89b-12d3-a456-426614174002",
  "customerId": "123e4567-e89b-12d3-a456-426614174003",
  "startDate": "2024-07-15T10:00:00Z",
  "endDate": "2024-07-20T10:00:00Z",
  "subtotal": 500.00
}
```

**Response** (200 OK - Valid):
```json
{
  "isValid": true,
  "discountId": "123e4567-e89b-12d3-a456-426614174000",
  "code": "SUMMER2024",
  "discountType": "percentage",
  "discountValue": 20.00,
  "discountAmount": 100.00,
  "finalPrice": 400.00,
  "savingsPercentage": 20.00,
  "errors": []
}
```

**Response** (200 OK - Invalid):
```json
{
  "isValid": false,
  "errors": [
    {
      "code": "USAGE_LIMIT_EXCEEDED",
      "message": "This discount code has reached its usage limit"
    }
  ]
}
```

### POST `/api/v1/promotions/apply`

Apply discount to booking.

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "bookingId": "123e4567-e89b-12d3-a456-426614174004",
  "code": "SUMMER2024"
}
```

**Response** (200 OK):
```json
{
  "bookingId": "123e4567-e89b-12d3-a456-426614174004",
  "discountApplied": true,
  "discountAmount": 100.00,
  "originalPrice": 500.00,
  "finalPrice": 400.00,
  "message": "Discount applied successfully"
}
```

### GET `/api/v1/promotions/analytics/:discountId`

Get discount performance analytics.

**Authentication**: Required (JWT)
**Authorization**: Supplier (own codes) or Admin role

**Path Parameters**:
- `discountId` (guid, required): Discount ID

**Query Parameters**:
- `startDate` (date, optional): Analytics start date
- `endDate` (date, optional): Analytics end date

**Response** (200 OK):
```json
{
  "discountId": "123e4567-e89b-12d3-a456-426614174000",
  "code": "SUMMER2024",
  "totalUses": 247,
  "uniqueCustomers": 247,
  "totalRevenue": 98800.00,
  "totalDiscount": 24700.00,
  "averageDiscountPerBooking": 100.00,
  "conversionRate": 0.35,
  "newCustomersAcquired": 89,
  "roi": 3.2,
  "usageByDate": [
    {
      "date": "2024-07-01",
      "uses": 12,
      "revenue": 4800.00,
      "discount": 1200.00
    }
  ]
}
```

### GET `/api/v1/promotions/automatic/:customerId`

Get automatic discounts for customer.

**Authentication**: Required (JWT)

**Path Parameters**:
- `customerId` (guid, required): Customer ID

**Query Parameters**:
- `vehicleId` (guid, optional): Filter by vehicle
- `startDate` (datetime, optional): Booking start
- `endDate` (datetime, optional): Booking end

**Response** (200 OK):
```json
{
  "customerId": "123e4567-e89b-12d3-a456-426614174003",
  "automaticDiscounts": [
    {
      "discountId": "123e4567-e89b-12d3-a456-426614174005",
      "code": "LOYALTY10",
      "description": "Loyal customer - 10% off",
      "discountType": "percentage",
      "discountValue": 10.00,
      "priority": 1
    }
  ]
}
```

## Business Logic

### Discount Validation Service

**Service**: `DiscountValidationService`

**Method**: `ValidateDiscountCodeAsync`
```csharp
public async Task<DiscountValidationResult> ValidateDiscountCodeAsync(
    string code,
    Guid vehicleId,
    Guid? customerId,
    DateTime startDate,
    DateTime endDate,
    decimal subtotal)
{
    // 1. Find and validate discount code exists
    var discount = await _context.DiscountCodes
        .Include(d => d.VehicleCategories)
        .FirstOrDefaultAsync(d => d.Code.ToUpper() == code.ToUpper() && d.IsActive);
    
    if (discount == null)
        return DiscountValidationResult.Invalid("INVALID_CODE", "Discount code not found or inactive");
    
    // 2. Validate date range
    var currentDate = DateTime.UtcNow.Date;
    if (currentDate < discount.ValidFrom || currentDate > discount.ValidTo)
        return DiscountValidationResult.Invalid("EXPIRED", "Discount code is not valid for these dates");
    
    // 3. Check total usage limit
    if (discount.UsageLimitTotal.HasValue && 
        discount.CurrentUsageCount >= discount.UsageLimitTotal.Value)
        return DiscountValidationResult.Invalid("USAGE_LIMIT_EXCEEDED", "Discount code has reached its usage limit");
    
    // 4. Check per-customer usage limit
    if (customerId.HasValue)
    {
        var customerUsageCount = await _context.DiscountUsage
            .CountAsync(u => u.DiscountId == discount.DiscountId && 
                           u.CustomerId == customerId.Value);
        
        if (customerUsageCount >= discount.UsageLimitPerCustomer)
            return DiscountValidationResult.Invalid("CUSTOMER_LIMIT_EXCEEDED", "You have already used this discount code");
    }
    
    // 5. Validate customer segment eligibility
    if (customerId.HasValue)
    {
        var isEligible = await IsCustomerEligibleAsync(customerId.Value, discount.CustomerSegments);
        if (!isEligible)
            return DiscountValidationResult.Invalid("NOT_ELIGIBLE", "This discount is not available for your account");
    }
    
    // 6. Validate vehicle category eligibility
    if (discount.VehicleCategories.Any())
    {
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.VehicleId == vehicleId);
        
        if (vehicle == null || !discount.VehicleCategories.Any(c => c.CategoryId == vehicle.CategoryId))
            return DiscountValidationResult.Invalid("INVALID_CATEGORY", "This discount is not valid for this vehicle category");
    }
    
    // 7. Validate minimum duration
    if (discount.MinimumDuration.HasValue)
    {
        var durationHours = (endDate - startDate).TotalHours;
        if (durationHours < discount.MinimumDuration.Value)
            return DiscountValidationResult.Invalid("MINIMUM_DURATION", 
                $"Minimum rental duration is {discount.MinimumDuration.Value} hours");
    }
    
    // 8. Validate minimum value
    if (discount.MinimumValue.HasValue && subtotal < discount.MinimumValue.Value)
        return DiscountValidationResult.Invalid("MINIMUM_VALUE", 
            $"Minimum booking value is {discount.MinimumValue.Value:C}");
    
    // 9. Calculate discount amount
    var discountAmount = CalculateDiscountAmount(discount, subtotal);
    var finalPrice = Math.Max(subtotal - discountAmount, 0);
    var savingsPercentage = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
    
    return DiscountValidationResult.Valid(
        discount.DiscountId,
        discount.Code,
        discount.DiscountType,
        discount.DiscountValue,
        discountAmount,
        finalPrice,
        savingsPercentage
    );
}

private decimal CalculateDiscountAmount(DiscountCode discount, decimal subtotal)
{
    if (discount.DiscountType == "percentage")
    {
        return Math.Round(subtotal * (discount.DiscountValue / 100), 2);
    }
    else // fixed
    {
        return Math.Min(discount.DiscountValue, subtotal);
    }
}
```

### Discount Application Service

**Service**: `DiscountApplicationService`

**Method**: `ApplyDiscountToBookingAsync`
```csharp
public async Task<BookingDiscountResult> ApplyDiscountToBookingAsync(
    Guid bookingId,
    string code,
    Guid customerId)
{
    using var transaction = await _context.Database.BeginTransactionAsync();
    
    try
    {
        // 1. Get booking details
        var booking = await _context.Bookings
            .Include(b => b.Vehicle)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId && 
                                    b.CustomerId == customerId);
        
        if (booking == null)
            return BookingDiscountResult.Error("Booking not found");
        
        if (booking.Status != "pending")
            return BookingDiscountResult.Error("Cannot apply discount to confirmed booking");
        
        // 2. Validate discount code
        var validation = await _discountValidationService.ValidateDiscountCodeAsync(
            code,
            booking.VehicleId,
            customerId,
            booking.StartDate,
            booking.EndDate,
            booking.Subtotal
        );
        
        if (!validation.IsValid)
            return BookingDiscountResult.Error(validation.Errors.First().Message);
        
        // 3. Check for existing discounts and stacking rules
        var existingDiscounts = await _context.DiscountUsage
            .Where(u => u.BookingId == bookingId)
            .ToListAsync();
        
        if (existingDiscounts.Any())
        {
            var discount = await _context.DiscountCodes
                .FirstOrDefaultAsync(d => d.DiscountId == validation.DiscountId);
            
            if (!discount.AllowStacking)
                return BookingDiscountResult.Error("This discount cannot be combined with other discounts");
        }
        
        // 4. Apply discount to booking
        booking.DiscountAmount = (booking.DiscountAmount ?? 0) + validation.DiscountAmount;
        booking.TotalPrice = booking.Subtotal - booking.DiscountAmount;
        booking.UpdatedAt = DateTime.UtcNow;
        
        // 5. Record discount usage
        var usage = new DiscountUsage
        {
            UsageId = Guid.NewGuid(),
            DiscountId = validation.DiscountId,
            BookingId = bookingId,
            CustomerId = customerId,
            DiscountAmount = validation.DiscountAmount,
            OriginalPrice = booking.Subtotal,
            FinalPrice = booking.TotalPrice,
            UsedAt = DateTime.UtcNow
        };
        
        _context.DiscountUsage.Add(usage);
        
        // 6. Increment usage counter atomically
        await _context.Database.ExecuteSqlRawAsync(
            "UPDATE DiscountCodes SET CurrentUsageCount = CurrentUsageCount + 1 WHERE DiscountId = {0}",
            validation.DiscountId
        );
        
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        
        return BookingDiscountResult.Success(
            booking.BookingId,
            validation.DiscountAmount,
            booking.Subtotal,
            booking.TotalPrice
        );
    }
    catch (Exception ex)
    {
        await transaction.RollbackAsync();
        _logger.LogError(ex, "Error applying discount to booking {BookingId}", bookingId);
        return BookingDiscountResult.Error("Failed to apply discount");
    }
}
```

### Automatic Discount Service

**Service**: `AutomaticDiscountService`

**Method**: `GetAutomaticDiscountsAsync`
```csharp
public async Task<List<AutomaticDiscountDto>> GetAutomaticDiscountsAsync(
    Guid customerId,
    Guid? vehicleId = null,
    DateTime? startDate = null,
    DateTime? endDate = null,
    decimal? subtotal = null)
{
    // Get customer profile for segment determination
    var customer = await _context.Users
        .Include(u => u.Bookings)
        .FirstOrDefaultAsync(u => u.UserId == customerId);
    
    if (customer == null)
        return new List<AutomaticDiscountDto>();
    
    // Determine customer segment
    var completedBookings = customer.Bookings.Count(b => b.Status == "completed");
    var customerSegment = completedBookings == 0 ? "new" : "returning";
    
    // Get all active automatic discounts
    var automaticDiscounts = await _context.DiscountCodes
        .Include(d => d.VehicleCategories)
        .Where(d => d.IsActive && d.IsAutomatic)
        .Where(d => DateTime.UtcNow.Date >= d.ValidFrom && 
                   DateTime.UtcNow.Date <= d.ValidTo)
        .ToListAsync();
    
    var applicableDiscounts = new List<AutomaticDiscountDto>();
    
    foreach (var discount in automaticDiscounts)
    {
        // Check customer segment eligibility
        var segments = JsonSerializer.Deserialize<List<string>>(discount.CustomerSegments);
        if (!segments.Contains("all") && !segments.Contains(customerSegment))
            continue;
        
        // Check usage limits
        if (discount.UsageLimitTotal.HasValue && 
            discount.CurrentUsageCount >= discount.UsageLimitTotal.Value)
            continue;
        
        var customerUsage = await _context.DiscountUsage
            .CountAsync(u => u.DiscountId == discount.DiscountId && 
                           u.CustomerId == customerId);
        
        if (customerUsage >= discount.UsageLimitPerCustomer)
            continue;
        
        // If vehicle-specific validation requested
        if (vehicleId.HasValue && discount.VehicleCategories.Any())
        {
            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.VehicleId == vehicleId.Value);
            
            if (vehicle == null || !discount.VehicleCategories.Any(c => c.CategoryId == vehicle.CategoryId))
                continue;
        }
        
        // Calculate potential discount amount
        decimal? discountAmount = null;
        if (subtotal.HasValue)
        {
            discountAmount = discount.DiscountType == "percentage"
                ? subtotal.Value * (discount.DiscountValue / 100)
                : Math.Min(discount.DiscountValue, subtotal.Value);
        }
        
        applicableDiscounts.Add(new AutomaticDiscountDto
        {
            DiscountId = discount.DiscountId,
            Code = discount.Code,
            Description = discount.Description,
            DiscountType = discount.DiscountType,
            DiscountValue = discount.DiscountValue,
            DiscountAmount = discountAmount,
            Priority = discount.Priority
        });
    }
    
    // Sort by priority and discount amount
    return applicableDiscounts
        .OrderByDescending(d => d.Priority)
        .ThenByDescending(d => d.DiscountAmount ?? 0)
        .ToList();
}
```

### Analytics Service

**Service**: `DiscountAnalyticsService`

**Method**: `GetDiscountAnalyticsAsync`
```csharp
public async Task<DiscountAnalyticsDto> GetDiscountAnalyticsAsync(
    Guid discountId,
    DateTime? startDate = null,
    DateTime? endDate = null)
{
    var discount = await _context.DiscountCodes
        .FirstOrDefaultAsync(d => d.DiscountId == discountId);
    
    if (discount == null)
        throw new NotFoundException("Discount code not found");
    
    // Build usage query with date filters
    var usageQuery = _context.DiscountUsage
        .Where(u => u.DiscountId == discountId);
    
    if (startDate.HasValue)
        usageQuery = usageQuery.Where(u => u.UsedAt >= startDate.Value);
    
    if (endDate.HasValue)
        usageQuery = usageQuery.Where(u => u.UsedAt <= endDate.Value);
    
    // Calculate aggregate metrics
    var usageData = await usageQuery.ToListAsync();
    
    var totalUses = usageData.Count;
    var uniqueCustomers = usageData.Select(u => u.CustomerId).Distinct().Count();
    var totalRevenue = usageData.Sum(u => u.FinalPrice);
    var totalDiscount = usageData.Sum(u => u.DiscountAmount);
    var averageDiscountPerBooking = totalUses > 0 ? totalDiscount / totalUses : 0;
    
    // Calculate new customers acquired
    var customerIds = usageData.Select(u => u.CustomerId).Distinct().ToList();
    var newCustomers = await _context.Users
        .Where(u => customerIds.Contains(u.UserId))
        .Where(u => u.Bookings.Count(b => b.Status == "completed") == 1)
        .CountAsync();
    
    // Calculate conversion rate (bookings with code / code validations)
    var validationCount = await _context.DiscountValidationLog
        .CountAsync(l => l.DiscountId == discountId && l.IsValid);
    
    var conversionRate = validationCount > 0 ? (decimal)totalUses / validationCount : 0;
    
    // Calculate ROI (revenue generated / discount given)
    var roi = totalDiscount > 0 ? totalRevenue / totalDiscount : 0;
    
    // Usage by date
    var usageByDate = usageData
        .GroupBy(u => u.UsedAt.Date)
        .Select(g => new UsageByDateDto
        {
            Date = g.Key,
            Uses = g.Count(),
            Revenue = g.Sum(u => u.FinalPrice),
            Discount = g.Sum(u => u.DiscountAmount)
        })
        .OrderBy(d => d.Date)
        .ToList();
    
    return new DiscountAnalyticsDto
    {
        DiscountId = discountId,
        Code = discount.Code,
        TotalUses = totalUses,
        UniqueCustomers = uniqueCustomers,
        TotalRevenue = totalRevenue,
        TotalDiscount = totalDiscount,
        AverageDiscountPerBooking = averageDiscountPerBooking,
        ConversionRate = conversionRate,
        NewCustomersAcquired = newCustomers,
        Roi = roi,
        UsageByDate = usageByDate
    };
}
```

### Rate Limiting and Fraud Prevention

**Rate Limiting**:
- Validation endpoint: 10 requests per minute per IP
- Apply endpoint: 5 requests per minute per customer
- Use sliding window algorithm
- Return 429 Too Many Requests when exceeded

**Fraud Detection**:
- Log all validation attempts
- Flag suspicious patterns:
  - Multiple failed validation attempts
  - Rapid code enumeration attempts
  - Same IP validating many different codes
- Alert admins of potential abuse
- Temporarily block IPs with suspicious activity

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+
- Caching: Redis (for rate limiting and code caching)
- Logging: Serilog

## Implementation Notes

**Code Uniqueness**:
- Enforce unique constraint at database level
- Check for duplicates before creation
- Suggest alternative codes if duplicate

**Atomic Operations**:
- Use database transactions for discount application
- Ensure usage counter increments atomically
- Rollback on any failure

**Performance**:
- Cache active discount codes (5-minute TTL)
- Use database indexes for fast lookups
- Batch analytics queries
- Optimize validation queries

**Security**:
- Sanitize discount codes (prevent SQL injection)
- Rate limit validation endpoint
- Log all discount operations
- Validate all inputs server-side

**Testing Requirements**:
- Unit tests for validation logic
- Unit tests for discount calculation
- Integration tests for discount application
- Test concurrent usage scenarios
- Test stacking logic
- Test automatic discount selection
- Test analytics calculations
- Load test validation endpoint

## Related Features

- Multi-Duration Rate Structures: Base pricing
- Date-Based Seasonal Pricing: Time-based pricing
- Customer Loyalty Program: Automatic loyalty discounts
- Booking Management: Discount application to bookings
