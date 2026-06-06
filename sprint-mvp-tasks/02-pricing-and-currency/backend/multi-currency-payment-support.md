# Feature: Multi-Currency Payment Support

## Overview

Backend implementation for multi-currency payment processing with automatic currency detection, real-time exchange rates, and settlement in platform base currency.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-007

## Backend Specifications

### API Endpoints

All endpoints defined in frontend specification.

### Business Logic

**Currency Detection Service**:
- Integrate IP geolocation service (MaxMind, IPStack)
- Map IP address to country code
- Map country to default currency
- Check user profile for saved preference
- Return suggested currency with confidence
- Cache geolocation results (24-hour TTL)

**Exchange Rate Management**:
- Fetch rates from payment gateway APIs
- Cache rates with 5-minute expiration
- Fallback to backup rate provider if gateway unavailable
- Store historical rates for reporting
- Monitor rate volatility
- Alert on significant rate changes (>5% in 1 hour)

**Currency Conversion**:
- Validate currency codes (ISO 4217)
- Fetch current exchange rate
- Calculate converted amount
- Round according to currency rules
- Return conversion details
- Log conversion for audit

**Payment Processing**:
- Accept payment in customer currency
- Store customer amount and currency
- Gateway converts to base currency
- Store settlement amount and rate
- Track conversion fees
- Reconcile with gateway settlements

**Multi-Currency Reporting**:
- Generate reports in base currency
- Support multi-currency transaction views
- Calculate revenue by currency
- Track conversion costs
- Monitor currency distribution

### Authentication Requirements

- Optional auth for currency detection
- JWT auth for preference saving
- No auth for exchange rates
- Rate limiting on conversion API

## Database Specifications

### Schema Changes

Add currency preferences, exchange rate cache, and multi-currency tracking.

### Table Definitions

**UserCurrencyPreferences**:
```
CREATE TABLE UserCurrencyPreferences (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    UserId INT NOT NULL UNIQUE,
    CurrencyCode VARCHAR(3) NOT NULL,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_currency_prefs_user 
        FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    INDEX idx_user_id (UserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**ExchangeRateCache**:
```
CREATE TABLE ExchangeRateCache (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BaseCurrency VARCHAR(3) NOT NULL,
    TargetCurrency VARCHAR(3) NOT NULL,
    Rate DECIMAL(12,6) NOT NULL,
    Source VARCHAR(50) NOT NULL COMMENT 'stripe, paypal, or backup provider',
    CachedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME NOT NULL,
    UNIQUE INDEX idx_currency_pair (BaseCurrency, TargetCurrency),
    INDEX idx_expires_at (ExpiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**PaymentCurrencyTracking** (extend existing payment tables):
```
ALTER TABLE StripePaymentIntents ADD COLUMN CustomerCurrency VARCHAR(3);
ALTER TABLE StripePaymentIntents ADD COLUMN CustomerAmount DECIMAL(10,2);
ALTER TABLE StripePaymentIntents ADD COLUMN SettlementCurrency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE StripePaymentIntents ADD COLUMN SettlementAmount DECIMAL(10,2);
ALTER TABLE StripePaymentIntents ADD COLUMN ExchangeRate DECIMAL(12,6);

ALTER TABLE PayPalCaptures ADD COLUMN CustomerCurrency VARCHAR(3);
ALTER TABLE PayPalCaptures ADD COLUMN CustomerAmount DECIMAL(10,2);
ALTER TABLE PayPalCaptures ADD COLUMN SettlementCurrency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE PayPalCaptures ADD COLUMN SettlementAmount DECIMAL(10,2);
ALTER TABLE PayPalCaptures ADD COLUMN ExchangeRate DECIMAL(12,6);
```

### Relationships

- UserCurrencyPreferences → Users (one-to-one)
- ExchangeRateCache - standalone cache

### Indexes

- UNIQUE INDEX idx_user_id ON UserCurrencyPreferences(UserId)
- UNIQUE INDEX idx_currency_pair ON ExchangeRateCache(BaseCurrency, TargetCurrency)
- INDEX idx_expires_at ON ExchangeRateCache(ExpiresAt)

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+

## Implementation Notes

- Support minimum 10 major currencies (USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, SGD, HKD)
- Integrate IP geolocation service for detection
- Fetch real-time rates from payment gateways
- Cache rates with 5-minute TTL
- Implement rate cache cleanup job (hourly)
- Allow manual currency selection
- Store both customer and settlement amounts
- Track exchange rates used
- Settle all payments in USD (or configured base currency)
- Handle currency conversion fees
- Support currency-specific payment methods
- Implement currency preference persistence
- Monitor exchange rate volatility
- Alert on significant rate changes
- Generate multi-currency financial reports
- Reconcile with gateway settlements
- Handle currency rounding per ISO 4217
- Use proper decimal places (2 for USD, 0 for JPY)
- Implement fallback rate provider
- Track currency usage analytics
