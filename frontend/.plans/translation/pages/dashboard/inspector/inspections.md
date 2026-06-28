# Inspector Inspections Translation Tasks

## Page Overview
- Route: `/(dashboard)/inspector/inspections`
- Source: app/[locale]/(dashboard)/inspector/inspections/

## Translation Status
- [ ] Not started
- [x] In progress
- [ ] Completed

## Shared Components
- `InspectionStatusBadge.tsx` – Status chip (Pending/Approved/Rejected)
- `TodayTaskCard.tsx` – Individual task card with type label, actions
- `TodayTasksList.tsx` – Filtered list with filter tabs, search, empty state

## Component Discovery

### `inspector/page.tsx` (Inspector Dashboard – serves as inspections landing page)
- "Check-Outs", "Deliveries today"
- "Check-Ins", "Returns today"
- "Overdue Tasks", "Past due"
- "Completed Today", "Done today"
- "Inspector Dashboard"
- "Overview of your assignments and today's metrics."
- "Today's Tasks"
- "Tap a card to open the inspection form · Use the action buttons to call or navigate."

### `inspector/_components/InspectionStatusBadge.tsx`
- "Pending", "Approved", "Rejected"

### `inspector/_components/TodayTaskCard.tsx`
- "Check-Out 🟢", "Check-In 🔴"
- Tooltip: "Call {customerName}", "Open in Google Maps"
- aria-label: "Call {customerName}", "Open location in Google Maps"

### `inspector/_components/TodayTasksList.tsx`
- "All", "Check-Outs 🟢", "Check-Ins 🔴"
- placeholder: "Search by plate number…"
- aria-label: "Search by plate number"
- EmptyState: "No matching tasks", "Try adjusting the filter or search term."
- EmptyState: "All caught up!", "You have no pending tasks for today."

## Translation Tasks
- [x] Create type file (`shared/messages/types/dashboard/inspector/inspections.ts`)
- [x] Register type in message schema (`message.ts` – DashboardSchema)
- [x] Create English translation file (`shared/messages/en/dashboard/inspector/inspections.ts`)
- [x] Create Arabic translation file (`shared/messages/ar/dashboard/inspector/inspections.ts`)
- [x] Update root translation files (`en.ts`, `ar.ts`)
- [ ] Replace hardcoded strings with translation hooks
- [ ] Verify translations in UI
