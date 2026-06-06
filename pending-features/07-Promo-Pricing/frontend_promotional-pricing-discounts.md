# Feature: Promotional Pricing and Discounts

## Overview

Marketing-driven price reduction system that enables creation and management of promotional campaigns with discount codes, percentage discounts, fixed amount discounts, and special offers to drive bookings, customer acquisition, and revenue during low-demand periods. Supports sophisticated targeting, usage limits, and stacking rules to maximize campaign effectiveness while protecting margins.

## Sprint Category

sprint-01 (First Sprint - High priority features)

## Feature ID

Pricing-Management-2.2

## User Stories

### As a marketing manager
I want to create promotional discount codes, so that I can drive bookings during low-demand periods and acquire new customers.

### As a customer
I want to apply discount codes to my booking, so that I can save money and get better value.

### As a loyal customer
I want to receive automatic discounts based on my booking history, so that I feel valued and rewarded for my loyalty.

### As a supplier
I want to control discount usage limits and restrictions, so that I can protect my margins while running effective promotions.

### As a platform administrator
I want to track discount usage and ROI, so that I can measure campaign effectiveness and optimize marketing spend.

## Frontend Specifications

### Pages

**Discount Management Page** (`/admin/promotions/discounts`)
- Create new discount codes
- View active/expired promotions
- Edit discount parameters
- Track usage statistics
- Deactivate or delete codes
- Export discount reports

**Discount Code Creation** (`/admin/promotions/create`)
- Discount code input
- Discount type selector (percentage/fixed)
- Discount value input
- Validity date range
- Usage limit settings
- Customer segment targeting
- Vehicle category restrictions
- Minimum booking requirements
- Stacking rules configuration

**Booking Checkout Page** (`/booking/checkout`)
- Discount code input field
- Apply discount button
- Discount validation feedback
- Applied discount display
- Price breakdown with discount
- Remove discount option

### UI Components

**DiscountCodeForm Component**
- Code input (auto-generate option)
- Discount type radio buttons:
  - Percentage discount (%)
  - Fixed amount ($)
- Discount value input with validation
- Date range picker (valid from/to)
- Usage limit inputs:
  - Total uses limit
  - Uses per customer limit
- Customer segment selector:
  - All customers
  - New customers only
  - Returning customers
  - Specific customer tiers
- Vehicle category multi-select
- Minimum requirements:
  - Minimum booking duration
  - Minimum booking value
- Stacking rules checkbox
- Active/inactive toggle
- Save and preview buttons

**DiscountCodeInput Component**
- Text input for discount code
- Apply button
- Loading state during validation
- Success message with discount details
- Error message for invalid codes
- Applied discount badge
- Remove discount button

**DiscountSummary Component**
- Discount code display
- Discount description
- Original price
- Discount amount (highlighted)
- Final price (emphasized)
- Savings percentage
- Terms and conditions link

**DiscountAnalytics Component**
- Total uses counter
- Remaining uses
- Revenue impact chart
- Conversion rate
- Customer acquisition count
- Average discount per booking
- ROI calculation
- Usage timeline graph

### User Flows

**Create Discount Code Flow** (Admin):
1. Admin navigates to discount management
2. Admin clicks "Create New Discount"
3. Admin enters code "SUMMER2024" (or auto-generates)
4. Admin selects "Percentage discount"
5. Admin enters 20% discount value
6. Admin sets valid dates: June 1 - August 31
7. Admin sets total usage limit: 500 uses
8. Admin sets per-customer limit: 1 use
9. Admin selects vehicle categories: All
10. Admin sets minimum duration: 3 days
11. Admin sets minimum value: $200
12. Admin enables stacking with loyalty discounts
13. System validates configuration
14. Admin saves discount code
15. System creates code and displays confirmation
16. System shows shareable discount link

**Apply Discount Code Flow** (Customer):
1. Customer completes vehicle selection
2. Customer proceeds to checkout
3. Customer enters discount code "SUMMER2024"
4. Customer clicks "Apply"
5. System validates code:
   - Code exists and is active
   - Current date within valid range
   - Usage limit not exceeded
   - Customer hasn't used code before
   - Booking meets minimum requirements
   - Vehicle category is eligible
6. System calculates discount: $500 × 20% = $100
7. System applies discount to booking
8. System displays: "Discount applied: -$100 (20% off)"
9. System updates total: $500 → $400
10. System shows savings: "You saved $100!"
11. Customer completes booking
12. System increments code usage counter

**Automatic Discount Flow**:
1. Customer logs in and starts booking
2. System checks for automatic discounts:
   - Loyalty tier discounts
   - First-time customer offers
   - Abandoned cart recovery
   - Birthday month specials
3. System finds: "Loyal customer - 10% off"
4. System automatically applies discount
5. System displays: "Loyalty discount applied!"
6. Customer sees discounted price throughout booking
7. Customer completes booking with discount

### Data Requirements

**From Backend APIs**:
- GET `/api/promotions/discounts` - List all discounts (admin)
- POST `/api/promotions/discounts` - Create discount code
- PUT `/api/promotions/discounts/:id` - Update discount
- DELETE `/api/promotions/discounts/:id` - Delete discount
- POST `/api/promotions/validate` - Validate discount code
- POST `/api/promotions/apply` - Apply discount to booking
- GET `/api/promotions/analytics/:id` - Get discount analytics

**Discount Data**:
- Discount code (string)
- Discount type (percentage/fixed)
- Discount value (decimal)
- Valid from/to dates
- Usage limits (total, per customer)
- Customer segment restrictions
- Vehicle category restrictions
- Minimum duration/value requirements
- Stacking rules
- Active status
- Usage statistics

## Backend Specifications

### API Endpoints

**GET `/api/v1/promotions/discounts`**
- Purpose: List all discount codes with filters
- Authentication: Required (JWT)
- Authorization: Supplier or Admin role
- Query Parameters:
  - `status` (string, optional): "active" | "expired" | "all"
  - `supplierId` (guid, optional): Filter by supplier
  - `page` (int, optional): Page number
  - `pageSize` (int, optional): Results per page
- Response: Paginated list of discounts

**POST `/api/v1/promotions/discounts`**
- Purpose: Create new discount code
- Authentication: Required (JWT)
- Authorization: Supplier or Admin role
- Request Body: DiscountCodeCreate
- Response: Created discount with ID

**PUT `/api/v1/promotions/discounts/:discountId`**
- Purpose: Update existing discount code
- Authentication: Required (JWT)
- Authorization: Supplier or Admin role
- Path Parameters:
  - `discountId` (guid, required): Discount ID
- Request Body: DiscountCodeUpdate
- Response: Updated discount

**DELETE `/api/v1/promotions/discounts/:discountId`**
- Purpose: Delete or deactivate discount code
- Authentication: Required (JWT)
- Authorization: Supplier or Admin role
- Path Parameters:
  - `discountId` (guid, required): Discount ID
- Response: Success confirmation

**POST `/api/v1/promotions/validate`**
- Purpose: Validate discount code for booking
- Authentication: Optional (public)
- Request Body:
  - `code` (string, required): Discount code
  - `vehicleId` (guid, required): Vehicle being booked
  - `customerId` (guid, optional): Customer ID
  - `startDate` (datetime, required): Booking start
  - `endDate` (datetime, required): Booking end
  - `subtotal` (decimal, required): Booking subtotal
- Response: Validation result with discount details

**POST `/api/v1/promotions/apply`**
- Purpose: Apply discount to booking
- Authentication: Required (JWT)
- Request Body:
  - `bookingId` (guid, required): Booking ID
  - `code` (string, required): Discount code
- Response: Updated booking with discount applied

**GET `/api/v1/promotions/analytics/:discountId`**
- Purpose: Get discount performance analytics
- Authentication: Required (JWT)
- Authorization: Supplier or Admin role
- Path Parameters:
  - `discountId` (guid, required): Discount ID
- Response: Usage statistics and ROI metrics

**GET `/api/v1/promotions/automatic/:customerId`**
- Purpose: Get automatic discounts for customer
- Authentication: Required (JWT)
- Path Parameters:
  - `customerId` (guid, required): Customer ID
- Response: List of applicable automatic discounts

### Request Schemas

**DiscountCodeCreate**:
```
{
  code: string (required, 3-50 chars, alphanumeric + hyphens),
  description: string (required, max 500 chars),
  discountType: "percentage" | "fixed" (required),
  discountValue: decimal (required, > 0),
  validFrom: date (required),
  validTo: date (required),
  usageLimitTotal: int (optional, null = unlimited),
  usageLimitPerCustomer: int (optional, default 1),
  customerSegments: ["all" | "new" | "returning" | "tier1" | "tier2" | "tier3"],
  vehicleCategories: [guid] (optional, empty = all),
  minimumDuration: int (optional, hours),
  minimumValue: decimal (optional),
  allowStacking: boolean (default false),
  isAutomatic: boolean (default false),
  supplierId: guid (required)
}
```

**DiscountCodeUpdate**:
```
{
  description: string (optional),
  validTo: date (optional),
  usageLimitTotal: int (optional),
  isActive: boolean (optional)
}
```

### Response Schemas

**DiscountCodeResponse**:
```
{
  discountId: guid,
  code: string,
  description: string,
  discountType: "percentage" | "fixed",
  discountValue: decimal,
  validFrom: date,
  validTo: date,
  usageLimitTotal: int,
  usageLimitPerCustomer: int,
  currentUsageCount: int,
  remainingUses: int,
  customerSegments: [string],
  vehicleCategories: [guid],
  minimumDuration: int,
  minimumValue: decimal,
  allowStacking: boolean,
  isAutomatic: boolean,
  isActive: boolean,
  supplierId: guid,
  createdBy: guid,
  createdAt: datetime,
  updatedAt: datetime
}
```

**DiscountValidationResponse**:
```
{
  isValid: boolean,
  discountId: guid,
  code: string,
  discountType: "percentage" | "fixed",
  discountValue: decimal,
  discountAmount: decimal,
  finalPrice: decimal,
  savingsPercentage: decimal,
  errors: [
    {
      code: string,
      message: string
    }
  ]
}
```

**DiscountAnalyticsResponse**:
```
{
  discountId: guid,
  code: string,
  totalUses: int,
  uniqueCustomers: int,
  totalRevenue: decimal,
  totalDiscount: decimal,
  averageDiscountPerBooking: decimal,
  conversionRate: decimal,
  newCustomersAcquired: int,
  roi: decimal,
  usageByDate: [
    {
      date: date,
      uses: int,
      revenue: decimal
    }
  ]
}
```

### Business Logic

**Discount Code Validation**:
```csharp
public async Task<DiscountValidationResult> ValidateDiscountCode(
    string code, 
    Guid vehicleId, 
    Guid? customerId, 
    DateTime startDate, 
    DateTime endDate, 
    decimal subtotal)
{
    // 1. Find discount code
    var discount = await _context.DiscountCodes
        .FirstOrDefaultAsync(d => d.Code == code && d.IsActive);
    
    if (discount == null)
        return Invalid("Discount code not found or inactive");
    
    // 2. Check date validity
    var now = DateTime.UtcNow.Date;
    if (now < discount.ValidFrom || now > discount.ValidTo)
        return Invalid("Discount code is not valid for these dates");
    
    // 3. Check usage limits
    if (discount.UsageLimitTotal.HasValue && 
        discount.CurrentUsageCount >= discount.UsageLimitTotal.Value)
        return Invalid("Discount code has reached its usage limit");
    
    // 4. Check per-customer usage
    if (customerId.HasValue)
    {
        var customerUsage = await _context.DiscountUsage
            .CountAsync(u => u.DiscountId == discount.DiscountId && 
                           u.CustomerId == customerId.Value);
        
        if (customerUsage >= discount.UsageLimitPerCustomer)
            return Invalid("You have already used this discount code");
    }
    
    // 5. Check customer segment eligibility
    if (customerId.HasValue && !await IsCustomerEligible(customerId.Value, discount))
        return Invalid("This discount is not available for your account");
    
    // 6. Check vehicle category eligibility
    if (discount.VehicleCategories.Any())
    {
        var vehicle = await _context.Vehicles
            .Include(v => v.Category)
            .FirstOrDefaultAsync(v => v.VehicleId == vehicleId);
        
        if (!discount.VehicleCategories.Contains(vehicle.CategoryId))
            return Invalid("This discount is not valid for this vehicle category");
    }
    
    // 7. Check minimum duration
    if (discount.MinimumDuration.HasValue)
    {
        var duration = (endDate - startDate).TotalHours;
        if (duration < discount.MinimumDuration.Value)
            return Invalid($"Minimum rental duration is {discount.MinimumDuration} hours");
    }
    
    // 8. Check minimum value
    if (discount.MinimumValue.HasValue && subtotal < discount.MinimumValue.Value)
        return Invalid($"Minimum booking value is {discount.MinimumValue:C}");
    
    // 9. Calculate discount amount
    var discountAmount = discount.DiscountType == "percentage"
        ? subtotal * (discount.DiscountValue / 100)
        : discount.DiscountValue;
    
    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.Min(discountAmount, subtotal);
    
    return Valid(discount, discountAmount, subtotal - discountAmount);
}
```

**Automatic Discount Application**:
```csharp
public async Task<List<AutomaticDiscount>> GetAutomaticDiscounts(
    Guid customerId, 
    Guid vehicleId, 
    DateTime startDate, 
    DateTime endDate, 
    decimal subtotal)
{
    var applicableDiscounts = new List<AutomaticDiscount>();
    
    // Get all active automatic discounts
    var automaticDiscounts = await _context.DiscountCodes
        .Where(d => d.IsActive && d.IsAutomatic)
        .ToListAsync();
    
    foreach (var discount in automaticDiscounts)
    {
        var validation = await ValidateDiscountCode(
            discount.Code, vehicleId, customerId, startDate, endDate, subtotal);
        
        if (validation.IsValid)
        {
            applicableDiscounts.Add(new AutomaticDiscount
            {
                DiscountId = discount.DiscountId,
                Code = discount.Code,
                Description = discount.Description,
                DiscountAmount = validation.DiscountAmount,
                Priority = discount.Priority
            });
        }
    }
    
    // Sort by priority and discount amount
    return applicableDiscounts
        .OrderByDescending(d => d.Priority)
        .ThenByDescending(d => d.DiscountAmount)
        .ToList();
}
```

**Discount Stacking Logic**:
```csharp
public decimal ApplyStackedDiscounts(
    decimal subtotal, 
    List<AppliedDiscount> discounts)
{
    var total = subtotal;
    
    // Apply discounts in order of priority
    foreach (var discount in discounts.OrderBy(d => d.Priority))
    {
        if (discount.DiscountType == "percentage")
        {
            var discountAmount = total * (discount.DiscountValue / 100);
            total -= discountAmount;
        }
        else // fixed
        {
            total -= Math.Min(discount.DiscountValue, total);
        }
    }
    
    // Ensure total never goes below zero
    return Math.Max(total, 0);
}
```

### Authentication Requirements

- No authentication required for validating discount codes
- Customer authentication required to apply discounts to bookings
- Supplier role required to create/manage own discount codes
- Admin role required to manage all discount codes
- Audit logging for all discount operations

## Database Specifications

### Schema Changes

**New Tables**:
- `DiscountCodes` - Promotional discount definitions
- `DiscountUsage` - Track discount code usage
- `DiscountVehicleCategories` - Vehicle category restrictions

**Modified Tables**:
- `Bookings` - Add discount tracking fields

### Table Definitions

**DiscountCodes Table**:
```sql
CREATE TABLE DiscountCodes (
  DiscountId CHAR(36) PRIMARY KEY,
  Code VARCHAR(50) NOT NULL UNIQUE,
  Description VARCHAR(500) NOT NULL,
  DiscountType ENUM('percentage', 'fixed') NOT NULL,
  DiscountValue DECIMAL(10,2) NOT NULL,
  ValidFrom DATE NOT NULL,
  ValidTo DATE NOT NULL,
  UsageLimitTotal INT NULL COMMENT 'NULL = unlimited',
  UsageLimitPerCustomer INT NOT NULL DEFAULT 1,
  CurrentUsageCount INT NOT NULL DEFAULT 0,
  CustomerSegments JSON NOT NULL COMMENT 'Array of eligible segments',
  MinimumDuration INT NULL COMMENT 'Hours',
  MinimumValue DECIMAL(10,2) NULL,
  AllowStacking BOOLEAN NOT NULL DEFAULT FALSE,
  IsAutomatic BOOLEAN NOT NULL DEFAULT FALSE,
  Priority INT NOT NULL DEFAULT 0 COMMENT 'For stacking order',
  IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  SupplierId CHAR(36) NOT NULL,
  CreatedBy CHAR(36) NOT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (SupplierId) REFERENCES Suppliers(SupplierId) ON DELETE CASCADE,
  FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
  
  INDEX idx_code_active (Code, IsActive),
  INDEX idx_supplier_active (SupplierId, IsActive),
  INDEX idx_valid_dates (ValidFrom, ValidTo, IsActive),
  INDEX idx_automatic (IsAutomatic, IsActive, Priority),
  
  CONSTRAINT chk_positive_value CHECK (DiscountValue > 0),
  CONSTRAINT chk_percentage_range CHECK (
    DiscountType != 'percentage' OR 
    (DiscountValue > 0 AND DiscountValue <= 100)
  ),
  CONSTRAINT chk_valid_dates CHECK (ValidTo >= ValidFrom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**DiscountUsage Table**:
```sql
CREATE TABLE DiscountUsage (
  UsageId CHAR(36) PRIMARY KEY,
  DiscountId CHAR(36) NOT NULL,
  BookingId CHAR(36) NOT NULL,
  CustomerId CHAR(36) NOT NULL,
  DiscountAmount DECIMAL(10,2) NOT NULL,
  OriginalPrice DECIMAL(10,2) NOT NULL,
  FinalPrice DECIMAL(10,2) NOT NULL,
  UsedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (DiscountId) REFERENCES DiscountCodes(DiscountId) ON DELETE CASCADE,
  FOREIGN KEY (BookingId) REFERENCES Bookings(BookingId) ON DELETE CASCADE,
  FOREIGN KEY (CustomerId) REFERENCES Users(UserId) ON DELETE CASCADE,
  
  INDEX idx_discount_used (DiscountId, UsedAt DESC),
  INDEX idx_customer_used (CustomerId, DiscountId),
  INDEX idx_booking (BookingId),
  
  UNIQUE KEY uk_booking_discount (BookingId, DiscountId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**DiscountVehicleCategories Table**:
```sql
CREATE TABLE DiscountVehicleCategories (
  DiscountId CHAR(36) NOT NULL,
  CategoryId CHAR(36) NOT NULL,
  
  PRIMARY KEY (DiscountId, CategoryId),
  
  FOREIGN KEY (DiscountId) REFERENCES DiscountCodes(DiscountId) ON DELETE CASCADE,
  FOREIGN KEY (CategoryId) REFERENCES VehicleCategories(CategoryId) ON DELETE CASCADE,
  
  INDEX idx_category (CategoryId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

- `DiscountCodes.SupplierId` → `Suppliers.SupplierId` (Many-to-One)
- `DiscountCodes.CreatedBy` → `Users.UserId` (Many-to-One)
- `DiscountUsage.DiscountId` → `DiscountCodes.DiscountId` (Many-to-One)
- `DiscountUsage.BookingId` → `Bookings.BookingId` (Many-to-One)
- `DiscountUsage.CustomerId` → `Users.UserId` (Many-to-One)
- `DiscountVehicleCategories.DiscountId` → `DiscountCodes.DiscountId` (Many-to-Many)
- `DiscountVehicleCategories.CategoryId` → `VehicleCategories.CategoryId` (Many-to-Many)

### Indexes

- `idx_code_active` on `DiscountCodes(Code, IsActive)` - Fast code lookup
- `idx_supplier_active` on `DiscountCodes(SupplierId, IsActive)` - Supplier discount management
- `idx_valid_dates` on `DiscountCodes(ValidFrom, ValidTo, IsActive)` - Date-based queries
- `idx_automatic` on `DiscountCodes(IsAutomatic, IsActive, Priority)` - Automatic discount lookup
- `idx_discount_used` on `DiscountUsage(DiscountId, UsedAt DESC)` - Usage analytics
- `idx_customer_used` on `DiscountUsage(CustomerId, DiscountId)` - Per-customer usage tracking

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript

## Implementation Notes

**Code Generation**:
- Auto-generate codes using pattern: PREFIX-RANDOM (e.g., SUMMER-X7K9P2)
- Ensure uniqueness through database constraint
- Use uppercase for consistency
- Validate format: alphanumeric + hyphens only

**Discount Calculation**:
- Always calculate percentage discounts on current total (after previous discounts if stacking)
- Fixed discounts apply as absolute amounts
- Never allow total to go below zero
- Round discount amounts to 2 decimal places

**Usage Tracking**:
- Increment usage counter atomically using database transaction
- Track usage even for failed bookings (to prevent abuse)
- Store complete usage history for analytics
- Update current usage count in real-time

**Customer Segment Logic**:
- "new": Customer with 0 completed bookings
- "returning": Customer with 1+ completed bookings
- "tier1/2/3": Based on loyalty program tier
- "all": No restrictions

**Performance Optimization**:
- Cache active discount codes (5-minute TTL)
- Index code lookups for fast validation
- Use database constraints for data integrity
- Batch usage analytics queries

**Security Considerations**:
- Rate limit discount validation API (prevent brute force)
- Log all discount applications for fraud detection
- Validate discount amounts server-side
- Prevent discount code enumeration attacks

**Testing Requirements**:
- Test discount code validation logic
- Test usage limit enforcement
- Test customer segment eligibility
- Test vehicle category restrictions
- Test minimum requirements validation
- Test discount stacking logic
- Test automatic discount application
- Test concurrent usage (race conditions)
- Verify analytics calculations

## Related Features

- Multi-Duration Rate Structures: Base pricing system
- Vehicle-Specific Pricing: Vehicle rate management
- Date-Based Seasonal Pricing: Time-based pricing
- Customer Loyalty Program: Automatic loyalty discounts
- Marketing Campaign Management: Campaign coordination
