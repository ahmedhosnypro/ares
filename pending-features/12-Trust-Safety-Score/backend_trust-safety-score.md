# Feature: Trust & Safety Score - Backend Specifications

## Overview

The backend implementation of the Trust & Safety Score system provides the calculation engine, API endpoints, and business logic for managing user trust scores. This system processes multiple data sources including verification status, booking history, payment records, vehicle care reports, communication metrics, and cancellation patterns to generate a composite trust score. The backend ensures accurate, performant, and secure trust score calculations while maintaining data integrity and privacy.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

F-AM-010

## API Endpoints

### 1. GET /api/users/{userId}/trust-score

**Purpose**: Retrieve user's current trust score with component breakdown

**Authentication**: Required (JWT Bearer token)

**Authorization**:
- Users can view their own trust score
- Hosts can view renter trust scores for active or pending bookings
- Admins can view any user's trust score
- Public access returns limited score (stars only, no breakdown)

**Request**:
```http
GET /api/users/123e4567-e89b-12d3-a456-426614174000/trust-score HTTP/1.1
Host: api.example.com
Authorization: Bearer {jwt_token}
```

**Response** (200 OK):
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "overallScore": 85.5,
  "displayRating": 4.5,
  "lastUpdated": "2026-02-23T10:30:00Z",
  "trend": "up",
  "trendPercentage": 5.2,
  "components": [
    {
      "name": "Verification Status",
      "score": 90.0,
      "weight": 0.25,
      "status": "excellent",
      "description": "Email, phone, and license verified",
      "lastUpdated": "2026-02-20T14:00:00Z"
    },
    {
      "name": "Booking History",
      "score": 85.0,
      "weight": 0.20,
      "status": "good",
      "description": "15 completed bookings",
      "lastUpdated": "2026-02-23T10:30:00Z"
    },
    {
      "name": "Payment Reliability",
      "score": 95.0,
      "weight": 0.20,
      "status": "excellent",
      "description": "No late payments or chargebacks",
      "lastUpdated": "2026-02-23T10:30:00Z"
    },
    {
      "name": "Vehicle Care",
      "score": 80.0,
      "weight": 0.15,
      "status": "good",
      "description": "1 minor damage claim",
      "lastUpdated": "2026-02-15T09:00:00Z"
    },
    {
      "name": "Communication Quality",
      "score": 88.0,
      "weight": 0.10,
      "status": "good",
      "description": "Average response time: 2 hours",
      "lastUpdated": "2026-02-23T10:30:00Z"
    },
    {
      "name": "Cancellation Rate",
      "score": 90.0,
      "weight": 0.05,
      "status": "excellent",
      "description": "3% cancellation rate",
      "lastUpdated": "2026-02-23T10:30:00Z"
    },
    {
      "name": "Account Age",
      "score": 75.0,
      "weight": 0.05,
      "status": "good",
      "description": "Account active for 4 months",
      "lastUpdated": "2026-02-23T10:30:00Z"
    }
  ],
  "verifications": [
    {
      "type": "email",
      "completed": true,
      "completedDate": "2025-12-01T09:00:00Z",
      "status": "verified"
    },
    {
      "type": "phone",
      "completed": true,
      "completedDate": "2025-12-01T09:15:00Z",
      "status": "verified"
    },
    {
      "type": "license",
      "completed": true,
      "completedDate": "2025-12-05T14:30:00Z",
      "expirationDate": "2028-12-01T00:00:00Z",
      "status": "verified"
    },
    {
      "type": "kyc",
      "completed": false,
      "status": "not_started"
    },
    {
      "type": "payment",
      "completed": true,
      "completedDate": "2025-12-01T10:00:00Z",
      "status": "verified"
    }
  ],
  "improvementTips": [
    {
      "id": "complete-kyc",
      "title": "Complete Enhanced Verification",
      "description": "Complete KYC verification to increase your score by up to 10 points and access premium vehicles",
      "estimatedImpact": 10.0,
      "priority": "high",
      "actionUrl": "/account/verification/kyc",
      "actionLabel": "Start Verification",
      "category": "verification"
    },
    {
      "id": "reduce-cancellations",
      "title": "Maintain Low Cancellation Rate",
      "description": "Continue your excellent track record of completing bookings",
      "estimatedImpact": 5.0,
      "priority": "medium",
      "actionUrl": "/bookings",
      "actionLabel": "View Bookings",
      "category": "behavior"
    }
  ]
}
```

**Error Responses**:
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: User not authorized to view this trust score
- 404 Not Found: User does not exist
- 500 Internal Server Error: Score calculation failed

### 2. GET /api/users/{userId}/trust-score/history

**Purpose**: Retrieve historical trust score data for trend analysis

**Authentication**: Required

**Authorization**: Same as trust score endpoint

**Query Parameters**:
- `timeRange` (optional): '30days' | '90days' | '1year' | 'all' (default: '90days')
- `limit` (optional): Maximum number of snapshots (default: 100, max: 500)
- `offset` (optional): Pagination offset (default: 0)

**Request**:
```http
GET /api/users/123e4567-e89b-12d3-a456-426614174000/trust-score/history?timeRange=90days&limit=50 HTTP/1.1
Host: api.example.com
Authorization: Bearer {jwt_token}
```

**Response** (200 OK):
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "timeRange": "90days",
  "totalSnapshots": 45,
  "snapshots": [
    {
      "date": "2026-02-23T10:30:00Z",
      "score": 85.5,
      "previousScore": 83.5,
      "changeAmount": 2.0,
      "event": "Completed booking #1234",
      "eventType": "booking_completed",
      "componentChanged": "Booking History"
    },
    {
      "date": "2026-02-15T14:20:00Z",
      "score": 83.5,
      "previousScore": 78.5,
      "changeAmount": 5.0,
      "event": "Driver license verified",
      "eventType": "verification_completed",
      "componentChanged": "Verification Status"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### 3. POST /api/users/{userId}/trust-score/recalculate

**Purpose**: Trigger immediate trust score recalculation

**Authentication**: Required

**Authorization**:
- Users can recalculate their own score (rate limited)
- System can trigger for any user (no rate limit)
- Admins can trigger for any user

**Request**:
```http
POST /api/users/123e4567-e89b-12d3-a456-426614174000/trust-score/recalculate HTTP/1.1
Host: api.example.com
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "reason": "User completed verification"
}
```

**Response** (200 OK):
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "previousScore": 80.0,
  "newScore": 85.5,
  "changeAmount": 5.5,
  "recalculatedAt": "2026-02-23T10:30:00Z",
  "changedComponents": [
    {
      "name": "Verification Status",
      "previousScore": 70.0,
      "newScore": 90.0,
      "changeAmount": 20.0,
      "reason": "Driver license verified"
    },
    {
      "name": "Booking History",
      "previousScore": 85.0,
      "newScore": 85.0,
      "changeAmount": 0.0,
      "reason": "No change"
    }
  ],
  "cacheInvalidated": true
}
```

**Rate Limiting**:
- User-initiated: 5 requests per hour
- System-initiated: No limit
- Returns 429 Too Many Requests if exceeded

### 4. GET /api/users/{userId}/trust-score/improvement-tips

**Purpose**: Retrieve personalized improvement recommendations

**Authentication**: Required

**Authorization**: User can view own tips; admins can view any user's tips

**Request**:
```http
GET /api/users/123e4567-e89b-12d3-a456-426614174000/trust-score/improvement-tips HTTP/1.1
Host: api.example.com
Authorization: Bearer {jwt_token}
```

**Response** (200 OK):
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "currentScore": 85.5,
  "potentialMaxScore": 95.5,
  "tips": [
    {
      "id": "complete-kyc",
      "title": "Complete Enhanced Verification",
      "description": "Complete KYC verification to increase your score by up to 10 points",
      "estimatedImpact": 10.0,
      "priority": "high",
      "actionUrl": "/account/verification/kyc",
      "actionLabel": "Start Verification",
      "category": "verification",
      "status": "active",
      "createdAt": "2026-02-20T10:00:00Z"
    }
  ],
  "generatedAt": "2026-02-23T10:30:00Z"
}
```

### 5. PATCH /api/users/{userId}/trust-score/improvement-tips/{tipId}

**Purpose**: Update improvement tip status (complete, dismiss)

**Authentication**: Required

**Authorization**: User can update own tips

**Request**:
```http
PATCH /api/users/123e4567-e89b-12d3-a456-426614174000/trust-score/improvement-tips/complete-kyc HTTP/1.1
Host: api.example.com
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "status": "completed"
}
```

**Response** (200 OK):
```json
{
  "tipId": "complete-kyc",
  "status": "completed",
  "completedAt": "2026-02-23T10:30:00Z",
  "scoreRecalculated": true
}
```

## Business Logic

### Trust Score Calculation Engine

#### Core Algorithm

```csharp
public class TrustScoreCalculator
{
    private readonly IUserRepository _userRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IPaymentRepository _paymentRepository;
    private readonly IVerificationRepository _verificationRepository;
    
    public async Task<TrustScore> CalculateTrustScoreAsync(Guid userId)
    {
        var components = new List<TrustScoreComponent>();
        
        // Calculate each component
        components.Add(await CalculateVerificationScoreAsync(userId));
        components.Add(await CalculateBookingHistoryScoreAsync(userId));
        components.Add(await CalculatePaymentReliabilityScoreAsync(userId));
        components.Add(await CalculateVehicleCareScoreAsync(userId));
        components.Add(await CalculateCommunicationScoreAsync(userId));
        components.Add(await CalculateCancellationRateScoreAsync(userId));
        components.Add(await CalculateAccountAgeScoreAsync(userId));
        
        // Calculate weighted overall score
        var overallScore = components.Sum(c => c.Score * c.Weight);
        var displayRating = ConvertToStarRating(overallScore);
        
        return new TrustScore
        {
            UserId = userId,
            OverallScore = overallScore,
            DisplayRating = displayRating,
            Components = components,
            CalculatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };
    }
}
```

#### Component Calculation Methods

**1. Verification Status (Weight: 0.25)**

```csharp
private async Task<TrustScoreComponent> CalculateVerificationScoreAsync(Guid userId)
{
    var verifications = await _verificationRepository.GetUserVerificationsAsync(userId);
    
    var score = 0.0;
    if (verifications.EmailVerified) score += 20;
    if (verifications.PhoneVerified) score += 20;
    if (verifications.LicenseVerified) score += 30;
    if (verifications.KycCompleted) score += 20;
    if (verifications.PaymentMethodAdded) score += 10;
    
    return new TrustScoreComponent
    {
        Name = "Verification Status",
        Score = score,
        Weight = 0.25,
        Status = GetStatus(score),
        Description = GetVerificationDescription(verifications),
        LastUpdated = verifications.LastVerificationDate
    };
}
```

**2. Booking History (Weight: 0.20)**

```csharp
private async Task<TrustScoreComponent> CalculateBookingHistoryScoreAsync(Guid userId)
{
    var completedBookings = await _bookingRepository.GetCompletedBookingCountAsync(userId);
    
    var score = completedBookings switch
    {
        0 => 0,
        >= 1 and <= 5 => 40,
        >= 6 and <= 15 => 70,
        >= 16 and <= 30 => 85,
        _ => 100
    };
    
    return new TrustScoreComponent
    {
        Name = "Booking History",
        Score = score,
        Weight = 0.20,
        Status = GetStatus(score),
        Description = $"{completedBookings} completed bookings",
        LastUpdated = await _bookingRepository.GetLastBookingDateAsync(userId)
    };
}
```

**3. Payment Reliability (Weight: 0.20)**

```csharp
private async Task<TrustScoreComponent> CalculatePaymentReliabilityScoreAsync(Guid userId)
{
    var paymentMetrics = await _paymentRepository.GetPaymentMetricsAsync(userId);
    
    var score = 100.0;
    
    // Deduct for late payments
    score -= paymentMetrics.LatePaymentCount switch
    {
        1 => 20,
        2 or 3 => 40,
        >= 4 => 60,
        _ => 0
    };
    
    // Deduct for chargebacks
    score -= paymentMetrics.ChargebackCount * 20;
    
    // Ensure score doesn't go below 0
    score = Math.Max(0, score);
    
    return new TrustScoreComponent
    {
        Name = "Payment Reliability",
        Score = score,
        Weight = 0.20,
        Status = GetStatus(score),
        Description = GetPaymentDescription(paymentMetrics),
        LastUpdated = paymentMetrics.LastPaymentDate
    };
}
```

**4. Vehicle Care (Weight: 0.15)**

```csharp
private async Task<TrustScoreComponent> CalculateVehicleCareScoreAsync(Guid userId)
{
    var damageMetrics = await _bookingRepository.GetDamageMetricsAsync(userId);
    
    var score = 100.0;
    
    if (damageMetrics.MinorDamageCount == 1) score = 85;
    else if (damageMetrics.MinorDamageCount >= 2) score = 70;
    
    if (damageMetrics.MajorDamageCount == 1) score = Math.Min(score, 50);
    else if (damageMetrics.MajorDamageCount >= 2) score = Math.Min(score, 30);
    
    return new TrustScoreComponent
    {
        Name = "Vehicle Care",
        Score = score,
        Weight = 0.15,
        Status = GetStatus(score),
        Description = GetDamageDescription(damageMetrics),
        LastUpdated = damageMetrics.LastInspectionDate
    };
}
```

**5. Communication Quality (Weight: 0.10)**

```csharp
private async Task<TrustScoreComponent> CalculateCommunicationScoreAsync(Guid userId)
{
    var commMetrics = await _userRepository.GetCommunicationMetricsAsync(userId);
    
    var responseScore = commMetrics.AverageResponseTimeHours switch
    {
        < 1 => 100,
        >= 1 and < 4 => 85,
        >= 4 and < 24 => 70,
        _ => 50
    };
    
    var ratingScore = (commMetrics.AverageHostRating / 5.0) * 100;
    
    var score = (responseScore + ratingScore) / 2;
    
    return new TrustScoreComponent
    {
        Name = "Communication Quality",
        Score = score,
        Weight = 0.10,
        Status = GetStatus(score),
        Description = $"Average response time: {commMetrics.AverageResponseTimeHours:F1} hours",
        LastUpdated = commMetrics.LastCommunicationDate
    };
}
```

**6. Cancellation Rate (Weight: 0.05)**

```csharp
private async Task<TrustScoreComponent> CalculateCancellationRateScoreAsync(Guid userId)
{
    var cancellationRate = await _bookingRepository.GetCancellationRateAsync(userId);
    
    var score = cancellationRate switch
    {
        0 => 100,
        > 0 and <= 0.05 => 90,
        > 0.05 and <= 0.10 => 75,
        > 0.10 and <= 0.20 => 50,
        _ => 25
    };
    
    return new TrustScoreComponent
    {
        Name = "Cancellation Rate",
        Score = score,
        Weight = 0.05,
        Status = GetStatus(score),
        Description = $"{cancellationRate:P0} cancellation rate",
        LastUpdated = DateTime.UtcNow
    };
}
```

**7. Account Age (Weight: 0.05)**

```csharp
private async Task<TrustScoreComponent> CalculateAccountAgeScoreAsync(Guid userId)
{
    var accountCreatedDate = await _userRepository.GetAccountCreatedDateAsync(userId);
    var accountAgeMonths = (DateTime.UtcNow - accountCreatedDate).TotalDays / 30;
    
    var score = accountAgeMonths switch
    {
        < 1 => 40,
        >= 1 and < 3 => 60,
        >= 3 and < 6 => 75,
        >= 6 and < 12 => 85,
        _ => 100
    };
    
    return new TrustScoreComponent
    {
        Name = "Account Age",
        Score = score,
        Weight = 0.05,
        Status = GetStatus(score),
        Description = $"Account active for {Math.Floor(accountAgeMonths)} months",
        LastUpdated = DateTime.UtcNow
    };
}
```

### Score Update Triggers

Implement event-driven score updates using domain events:

```csharp
public class TrustScoreEventHandler
{
    public async Task HandleAsync(DomainEvent domainEvent)
    {
        var userId = domainEvent.UserId;
        
        switch (domainEvent)
        {
            case EmailVerifiedEvent:
            case PhoneVerifiedEvent:
            case LicenseVerifiedEvent:
            case KycCompletedEvent:
                await RecalculateTrustScoreAsync(userId, "Verification completed");
                break;
                
            case BookingCompletedEvent:
                await RecalculateTrustScoreAsync(userId, "Booking completed");
                break;
                
            case PaymentProcessedEvent:
            case PaymentLateEvent:
                await RecalculateTrustScoreAsync(userId, "Payment status changed");
                break;
                
            case VehicleReturnInspectedEvent:
            case DamageClaimFiledEvent:
                await RecalculateTrustScoreAsync(userId, "Vehicle inspection completed");
                break;
                
            case BookingCancelledEvent:
                await RecalculateTrustScoreAsync(userId, "Booking cancelled");
                break;
                
            case HostRatingReceivedEvent:
            case MessageRespondedEvent:
                await RecalculateTrustScoreAsync(userId, "Communication activity");
                break;
        }
    }
}
```

### Improvement Tip Generation

```csharp
public class ImprovementTipGenerator
{
    public async Task<List<ImprovementTip>> GenerateTipsAsync(Guid userId, TrustScore currentScore)
    {
        var tips = new List<ImprovementTip>();
        
        // Check for missing verifications
        var verifications = await _verificationRepository.GetUserVerificationsAsync(userId);
        if (!verifications.EmailVerified)
            tips.Add(CreateVerificationTip("email", 20, "high"));
        if (!verifications.PhoneVerified)
            tips.Add(CreateVerificationTip("phone", 20, "high"));
        if (!verifications.LicenseVerified)
            tips.Add(CreateVerificationTip("license", 30, "high"));
        if (!verifications.KycCompleted)
            tips.Add(CreateVerificationTip("kyc", 20, "high"));
        
        // Check for low-scoring components
        foreach (var component in currentScore.Components)
        {
            if (component.Score < 70)
            {
                tips.Add(CreateComponentImprovementTip(component));
            }
        }
        
        // Sort by priority and estimated impact
        return tips.OrderByDescending(t => t.Priority)
                   .ThenByDescending(t => t.EstimatedImpact)
                   .ToList();
    }
}
```

### Caching Strategy

```csharp
public class CachedTrustScoreService
{
    private readonly IDistributedCache _cache;
    private readonly TrustScoreCalculator _calculator;
    
    public async Task<TrustScore> GetTrustScoreAsync(Guid userId)
    {
        var cacheKey = $"trust-score:{userId}";
        var cachedScore = await _cache.GetAsync<TrustScore>(cacheKey);
        
        if (cachedScore != null && cachedScore.ExpiresAt > DateTime.UtcNow)
        {
            return cachedScore;
        }
        
        var freshScore = await _calculator.CalculateTrustScoreAsync(userId);
        await _cache.SetAsync(cacheKey, freshScore, TimeSpan.FromHours(1));
        
        return freshScore;
    }
    
    public async Task InvalidateCacheAsync(Guid userId)
    {
        var cacheKey = $"trust-score:{userId}";
        await _cache.RemoveAsync(cacheKey);
    }
}
```

## Authentication & Authorization

### JWT Token Validation

All endpoints require valid JWT token with user claims:

```csharp
[Authorize]
[ApiController]
[Route("api/users/{userId}/trust-score")]
public class TrustScoreController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetTrustScore(Guid userId)
    {
        var currentUserId = User.GetUserId();
        
        // Check authorization
        if (!await _authService.CanViewTrustScoreAsync(currentUserId, userId))
        {
            return Forbid();
        }
        
        var trustScore = await _trustScoreService.GetTrustScoreAsync(userId);
        return Ok(trustScore);
    }
}
```

### Authorization Rules

```csharp
public class TrustScoreAuthorizationService
{
    public async Task<bool> CanViewTrustScoreAsync(Guid viewerId, Guid targetUserId)
    {
        // User can view own score
        if (viewerId == targetUserId)
            return true;
        
        // Admin can view any score
        if (await _userService.IsAdminAsync(viewerId))
            return true;
        
        // Host can view renter score for active/pending bookings
        if (await _bookingService.HasActiveBookingBetweenAsync(viewerId, targetUserId))
            return true;
        
        return false;
    }
}
```

## Performance Optimization

### Database Query Optimization

- Use compiled queries for frequent calculations
- Implement database views for complex aggregations
- Add appropriate indexes on foreign keys and date columns
- Use connection pooling for database connections

### Background Job Processing

```csharp
public class TrustScoreRecalculationJob
{
    [AutomaticRetry(Attempts = 3)]
    public async Task RecalculateScoresAsync()
    {
        var usersNeedingRecalculation = await _userRepository
            .GetUsersWithExpiredScoresAsync();
        
        foreach (var userId in usersNeedingRecalculation)
        {
            await _trustScoreService.RecalculateTrustScoreAsync(userId);
        }
    }
}
```

### Rate Limiting

Implement rate limiting on user-initiated recalculation:

```csharp
[RateLimit(Requests = 5, Period = "1h")]
[HttpPost("recalculate")]
public async Task<IActionResult> RecalculateTrustScore(Guid userId)
{
    // Implementation
}
```

## Error Handling

### Exception Handling

```csharp
public class TrustScoreCalculationException : Exception
{
    public Guid UserId { get; }
    public string Component { get; }
    
    public TrustScoreCalculationException(Guid userId, string component, string message)
        : base(message)
    {
        UserId = userId;
        Component = component;
    }
}
```

### Graceful Degradation

If component calculation fails, use default score:

```csharp
try
{
    components.Add(await CalculateVerificationScoreAsync(userId));
}
catch (Exception ex)
{
    _logger.LogError(ex, "Failed to calculate verification score for user {UserId}", userId);
    components.Add(GetDefaultVerificationScore());
}
```

## Testing Requirements

### Unit Tests

- Test each component calculation with various inputs
- Test overall score calculation with different component combinations
- Test authorization rules
- Test caching behavior
- Test rate limiting

### Integration Tests

- Test API endpoints with real database
- Test score recalculation triggers
- Test background job execution
- Test cache invalidation

### Performance Tests

- Load test score calculation with 1000+ concurrent requests
- Measure database query performance
- Test cache hit rates
- Benchmark background job processing

## Technology Stack

- **Framework**: .NET 8+ with C#
- **API**: ASP.NET Core Web API
- **ORM**: Entity Framework Core
- **Database**: MySQL 8.0+
- **Caching**: Redis
- **Background Jobs**: Hangfire
- **Authentication**: JWT with .NET Identity
- **Logging**: Serilog
- **Monitoring**: Application Insights

## Implementation Notes

### Deployment Considerations

- Deploy as separate microservice for scalability
- Use horizontal scaling for high-traffic periods
- Implement circuit breakers for external dependencies
- Monitor calculation performance and optimize slow queries

### Data Privacy

- Anonymize trust scores in analytics
- Comply with GDPR for data export and deletion
- Audit access to trust score data
- Encrypt sensitive component data

### Future Enhancements

- Machine learning model for predictive scoring
- Real-time score updates using WebSockets
- A/B testing framework for algorithm changes
- Cross-platform reputation integration
