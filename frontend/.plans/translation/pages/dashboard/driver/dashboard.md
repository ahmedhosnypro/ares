# Driver Dashboard Translation Tasks

## Page Overview

- Route: `/(dashboard)/driver/dashboard`
- Source: app/[locale]/(dashboard)/driver/dashboard/

## Translation Status

- [ ] Not started
- [x] In progress
- [x] Completed

## Shared Components

- DriverAvailabilityToggle.tsx (from driver/\_components)

## Component Discovery

- DriverDashboardClient.tsx (main component)
  - Hardcoded strings in JSX:
    - "Historical Payout Logs" (tab heading)

- \_components/DashboardHeader.tsx
  - Hardcoded strings in JSX:
    - "Welcome back, {userName || "Chauffeur"}!" (welcome message)
    - "ARES Premium Chauffeur Portal • Shift Active and monitored." (portal description)

- \_components/KpiMetricsGrid.tsx
  - Hardcoded strings in JSX:
    - "Overview Metrics" (section heading)
    - "Earnings" (metric label)
    - "Trips Done" (metric label)
    - "Scheduled" (metric label)
    - "Rating" (metric label)

- \_components/ActiveAssignmentCard.tsx
  - Hardcoded strings in JSX:
    - "Active Rental Assignment" (card header)
    - "In Progress" (status chip)
    - "Assigned Client" (section heading)
    - "Premium Customer" (customer type chip)
    - "Call Client" (tooltip)
    - "WhatsApp Client" (tooltip)
    - "Journey Path" (section heading)
    - "Pickup address" (location label)
    - "Drop-off destination" (location label)
    - "Assigned Fleet Vehicle" (section heading)
    - "Luxury Sedan Class" (vehicle class)
    - "Rental Schedule & Guidelines" (section heading)
    - "Active Duration" (duration label)
    - "Ensure vehicle cabin remains clean and client amenities are stocked." (guideline)
    - "Verify route schedule and adjust for traffic before picking up client." (guideline)
    - "Report any delays or telemetry issues immediately via dispatch." (guideline)

- \_components/UpcomingSchedule.tsx
  - Hardcoded strings in JSX:
    - "Calendar & Shift Schedule" (card header)
    - "CalendarIcon" (icon label)

- \_components/PayoutLogsTable.tsx
  - Hardcoded strings in JSX:
    - "Trip ID" (table header)
    - "Date Completed" (table header)
    - "Client" (table header)
    - "Vehicle" (table header)
    - "Duration" (table header)
    - "Earnings" (table header)
    - "Payout Status" (table header)
    - "Paid" (status chip - this may already be translated)

## Translation Tasks

- [x] Create type file for driver dashboard translations
- [x] Register type in message schema
- [x] Create English translation file
- [x] Create Arabic translation file
- [x] Update root translation files
- [x] Replace hardcoded strings with translation hooks
- [x] Verify translations in UI
