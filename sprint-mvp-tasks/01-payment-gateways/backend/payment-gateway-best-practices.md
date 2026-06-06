# Feature: Payment Gateway Integration Best Practices

## Overview

Implementation of payment gateway integration best practices including idempotency, webhook reliability, error handling, retry logic, and monitoring to ensure robust and maintainable payment processing.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-005

## User Stories

As a backend developer, I want to implement idempotency for payment requests, so that duplicate payments are prevented.

As a system, I want reliable webhook processing with retry logic, so that payment status updates are never missed.

As a platform operator, I want comprehensive error handling and monitoring, so that payment issues are detected and resolved quickly.

## Backend Specifications

### API Endpoints

**GET /api/payments/health**
- Purpose: Check payment gateway health status
- Authentication: Required (JWT, Admin role)
- Response: Gateway status, response times, error rates

**POST /api/payments/retry-failed-webhooks**
- Purpose: Manually retry failed webhook processing
- Authentication: Required (JWT, Admin role)
- Request body: webhookEventIds (array)
- Response: Retry results

**GET /api/payments/metrics**
- Purpose: Retrieve payment processing metrics
- Authentication: Required (JWT, Admin role)
- Query params: startDate, endDate, gateway
- Response: Success rates, error rates, response times

### Request Schemas

**RetryWebhooksRequest**:
- webhookEventIds: array of strings (required)
- force: boolean (optional) - Force retry even if previously succeeded

### Response Schemas

**HealthResponse**:
- gateways: array of gateway health status
  - name: string (stripe, paypal)
  - status: string (healthy, degraded, down)
  - responseTime: int (milliseconds)
  - errorRate: decimal (percentage)
  - lastChecked: datetime

**MetricsResponse**:
- totalTransactions: int
- successfulTransactions: int
- failedTransactions: int
- successRate: decimal
- averageResponseTime: int
- errorBreakdown: object with error codes and counts

### Business Logic

**Idempotency Implementation**:
- Generate idempotency key using booking ID + timestamp + random suffix
- Store idempotency key with payment intent/order
- Check for existing payment with same idempotency key before creating new one
- Return existing payment if idempotency key matches
- Implement idempotency key expiration (24 hours)
- Use database unique constraint to enforce idempotency

**Webhook Reliability**:
- Verify webhook signatures before processing
- Check for duplicate events using event ID
- Store all webhook events in database
- Process webhooks idempotently (safe to replay)
- Implement webhook retry logic with exponential backoff
- Poll payment status as backup if webhook not received within 30 seconds
- Handle out-of-order webhook delivery
- Log all webhook processing attempts

**Error Handling**:
- Catch all payment gateway exceptions
- Map gateway error codes to user-friendly messages
- Log errors with full context (booking ID, user ID, gateway, error code)
- Implement retry logic for transient errors (network, timeout)
- Provide fallback payment options on gateway failure
- Display generic error messages to users (no sensitive details)
- Alert operations team for critical payment failures

**Retry Logic**:
- Implement exponential backoff (1s, 2s, 4s, 8s, 16s)
- Maximum 5 retry attempts for API calls
- Retry only on transient errors (network, timeout, 5xx)
- Do not retry on permanent errors (invalid card, insufficient funds)
- Implement circuit breaker pattern for gateway failures
- Open circuit after 10 consecutive failures
- Half-open circuit after 60 seconds
- Close circuit after 3 successful requests

**Monitoring**:
- Track payment success rates by gateway
- Monitor payment API response times
- Alert on error rate spikes (>5% in 5 minutes)
- Track webhook delivery success rates
- Monitor payment processing latency
- Dashboard for real-time payment metrics
- Daily summary reports for operations team

**Testing Strategy**:
- Use gateway sandbox environments for development
- Test success, failure, and timeout scenarios
- Test webhook handling with replay
- Test idempotency with duplicate requests
- Test retry logic with simulated failures
- Test circuit breaker behavior
- Load test payment endpoints
- Test payment flows end-to-end

### Authentication Requirements

- JWT authentication for all endpoints
- Admin role for health and metrics endpoints
- Internal service authentication for audit logging
- Webhook signature verification for all gateways
- Rate limiting on all payment endpoints
- IP whitelisting for webhook endpoints

## Database Specifications

### Schema Changes

Add tables for idempotency tracking, webhook retry tracking, and payment metrics.

### Table Definitions

**PaymentIdempotencyKeys** (new table):
- Id: INT PRIMARY KEY AUTO_INCREMENT
- IdempotencyKey: VARCHAR(255) NOT NULL UNIQUE
- Gateway: ENUM('stripe', 'paypal') NOT NULL
- PaymentId: VARCHAR(255) NOT NULL
- BookingId: INT NOT NULL
- CreatedAt: DATETIME NOT NULL
- ExpiresAt: DATETIME NOT NULL
- INDEX idx_idempotency_key (IdempotencyKey)
- INDEX idx_expires_at (ExpiresAt)

**WebhookRetryLog** (new table):
- Id: INT PRIMARY KEY AUTO_INCREMENT
- WebhookEventId: VARCHAR(255) NOT NULL
- Gateway: ENUM('stripe', 'paypal') NOT NULL
- AttemptNumber: INT NOT NULL
- AttemptedAt: DATETIME NOT NULL
- Status: ENUM('success', 'failure') NOT NULL
- ErrorMessage: TEXT
- NextRetryAt: DATETIME
- INDEX idx_webhook_event_id (WebhookEventId)
- INDEX idx_next_retry_at (NextRetryAt)

**PaymentMetrics** (new table):
- Id: INT PRIMARY KEY AUTO_INCREMENT
- Gateway: ENUM('stripe', 'paypal') NOT NULL
- MetricDate: DATE NOT NULL
- TotalTransactions: INT NOT NULL DEFAULT 0
- SuccessfulTransactions: INT NOT NULL DEFAULT 0
- FailedTransactions: INT NOT NULL DEFAULT 0
- AverageResponseTime: INT NOT NULL DEFAULT 0
- ErrorBreakdown: JSON
- CreatedAt: DATETIME NOT NULL
- UNIQUE INDEX idx_gateway_date (Gateway, MetricDate)

### Relationships

- PaymentIdempotencyKeys.BookingId → Bookings.Id (many-to-one)
- WebhookRetryLog.WebhookEventId → StripeWebhookEvents.EventId or PayPalWebhookEvents.EventId
- PaymentMetrics - standalone aggregation table

### Indexes

**PaymentIdempotencyKeys**:
- UNIQUE INDEX idx_idempotency_key (IdempotencyKey) - Fast duplicate detection
- INDEX idx_expires_at (ExpiresAt) - Cleanup job
- INDEX idx_booking_id (BookingId) - Booking payment lookup

**WebhookRetryLog**:
- INDEX idx_webhook_event_id (WebhookEventId) - Retry history lookup
- INDEX idx_next_retry_at (NextRetryAt) - Retry job queries
- INDEX idx_gateway (Gateway) - Gateway-specific queries

**PaymentMetrics**:
- UNIQUE INDEX idx_gateway_date (Gateway, MetricDate) - Daily metrics per gateway
- INDEX idx_metric_date (MetricDate) - Time-series queries

## Technology Stack

- Database: MySQL 8.0+
- Backend: .NET 8+ with Entity Framework Core
- Monitoring: Application Insights or Prometheus

## Implementation Notes

- Implement idempotency key cleanup job (daily, remove keys older than 24 hours)
- Implement webhook retry job (runs every minute, processes failed webhooks)
- Implement metrics aggregation job (daily, calculates payment statistics)
- Use unique constraints on idempotency keys
- Store webhook retry attempts for debugging
- Calculate exponential backoff for retry scheduling
- Monitor webhook retry queue depth
- Alert on high retry rates
- Implement circuit breaker state in cache (Redis)
- Track payment gateway health in real-time
- Generate daily payment processing reports
- Monitor error rate trends
- Implement automatic failover to backup gateway if available
- Use database transactions for payment operations
- Implement optimistic locking for concurrent payment updates
- Archive old idempotency keys and retry logs
- Set up database indexes for performance
- Monitor query performance on payment tables
- Implement connection pooling for payment gateway APIs
- Use async/await for all payment API calls
