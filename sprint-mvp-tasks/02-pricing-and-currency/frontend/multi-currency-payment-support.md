# Feature: Multi-Currency Payment Support

## Overview

Multi-currency payment processing enabling international customers to pay in their local currency with automatic detection, manual selection, and real-time exchange rates from payment gateways.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-007

## User Stories

As an international customer, I want to pay in my local currency, so that I understand the exact cost without manual conversion.

As a customer, I want to see real-time exchange rates, so that I know the conversion is fair and transparent.

As a platform operator, I want to settle all payments in base currency, so that financial reporting is simplified.

## Frontend Specifications

### Pages

- Checkout page with currency selector
- Pricing display in selected currency
- Currency conversion details page
- Multi-currency payment history

### UI Components

- Currency selector dropdown with flags
- Automatic currency detection indicator
- Exchange rate display
- Price display in selected currency
- Currency conversion tooltip
- Multi-currency price comparison
- Currency preference settings

### User Flows

1. Customer lands on platform
2. System detects location via IP geolocation
3. System suggests local currency
4. Customer can accept or manually select different currency
5. All prices display in selected currency
6. Customer proceeds to checkout
7. System shows final amount with exchange rate
8. Customer completes payment in selected currency
9. Gateway handles conversion and settlement
10. Confirmation displays amount in customer's currency

### Data Requirements

- Customer location from IP geolocation
- Supported currencies list
- Real-time exchange rates from gateway
- Currency preferences from user profile
- Payment gateway currency support
- Settlement currency configuration

## Backend Specifications

### API Endpoints

**GET /api/payments/currencies/supported**
- Purpose: Retrieve list of supported currencies
- Authentication: Optional
- Response: Array of currency codes with names and symbols

**GET /api/payments/currencies/detect**
- Purpose: Detect customer currency based on location
- Authentication: Optional
- Query params: ipAddress
- Response: Suggested currency code

**POST /api/payments/currencies/convert**
- Purpose: Convert amount between currencies
- Authentication: Optional
- Request body: amount, fromCurrency, toCurrency
- Response: Converted amount, exchange rate, timestamp

**GET /api/payments/currencies/exchange-rates**
- Purpose: Retrieve current exchange rates
- Authentication: Optional
- Query params: baseCurrency
- Response: Exchange rates for all supported currencies

**POST /api/payments/currencies/set-preference**
- Purpose: Save user currency preference
- Authentication: Required (JWT)
- Request body: currencyCode
- Response: Confirmation

### Request Schemas

**ConvertCurrencyRequest**:
- amount: decimal (required)
- fromCurrency: string (required) - ISO currency code
- toCurrency: string (required) - ISO currency code

**SetCurrencyPreferenceRequest**:
- currencyCode: string (required)
- applyToExistingBookings: boolean (optional)

### Response Schemas

**SupportedCurrenciesResponse**:
- currencies: array
  - code: string (USD, EUR, GBP, etc.)
  - name: string (US Dollar, Euro, etc.)
  - symbol: string ($, €, £, etc.)
  - flag: string (emoji or icon URL)

**CurrencyDetectionResponse**:
- suggestedCurrency: string
- detectedCountry: string
- confidence: decimal

**ConversionResponse**:
- originalAmount: decimal
- originalCurrency: string
- convertedAmount: decimal
- convertedCurrency: string
- exchangeRate: decimal
- timestamp: datetime
- source: string (gateway name)

**ExchangeRatesResponse**:
- baseCurrency: string
- rates: object (currency code to rate mapping)
- timestamp: datetime
- source: string

### Business Logic

**Currency Detection**:
- Use IP geolocation to detect country
- Map country to default currency
- Check user profile for saved preference
- Return suggested currency with confidence score
- Allow manual override

**Currency Conversion**:
- Fetch real-time rates from payment gateway
- Calculate converted amount
- Round to 2 decimal places
- Cache exchange rates (5-minute TTL)
- Display conversion details transparently

**Payment Processing**:
- Accept payment in customer's selected currency
- Gateway handles conversion to base currency
- Store both customer and settlement amounts
- Track exchange rate used
- Settlement in platform base currency (USD)

**Supported Currencies**:
- Major currencies: USD, EUR, GBP, JPY, AUD, CAD, CHF
- Regional currencies: CNY, SGD, HKD, INR, MXN, BRL
- Minimum 10 currencies supported
- Add currencies based on market demand

**Currency-Specific Features**:
- Support regional payment methods (Alipay for CNY)
- Handle currency-specific formatting
- Display appropriate decimal places
- Use correct currency symbols

### Authentication Requirements

- Optional authentication for currency detection
- JWT authentication for preference saving
- No authentication required for exchange rates
- Rate limiting on conversion API (100 per minute per IP)

## Database Specifications

### Schema Changes

Add currency preferences and exchange rate cache tables.

### Table Definitions

**UserCurrencyPreferences** (new table):
- Id: INT PRIMARY KEY AUTO_INCREMENT
- UserId: INT NOT NULL UNIQUE
- CurrencyCode: VARCHAR(3) NOT NULL
- UpdatedAt: DATETIME NOT NULL
- CONSTRAINT fk_currency_prefs_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE

**ExchangeRateCache** (new table):
- Id: INT PRIMARY KEY AUTO_INCREMENT
- BaseCurrency: VARCHAR(3) NOT NULL
- TargetCurrency: VARCHAR(3) NOT NULL
- Rate: DECIMAL(12,6) NOT NULL
- Source: VARCHAR(50) NOT NULL
- CachedAt: DATETIME NOT NULL
- ExpiresAt: DATETIME NOT NULL
- UNIQUE INDEX idx_currency_pair (BaseCurrency, TargetCurrency)

**PaymentCurrencyTracking** (add columns to existing payment tables):
- CustomerCurrency: VARCHAR(3) - Currency customer paid in
- CustomerAmount: DECIMAL(10,2) - Amount in customer currency
- SettlementCurrency: VARCHAR(3) - Platform base currency
- SettlementAmount: DECIMAL(10,2) - Amount in base currency
- ExchangeRate: DECIMAL(12,6) - Rate used for conversion

### Relationships

- UserCurrencyPreferences → Users (one-to-one)
- ExchangeRateCache - standalone cache table

### Indexes

- UNIQUE INDEX idx_user_id ON UserCurrencyPreferences(UserId)
- UNIQUE INDEX idx_currency_pair ON ExchangeRateCache(BaseCurrency, TargetCurrency)
- INDEX idx_expires_at ON ExchangeRateCache(ExpiresAt)

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript

## Implementation Notes

- Support minimum 10 major currencies
- Detect location via IP geolocation service
- Fetch real-time rates from payment gateway
- Cache exchange rates (5-minute TTL)
- Allow manual currency selection
- Display prices in selected currency throughout
- Use gateway for currency conversion
- Settle in platform base currency
- Display exchange rate and conversion details
- Handle currency conversion fees transparently
- Support currency-specific payment methods
- Implement currency preference persistence
- Clean up expired exchange rate cache daily
- Monitor exchange rate volatility
- Alert on significant rate changes
- Track currency usage analytics
- Generate multi-currency financial reports
- Handle currency rounding appropriately
- Display correct decimal places per currency
- Use proper currency symbols and formatting
