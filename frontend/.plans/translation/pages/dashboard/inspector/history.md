# Inspector History Page Translation Tasks

## Page Overview

- Route: /(dashboard)/inspector/history
- Source: app/[locale]/(dashboard)/inspector/history/page.tsx

## Translation Status

- [ ] Not started
- [x] In progress
- [ ] Completed

## Shared Components

- `_components/InspectionStatusBadge.tsx` (at inspector level)

## Component Discovery

### page.tsx

- Title: "Inspection History"
- Description: "View all your submitted inspections."
- Search placeholder: "Search by Booking Number, Vehicle, or Status..."
- Filter label: "Status"
- Filter options: "All Statuses", "Approved", "Rejected", "Pending"
- Empty search title: "No results found"
- Empty search description: "Try adjusting your search query or status filter."
- Empty state title: "No history yet"
- Empty state description: "Submitted inspections will appear here."
- Mobile card: "Photos: {count}", "Submitted: {date}", "—", "View Report"
- Table headers: "Booking", "Vehicle", "Submitted At", "Photos", "Status", "Action"
- Table action: "View Details"

### InspectionStatusBadge.tsx

- Status labels: "Pending", "Approved", "Rejected"

## Translation Tasks

- [x] Create type file for Inspector History translations
- [x] Register type in message schema
- [x] Create English translation file
- [x] Create Arabic translation file
- [x] Update root translation files
- [x] Replace hardcoded strings with translation hooks
- [ ] Verify translations in UI
