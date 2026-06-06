# Pricing Engine & Currency Implementation Plan

## Associated Documentation
Please refer to the detailed specification documents copied in this directory for exact requirements:
- [Backend Specs](./backend)
- [Frontend Specs](./frontend)
- [Database Specs](./database)

## Current State (Gap Analysis)
Pricing logic is currently basic. We do not have a robust rule engine that handles date-based seasonal premiums, holiday surges, or advanced multi-duration volume discounts (e.g., weekly vs. daily rates). Furthermore, the application hardcodes "USD" globally. There is no automatic currency detection, live exchange rate conversions, or user currency toggles.

## Implementation Steps

### Backend Tasks (.NET 8)
1. **Pricing Rule Engine:** Build a new `PricingEngineService` that evaluates date ranges against a `SeasonalRates` table (to be created) and calculates final prices dynamically.
2. **Multi-Duration Calculator:** Implement logic to determine if a rental length qualifies for hourly, daily, or weekly volume discounts.
3. **Currency Conversion Service:** Integrate a third-party exchange rate API (e.g., Fixer.io, OpenExchangeRates). Cache rates daily in Redis/Memory to avoid API limits.
4. **Database Models:** 
   - Add tables: `SeasonalRules`, `HolidayPremiums`.
   - Update `Vehicles` to store base rate variations.
   - Update `Bookings` to store the *exchange rate at time of booking* alongside the `Currency`.

### Frontend Tasks (Next.js)
1. **Currency Toggle UI:** Add a currency selector in the global header (e.g., USD, EUR, GBP). Save user preference in a cookie/local storage.
2. **Dynamic Price Formatting:** Ensure all vehicle cards, detail pages, and checkout summaries format prices using the selected currency via the backend's conversion factors.
3. **Pricing Breakdown Component:** On the checkout page, clearly display a line-item breakdown of how the price was calculated (e.g., "Base Rate", "Holiday Premium (+10%)", "Weekly Discount (-5%)").
4. **Admin Rate Management:** Create admin dashboard interfaces to manage seasonal pricing rules, define holiday dates, and set discount thresholds.
