# Driver Earnings Translation Tasks

## Page Overview

- Route: `/(dashboard)/driver/earnings`
- Source: app/[locale]/(dashboard)/driver/earnings/

## Translation Status

- [ ] Not started
- [x] In progress
- [x] Completed

## Shared Components

- StatCard.tsx (from dashboard/\_components)

## Component Discovery

- DriverEarningsClient.tsx (main component)
  - Hardcoded strings in JSX:
    - "My Earnings | ARES Driver" (page title)
    - "View your driving earnings and history." (page description)
    - "Earnings Overview" (h1 heading)
    - "Track your income and review your completed trip earnings." (subtitle)
    - "Could not load your earnings data." (error message)
    - "Total Earnings" (stat card title)
    - "Lifetime earnings" (stat card trend label)
    - "This Month" (stat card title)
    - format(new Date(), "MMMM yyyy") (stat card trend label - dynamic)
    - "Completed Trips" (stat card title)
    - "Earnings from finished trips" (stat card trend label)
    - "Recent Earnings History" (h5 heading)
    - "You haven't completed any trips yet." (empty state message)
    - "Date" (table header)
    - "Booking ID" (table header)
    - "Vehicle" (table header)
    - "Earnings" (table header)

## Translation Tasks

- [x] Create type file for driver earnings translations
- [x] Register type in message schema
- [x] Create English translation file
- [x] Create Arabic translation file
- [x] Update root translation files
- [x] Replace hardcoded strings with translation hooks
- [x] Verify translations in UI
