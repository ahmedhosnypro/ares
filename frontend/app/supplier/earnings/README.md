# Supplier Earnings — Module

Supplier portal earnings dashboard. The backend is implemented and
ready; the frontend currently ships **UI scaffolding only** — empty
stat cards, an empty chart frame, and an empty top-vehicles list. No
API wiring yet; the data-binding pass is a separate follow-up.

## Current state

- `page.tsx` — server entrypoint, renders `SupplierEarningsClient`.
- `SupplierEarningsClient.tsx` — client scaffolding: 4 stat cards with
  titles + icons + skeleton values, an empty chart frame
  (`280px` tall) with a dashed border and an explanatory caption, and a
  5-row top-vehicles list with rank chips, thumb placeholders, and
  skeleton text. Every visible value is an em-dash / skeleton — no
  demo data, no `fetch`, no `useEffect`, no `useSession`.
- No connection to the supplier sidebar (`app/supplier/layout.tsx`)
  yet — direct-navigation only via `/supplier/earnings`.

## Module purpose

Give a supplier a single, focused view of their financial performance:
the lifetime total they've earned, how this month compares to last
month, how many completed rentals they've delivered, a monthly trend
chart, and which of their vehicles are pulling the most revenue.

The earnings dashboard is **read-only** and **view-only** — no
adjustments, payouts, withdrawals, or refunds happen on this screen.

## Planned analytics sections

1. **Headline stat cards** (top of page)
   - Total earnings (lifetime)
   - This month's revenue
   - Last month's revenue
   - Completed bookings count

2. **Monthly revenue chart**
   - Bar chart with 12 columns (Jan..Dec) for the selected year.
   - Year selector (defaults to current year).

3. **Top performing vehicles**
   - Vertical list / table of the top 5 vehicles by completed-booking
     earnings.
   - Each row: vehicle image, make/model, total earnings, completed
     bookings count.

## Expected backend endpoints

All three are scoped to the authenticated supplier and require
`role = "Supplier"`. Each is documented inline in the controller
(`SupplierEarningsController`).

### `GET /api/supplier/earnings/stats`

Returns `SupplierEarningsStatsDto`:

```json
{
  "totalEarnings": 184200.0,
  "thisMonthRevenue": 12500.0,
  "lastMonthRevenue": 10300.0,
  "completedBookingsCount": 42
}
```

### `GET /api/supplier/earnings/chart?year=2026`

Returns `MonthlyRevenuePointDto[]` (always 12 entries, in calendar
order). Months without completed bookings come back with `revenue: 0`
so the chart renders a stable axis. The `year` query param defaults to
the current UTC year.

```json
[
  { "month": "Jan", "monthNumber": 1, "year": 2026, "revenue": 12000 },
  { "month": "Feb", "monthNumber": 2, "year": 2026, "revenue":  9500 },
  ...
  { "month": "Dec", "monthNumber": 12, "year": 2026, "revenue":     0 }
]
```

### `GET /api/supplier/earnings/top-vehicles`

Returns `SupplierTopVehicleDto[]` — up to 5 rows, ordered by
`totalEarnings` descending. Vehicles with zero completed bookings are
excluded.

```json
[
  {
    "vehicleId": "…",
    "make": "Toyota",
    "model": "Corolla",
    "imageUrl": "/img/vehicles/abc.jpg",
    "totalEarnings": 48200.0,
    "completedBookingsCount": 17
  }
]
```

## Expected chart types

- **Stat cards** — 4 simple metric cards. No chart library required.
  Show the value, a label, and (for this/last month) an optional delta
  badge computed client-side from the two values.
- **Monthly revenue** — bar chart. Recharts or Chart.js works; the
  payload is already in the shape both libraries expect (array of
  `{ month, revenue }`).
- **Top vehicles** — no chart; ordered list / table. Could later
  add a small horizontal-bar visualisation derived from the same
  payload if helpful.

## Business rules

- **Completed bookings only.** Pending, confirmed, active and
  cancelled bookings never contribute to any earnings figure or chart
  point.
- **Ownership.** Every aggregate is filtered server-side by
  `booking.Vehicle.UserId == currentSupplierId`. There is no way for a
  supplier to surface another supplier's financial numbers, even by
  guessing vehicle ids or year values.
- **Revenue recognition date.** The backend treats a booking's
  `ReturnDate` as its revenue date (with `CreatedAt` as a defensive
  fallback when `ReturnDate` is null). The same rule applies to the
  this-month / last-month split in stats and to the monthly chart, so
  the figures and the chart bars always agree.
- **Currency.** USD across the project — the existing booking
  pricing is denominated in USD and no FX is applied.

## Future scalability plans

- Year selector → already supported by the `year` query param on the
  chart endpoint. Adding a dropdown is purely a frontend change.
- Date-range custom filtering → if needed later, extend the service
  with an additional method accepting `from` / `to`. The existing
  stats / chart methods don't need to change.
- Per-vehicle drill-down → reuse the same aggregation pattern but
  group by additional dimensions (vehicle + month) — keep ownership
  filter intact.
- Export to CSV → would call the same service methods and stream a
  CSV; no schema changes required.

## Security / access rules

- The page must be reachable only by authenticated users with the
  `Supplier` role.
- The backend endpoints all return `401` when the JWT is missing,
  `403` when the role check fails, and `200` with the appropriate
  empty / zero values when the supplier simply has no completed
  bookings yet.
- No mutation endpoints are exposed by the earnings module.
- The frontend MUST NOT pass arbitrary `supplierId` values to the
  backend — the authenticated supplier id is sourced server-side
  from the JWT claim, and any client-supplied id is ignored.

## Required future components

- `SupplierEarningsClient.tsx` — main client component (stat cards,
  chart, top-vehicles list).
- `api-clients/supplier-earnings/supplier-earnings.ts` — typed client
  mirroring `api-clients/supplier-dashboard/supplier-dashboard.ts`.
- Year selector control for the chart endpoint.
- Empty / error / loading states matching the rest of the supplier
  portal.
