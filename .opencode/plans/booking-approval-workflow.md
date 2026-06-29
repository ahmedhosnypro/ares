# Booking Approval Workflow

## Objective

New customer bookings must be approved by an admin before they become `Confirmed`. After payment is captured, the booking enters `PendingApproval` status. Admin-created bookings skip approval and go straight to `Confirmed`.

## Decisions

| Decision | Choice |
|---|---|
| Admin-created bookings | Auto-approved (skip approval) |
| Approval timing | After payment capture (replaces `Confirmed` as the post-payment status) |
| Notifications | In-app + email to customer on approve/reject |
| Rejection | Booking cancelled + payment refunded |

---

## Implementation Plan

### Phase 1: Backend — Enum & Entity Changes

#### 1.1 Add `PendingApproval` to `BookingStatus` enum

**File:** `backend/Domain/Entities/Enums/BookingEnums.cs`

- Add `PendingApproval` between `PaymentPending` and `Confirmed`
- Add `Rejected` as a terminal status (distinct from `Cancelled`/`CancelledByAdmin` — signals admin rejection of the booking itself)

Updated enum:
```
Draft, PaymentPending, PendingApproval, Confirmed, Active, Completed, Cancelled, CancelledByAdmin, Expired, Rejected
```

#### 1.2 Add approval tracking fields to Booking entity

**File:** `backend/Domain/Entities/Booking.cs`

- Add `ApprovedBy` (`Guid?`) — admin who approved
- Add `ApprovedAt` (`DateTime?`) — timestamp of approval
- Add `RejectionReason` (`string?`) — reason if rejected

#### 1.3 EF Core configuration for new fields

**File:** `backend/Infrastructure/Data/Configurations/BookingConfiguration.cs`

- Configure `ApprovedBy` as optional `Guid`
- Configure `ApprovedAt` as optional `DateTime2`
- Configure `RejectionReason` as optional `nvarchar(max)`

#### 1.4 EF Core migration

- Generate a migration adding the 3 new columns and the new enum value

---

### Phase 2: Backend — Status Transition Policy

#### 2.1 Update status transition map

**File:** `backend/Application/Services/BookingService.cs` (~line 1092)

Modify `ValidateBookingStatusTransition`:

```
Draft           -> PaymentPending, Cancelled
PaymentPending  -> PendingApproval, Cancelled, Expired
PendingApproval -> Confirmed, Rejected, CancelledByAdmin
Confirmed       -> Active, Cancelled
Active          -> Completed, Cancelled
Completed       -> (terminal)
Cancelled       -> (terminal)
CancelledByAdmin-> (terminal)
Expired         -> (terminal)
Rejected        -> (terminal)
```

#### 2.2 Update `BookingStatusPolicy.cs`

**File:** `backend/Domain/Entities/Enums/BookingStatusPolicy.cs`

- Add `PendingApproval` to `ReservingStatuses` (vehicle remains reserved while awaiting approval)
- `PendingApproval` should NOT be in `ResumableStatuses` (customer can't resume — it's awaiting admin action)

---

### Phase 3: Backend — Modify Creation & Checkout Flows

#### 3.1 Checkout staged flow — `ConfirmAsync`

**File:** `backend/Application/Services/CheckoutService.cs` (~line 557)

- After payment capture, set status to `PendingApproval` instead of `Confirmed`
- The vehicle remains reserved (held) in this status

#### 3.2 Checkout express flow — `CheckoutAsync`

**File:** `backend/Application/Services/CheckoutService.cs` (~line 292)

- Set status to `PendingApproval` instead of `Confirmed`

#### 3.3 Admin create-on-behalf — `CreateBookingAsync`

**File:** `backend/Application/Services/BookingService.cs` (~line 212)

- **No change**: admin-created bookings remain `Confirmed` (cash) or `PaymentPending` -> `Confirmed` (online)
- This is the auto-approved pathway

---

### Phase 4: Backend — Approval & Rejection Endpoints

#### 4.1 New controller: `AdminBookingsController` additions

**File:** `backend/Api/Controllers/BookingsController.cs` or a new dedicated admin controller

Following the existing pattern from `AdminVerificationsController` and `AdminDriversController`:

```
PATCH /api/admin/bookings-approvals/{id}/approve   -> ApproveBookingAsync
PATCH /api/admin/bookings-approvals/{id}/reject    -> RejectBookingAsync
```

Both endpoints:
- `[Authorize(Roles = "Admin")]`
- Guard: booking must be in `PendingApproval` status (throw `ConflictException` otherwise)
- Set `ApprovedBy`/`ApprovedAt` on approve, `RejectionReason` on reject

#### 4.2 ApproveBookingAsync service method

**File:** `backend/Application/Services/BookingService.cs`

1. Load booking by ID (include vehicle, customer)
2. Guard: `booking.Status == PendingApproval` (else `ConflictException`)
3. Set `Status = Confirmed`, `ApprovedBy = adminId`, `ApprovedAt = DateTime.UtcNow`
4. Save changes
5. Best-effort in-app notification to customer
6. Email notification to customer (booking approved)

#### 4.3 RejectBookingAsync service method

**File:** `backend/Application/Services/BookingService.cs`

1. Load booking by ID (include payment)
2. Guard: `booking.Status == PendingApproval` (else `ConflictException`)
3. Set `Status = Rejected`, `RejectionReason = reason`
4. If payment was captured, initiate refund
5. Release the vehicle reservation
6. Release the assigned driver (if any)
7. Save changes
8. Best-effort in-app notification to customer
9. Email notification to customer (booking rejected, refund info)

#### 4.4 Search/list pending approvals

**File:** `backend/Application/Services/BookingService.cs`

- Add `GetPendingApprovalsAsync` method (paginated, filterable)
- Or: ensure existing `SearchBookingsAsync` supports filtering by `PendingApproval` status

---

### Phase 5: Backend — Background Service Updates

#### 5.1 Update `BookingStatusUpdateService`

**File:** `backend/Infrastructure/Services/BookingStatusUpdateService.cs`

- `PendingApproval` bookings should NOT auto-transition to Active (they're not yet Confirmed)
- Add auto-expiry: if a `PendingApproval` booking has been waiting longer than a configurable threshold (e.g., 24h), auto-cancel and refund (prevent indefinite holds on vehicles)
- Add to the periodic scan:
  - `PendingApproval` where `HoldExpiresAt` passed -> `Expired` + refund + release vehicle

---

### Phase 6: Backend — Unit & Property Tests

#### 6.1 Update `BookingServiceTests.cs`

**File:** `backend/Tests/UnitTests/BookingServiceTests.cs`

- Add test: `ApproveBookingAsync_Valid_SetsConfirmedAndApprovedBy`
- Add test: `ApproveBookingAsync_NotPendingApproval_ThrowsConflict`
- Add test: `ApproveBookingAsync_NotFound_ThrowsNotFound`
- Add test: `RejectBookingAsync_Valid_SetsRejectedAndReason`
- Add test: `RejectBookingAsync_NotPendingApproval_ThrowsConflict`
- Add test: `RejectBookingAsync_WithPayment_InitiatesRefund`
- Add test: `CreateBookingAsync_AdminCreate_SkipsApproval`
- Update existing: `CreateBookingAsync` customer path now returns `PendingApproval`

#### 6.2 Update `CheckoutServiceTests.cs`

**File:** `backend/Tests/UnitTests/CheckoutServiceTests.cs`

- Update: `ConfirmAsync` now sets `PendingApproval` instead of `Confirmed`
- Add test: express checkout sets `PendingApproval`

#### 6.3 Update `BookingCreationPropertyTests.cs`

**File:** `backend/Tests/PropertyTests/BookingCreationPropertyTests.cs`

- Property test: customer bookings always start at `PendingApproval` after payment
- Property test: admin bookings always start at `Confirmed`

#### 6.4 Update `BookingManagementPropertyTests.cs`

**File:** `backend/Tests/PropertyTests/BookingManagementPropertyTests.cs`

- Property test: `PendingApproval` status transitions only allow `Confirmed`, `Rejected`, `CancelledByAdmin`
- Property test: no path from `Rejected` to any other status

---

### Phase 7: Backend — Request/Response DTOs

#### 7.1 New request DTOs

**File:** `backend/Application/DTOs/Booking/` (or alongside existing DTOs)

- `ApproveBookingRequest` — empty (no body needed, admin ID from auth)
- `RejectBookingRequest` — `Reason` (required string, max 500 chars)

#### 7.2 Update response DTOs

- `BookingResponse` — add `ApprovedBy`, `ApprovedAt`, `RejectionReason` fields
- Admin booking list response — include `PendingApproval` in status filter options

---

### Phase 8: Database Migration

#### 8.1 Generate and verify migration

```bash
cd backend
dotnet ef migrations add AddBookingApprovalFields
```

- Columns: `ApprovedBy (uniqueidentifier null)`, `ApprovedAt (datetime2 null)`, `RejectionReason (nvarchar(max) null)`
- Data migration: no existing data changes needed (no bookings currently in `PendingApproval`)

---

### Phase 9: Frontend — API Client

#### 9.1 Update booking types and hooks

**File:** `frontend/api-clients/bookings/bookings.ts`

- Add `PendingApproval` and `Rejected` to the booking status type
- Add `approvedBy`, `approvedAt`, `rejectionReason` to the `Booking` interface
- Add API functions:
  - `approveBooking(id: string)` — `PATCH /api/admin/bookings-approvals/{id}/approve`
  - `rejectBooking(id: string, reason: string)` — `PATCH /api/admin/bookings-approvals/{id}/reject`

---

### Phase 10: Frontend — Admin Approval UI

#### 10.1 Admin bookings list — pending approval tab

**File:** `frontend/app/[locale]/(dashboard)/admin/bookings/_components/BookingsFilterBar.tsx`

- Add `PendingApproval` to status filter options

**File:** `frontend/app/[locale]/(dashboard)/admin/bookings/_components/BookingsClient.tsx`

- Add a dedicated "Pending Approval" tab or highlight pending approvals
- Show approval count badge

#### 10.2 Booking approval actions

**File:** `frontend/app/[locale]/(dashboard)/admin/bookings/_components/BookingActionsMenu.tsx`

- Add "Approve" and "Reject" menu items for `PendingApproval` bookings
- Hide approve/reject for non-`PendingApproval` bookings

#### 10.3 Approval/rejection modals

**New file:** `frontend/app/[locale]/(dashboard)/admin/bookings/_components/ApproveBookingDialog.tsx`

- Confirm dialog: "Approve this booking?" with booking summary
- Calls `approveBooking(id)` API

**New file:** `frontend/app/[locale]/(dashboard)/admin/bookings/_components/RejectBookingDialog.tsx`

- Dialog with required `Reason` text field (multi-line)
- Calls `rejectBooking(id, reason)` API

#### 10.4 Booking detail page — approval status

**File:** `frontend/app/[locale]/(dashboard)/admin/bookings/[id]/_components/BookingDetailsClient.tsx`

- Show approval status section when booking is `PendingApproval`
- Display `ApprovedBy`, `ApprovedAt` or `RejectionReason` when available
- Add Approve/Reject buttons in the detail view

#### 10.5 Change status modal update

**File:** `frontend/app/[locale]/(dashboard)/admin/bookings/_components/ChangeStatusModal.tsx`

- Ensure `PendingApproval` and `Rejected` are included in available statuses for display
- Do NOT allow manual transition to `PendingApproval` (only system sets this)

---

### Phase 11: Frontend — Customer-Facing Changes

#### 11.1 Customer booking detail page

**File:** `frontend/app/[locale]/(customer)/booking/[id]/` (or equivalent)

- Show "Pending Approval" status with informative message
- Show "Rejected" status with rejection reason if provided
- Theme colors: use `theme.palette.status.pending` for `PendingApproval`, `theme.palette.status.cancelled` for `Rejected`

#### 11.2 Customer bookings list

- Show `PendingApproval` status badge
- Show `Rejected` status badge

---

### Phase 12: Frontend — next-intl Translations

#### 12.1 English translations

**New file:** `frontend/shared/messages/en/dashboard/admin/bookings.ts`

- Fill in all keys from the type definition at `frontend/shared/messages/types/dashboard/admin/bookings.ts`
- Add new keys for approval workflow:
  - `approvals.title`, `approvals.description`, `approvals.approveButton`, `approvals.rejectButton`
  - `approvals.approveDialog.title`, `approvals.approveDialog.content`
  - `approvals.rejectDialog.title`, `approvals.rejectDialog.reasonLabel`, `approvals.rejectDialog.reasonRequired`
  - `approvals.approvedSuccess`, `approvals.rejectedSuccess`
  - `filters.statuses.pendingApproval`, `filters.statuses.rejected`
  - `analytics.statuses.pendingApproval`, `analytics.statuses.rejected`

**Update:** `frontend/shared/messages/en/customer/bookings.ts`

- Add `list.status.pendingApproval`, `list.status.rejected`

**Update:** `frontend/shared/messages/en/customer/booking-detail.ts`

- Add approval/rejection status messages and rejection reason display

#### 12.2 Arabic translations

**New file:** `frontend/shared/messages/ar/dashboard/admin/bookings.ts`

- Mirror all English keys with Arabic translations

**Update:** `frontend/shared/messages/ar/customer/bookings.ts`

- Add `list.status.pendingApproval`, `list.status.rejected` in Arabic

**Update:** `frontend/shared/messages/ar/customer/booking-detail.ts`

- Mirror English additions in Arabic

#### 12.3 Type definition updates

**File:** `frontend/shared/messages/types/dashboard/admin/bookings.ts`

- Add `pendingApproval` and `rejected` to the status-related type keys
- Add the `approvals` namespace keys

---

### Phase 13: Frontend — Theme Integration

#### 13.1 Add theme colors if missing

**File:** `frontend/providers/theme.ts`

- Verify `theme.palette.status.pending` covers `PendingApproval` (reuse existing `status.pending`)
- Verify `theme.palette.status.blocked` or `status.cancelled` covers `Rejected` (reuse `status.cancelled`)
- If a distinct "rejected" color is desired, add `theme.palette.status.rejected` to the theme

#### 13.2 AGENTS.md compliance

- All new components MUST use `theme.palette.*` references — NO hardcoded colors
- All new components MUST use `sx={{ ... }}` for MUI style props (v6+ pattern)
- All new components MUST use `logger` instead of `console.*`

---

### Phase 14: Quality Checks (per AGENTS.md workflow)

After all code changes, run in this exact order:

1. **CodeScene Diagnostics** — `getDiagnostics` tool — fix all warnings
2. **TypeScript Compilation** — `~/.bun/bin/bun tsgo` — fix type errors
3. **Linting** — `~/.bun/bin/bun lint` — fix ESLint errors
4. **CodeScene Analysis** — `~/.bun/bin/bun codescene` — verify code health
5. **SonarQube Scan** — `~/.bun/bin/bun sonar-scan` — verify quality gates

Backend:
6. **Build** — `dotnet build` in backend directory
7. **Unit Tests** — `dotnet test` for BookingServiceTests, CheckoutServiceTests
8. **Property Tests** — `dotnet test` for booking property tests

---

### Phase 15: Backend — Integration Test (optional but recommended)

- Add integration test for the full approval flow:
  - Create booking as customer -> confirm payment -> verify `PendingApproval`
  - Approve as admin -> verify `Confirmed` + `ApprovedBy`/`ApprovedAt`
  - Create booking as admin -> verify `Confirmed` (auto-approved)
  - Reject as admin -> verify `Rejected` + `RejectionReason` + refund initiated

---

## Files Changed Summary

| Area | Files | Action |
|---|---|---|
| **Backend Enum** | `BookingEnums.cs` | Modify |
| **Backend Entity** | `Booking.cs` | Modify |
| **Backend EF Config** | `BookingConfiguration.cs` | Modify |
| **Backend Migration** | New migration file | Create |
| **Backend Status Policy** | `BookingStatusPolicy.cs` | Modify |
| **Backend Service** | `BookingService.cs` | Modify (transitions, approve, reject) |
| **Backend Checkout** | `CheckoutService.cs` | Modify (PendingApproval instead of Confirmed) |
| **Backend BG Service** | `BookingStatusUpdateService.cs` | Modify (PendingApproval expiry) |
| **Backend Controller** | `BookingsController.cs` or new | Modify/Create (approve/reject endpoints) |
| **Backend DTOs** | Booking DTOs | Modify/Create |
| **Backend Tests** | 4 test files | Modify |
| **Frontend API** | `bookings.ts` | Modify |
| **Frontend Admin UI** | 5+ components | Modify/Create |
| **Frontend Customer UI** | 2+ components | Modify |
| **Frontend i18n EN** | 3 translation files | Modify/Create |
| **Frontend i18n AR** | 3 translation files | Modify/Create |
| **Frontend Theme** | `theme.ts` | Verify/Modify |
