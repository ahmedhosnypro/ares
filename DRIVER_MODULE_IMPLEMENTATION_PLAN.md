# Driver Module — Implementation Plan

> **Scope:** Complete Driver Module for the ARES Rental Platform — registration, profile completion, admin verification, availability, work areas, request/response/selection/assignment workflow, change/cancel rules, expiration, mandatory-driver rule, pricing, payments split, reviews, notifications, admin console, driver dashboard, security, and tests.
>
> **Architecture:** .NET 8 / EF Core / Clean Architecture (Api → Application → Domain ← Infrastructure).
>
> **Backward-compatibility guarantee:** No existing entity, table, column, controller, service, DTO, or API route is renamed or removed. The existing `Driver` entity (customer driving-license record) is left **completely untouched**. The new module is built on a brand-new `DriverProfile` entity / `driver_profiles` table to avoid any collision with the existing `DriverLicense` flow.

---

## 1. Naming & terminology decisions (locked)

| Concern | Decision |
|---|---|
| New entity name | **`DriverProfile`** (table: `driver_profiles`) — leaves existing `Driver` (customer license) untouched. |
| Work areas | New reference table **`service_areas`** (predefined cities) + many-to-many join **`driver_work_areas`**. (The existing "Locations" infrastructure is actually `user_addresses` — wrong shape to FK against. A reference table is the right normalization.) |
| Driver daily rate | Single global setting in existing `SystemSettings` table, key **`driver.daily_rate`**, managed via `SettingsController`. |
| Driver role | New `"Driver"` Identity role, added to `DbInitializer.SeedRolesAsync`. |
| Booking integration | Add new nullable column **`Booking.AssignedDriverProfileId`** (FK → `driver_profiles`) and **`Booking.DriverFee`**, **`Booking.VehicleFee`**, **`Booking.GrandTotal`**. Existing `Booking.DriverId` and `Booking.TotalPrice` columns are kept untouched for backward compatibility. |

---

## 2. Files to be CREATED

### Domain layer (`backend/Domain`)

```
Entities/
  DriverProfile.cs                       # main driver profile entity
  DriverWorkArea.cs                      # M:N join row
  ServiceArea.cs                         # reference table (Cairo, Giza, …)
  DriverRequest.cs                       # one row per booking that needs a driver
  DriverRequestResponse.cs               # one row per (request, driver) interest
  DriverReview.cs                        # separate from vehicle Review
Entities/Enums/
  DriverEnums.cs
    enum DriverProfileStatus  { Incomplete, PendingVerification, Verified, Rejected, Suspended }
    enum DriverAvailability   { Unavailable, Available, Reserved }
    enum DriverRequestStatus  { Open, Fulfilled, Expired, Cancelled }
    enum DriverResponseAction { Accepted }   // future-proof for Decline/Withdraw
```

### Application layer (`backend/Application`)

```
DTOs/Driver/
  CompleteDriverProfileRequest.cs            # multipart: docs + addresses + work areas
  DriverProfileStatusDto.cs                  # for /me endpoints
  DriverProfileDetailsDto.cs                 # for admin & self detail view
  UpdateDriverAvailabilityRequest.cs
  DriverWorkAreaDto.cs
  ServiceAreaDto.cs
  PublicDriverDto.cs                         # safe view (no PII) for customer selection
  DriverRequestDto.cs                        # driver's view of an open request
  DriverRequestAcceptRequest.cs
  DriverAssignmentDto.cs
  ChangeDriverRequest.cs
  AdminDriverListItemDto.cs
  AdminDriverDetailsDto.cs
  AdminApproveDriverRequest.cs
  AdminRejectDriverRequest.cs
  DriverDashboardSummaryDto.cs
  CreateDriverReviewRequest.cs
  DriverReviewDto.cs
  DriverEarningsDto.cs                       # optional, for parity with supplier earnings

Interfaces/
  IDriverProfileRepository.cs
  IDriverRequestRepository.cs
  IDriverReviewRepository.cs
  IServiceAreaRepository.cs
  (Extend) IApplicationDbContext.cs          # add DbSet IQueryables + Add* helpers

Services/
  IDriverProfileService.cs / DriverProfileService.cs
  IDriverRequestService.cs / DriverRequestService.cs
  IDriverAssignmentService.cs / DriverAssignmentService.cs
  IDriverReviewService.cs   / DriverReviewService.cs
  IDriverDashboardService.cs / DriverDashboardService.cs
  IAdminDriverService.cs    / AdminDriverService.cs
  IServiceAreaService.cs    / ServiceAreaService.cs
  IDriverNotificationService.cs / DriverNotificationService.cs   # thin wrapper over INotificationService
  IDriverPricingService.cs  / DriverPricingService.cs            # reads SystemSettings
  Background/DriverRequestExpirationHostedService.cs             # IHostedService — sweeps expired requests every minute

Validators/
  CompleteDriverProfileRequestValidator.cs
  UpdateDriverAvailabilityRequestValidator.cs
  DriverRequestAcceptRequestValidator.cs
  ChangeDriverRequestValidator.cs
  AdminApproveDriverRequestValidator.cs
  AdminRejectDriverRequestValidator.cs
  CreateDriverReviewRequestValidator.cs
```

### Infrastructure layer (`backend/Infrastructure`)

```
Data/Configurations/
  DriverProfileConfiguration.cs
  DriverWorkAreaConfiguration.cs
  ServiceAreaConfiguration.cs
  DriverRequestConfiguration.cs
  DriverRequestResponseConfiguration.cs
  DriverReviewConfiguration.cs

Data/SeedData/
  ServiceAreaSeeder.cs                       # seeds Cairo, Giza, New Cairo, Alexandria, …

Repositories/
  DriverProfileRepository.cs
  DriverRequestRepository.cs
  DriverReviewRepository.cs
  ServiceAreaRepository.cs

Migrations/
  20260531120000_AddDriverModule.cs          # creates all tables, indexes, FKs, default settings row
  20260531120000_AddDriverModule.Designer.cs
  ApplicationDbContextModelSnapshot.cs       # regenerated (additive only)
```

### Api layer (`backend/Api/Controllers`)

```
DriverProfileController.cs                   # /api/driver/profile          [Authorize(Roles="Driver")]
DriverRequestsController.cs                  # /api/driver/requests         [Authorize(Roles="Driver")]
DriverAssignmentsController.cs               # /api/driver/assignments      [Authorize(Roles="Driver")]
DriverDashboardController.cs                 # /api/driver/dashboard        [Authorize(Roles="Driver")]
DriverReviewsController.cs                   # /api/drivers/{driverId}/reviews
CustomerDriverSelectionController.cs         # /api/bookings/{bookingId}/drivers   [Authorize(Roles="Customer")]
AdminDriversController.cs                    # /api/admin/drivers           [Authorize(Roles="Admin")]
ServiceAreasController.cs                    # /api/service-areas (public GET, admin POST/PUT/DELETE)
```

### Tests layer (`backend/Tests`)

```
UnitTests/
  DriverProfileServiceTests.cs
  DriverRequestServiceTests.cs
  DriverAssignmentServiceTests.cs
  DriverReviewServiceTests.cs
  AdminDriverServiceTests.cs
  DriverDashboardServiceTests.cs
PropertyTests/
  DriverAssignmentOverlapPropertyTests.cs    # FsCheck — no two assignments overlap
  DriverRequestExpirationPropertyTests.cs
IntegrationTests/
  DriverWorkflowIntegrationTests.cs          # end-to-end: register → complete → verify → request → accept → select → assign
ValidatorTests/
  CompleteDriverProfileRequestValidatorTests.cs
  ChangeDriverRequestValidatorTests.cs
```

---

## 3. Files to be MODIFIED (additive only)

| File | Change |
|---|---|
| `Domain/Entities/Booking.cs` | Add nullable `Guid? AssignedDriverProfileId`, `DriverProfile? AssignedDriverProfile`, `decimal? VehicleFee`, `decimal? DriverFee`, `decimal? GrandTotal`, `DateTime? DriverLockedUntil`. Existing `DriverId`, `RequiresDriver`, `TotalPrice` untouched. |
| `Domain/Entities/Enums/BookingEnums.cs` | Append `WaitingForDriver`, `NoDriverAvailable` to `BookingStatus`. Existing values keep their ordinals. |
| `Domain/Entities/Enums/UserEnums.cs` | Append `Driver` to `UserRole`. |
| `Infrastructure/Data/ApplicationDbContext.cs` | Add `DbSet<DriverProfile>`, `DbSet<DriverWorkArea>`, `DbSet<ServiceArea>`, `DbSet<DriverRequest>`, `DbSet<DriverRequestResponse>`, `DbSet<DriverReview>`; expose on `IApplicationDbContext`. |
| `Application/Interfaces/IApplicationDbContext.cs` | Same — add `IQueryable<...>` getters + `Add*` helpers. |
| `Infrastructure/Data/DbInitializer.cs` | Add `"Driver"` to the role seeding array; seed default `driver.daily_rate` system setting. |
| `Infrastructure/Data/Configurations/BookingConfiguration.cs` | Add HasOne(AssignedDriverProfile) / WithMany / OnDelete.Restrict + index on `AssignedDriverProfileId` + index on `(AssignedDriverProfileId, PickupDate, ReturnDate)` for overlap checks. |
| `Application/Services/AuthService.cs` | (1) Accept `"driver"` in `ResolveSelfServiceRole`; (2) when role is Driver, after `AddToRoleAsync` create an empty `DriverProfile { UserId, Status = Incomplete }`. |
| `Application/Validators/RegisterRequestValidator.cs` | Allow `"driver"` in the role rule (already permits "customer" / "supplier"). |
| `Application/Services/BookingService.cs` | (1) Enforce mandatory-driver rule when customer has no approved license; (2) compute `VehicleFee`, `DriverFee`, `GrandTotal` when `RequiresDriver`; (3) emit `DriverRequest` (via `IDriverRequestService`) instead of trying to use `request.DriverId` directly when driver is needed but not pre-selected. |
| `Application/DTOs/Booking/CreateBookingRequest.cs` | Add optional `bool? NeedDriver` (defaults to `false` for back-compat). Positional order preserved; new field appended. |
| `Application/Validators/CreateBookingRequestValidator.cs` | Add cross-field rule wiring for `NeedDriver`. |
| `Application/DTOs/Booking/BookingDetailsDto.cs` | Add optional `AssignedDriverProfile`, `DriverFee`, `VehicleFee`, `GrandTotal` (nullable). |
| `Application/Services/SupplierBookingService.cs` (display only) | Surface assigned driver name in supplier booking detail (read-only). |
| `Api/Program.cs` | DI registrations for all new services / repositories + `AddHostedService<DriverRequestExpirationHostedService>()`. |
| `Infrastructure/Data/SeedData/ServiceAreaSeeder.cs` (new) called from `DbInitializer.SeedDemoDataAsync` | Seed Cairo, Giza, New Cairo, Alexandria, Sharm, Hurghada. |

**Nothing else** in Auth, Booking, Vehicle, Inspection, Review, Notification, Verification, Supplier, Admin code paths is modified.

---

## 4. Database changes

### New tables

| Table | Purpose | Key columns / FKs / indexes |
|---|---|---|
| `driver_profiles` | One row per Driver user | `Id` PK, `UserId` FK → `AspNetUsers` (UNIQUE), `LicenseNumber` (UNIQUE filtered NOT NULL), `LicenseExpiryDate`, `LicenseImage`, `NationalIdFrontImage`, `NationalIdBackImage`, `Address`, `EmergencyContactName`, `EmergencyContactPhone`, `Status` (string, default `'Incomplete'`), `Availability` (string, default `'Unavailable'`), `IsActive` (bool, default 1), `RejectionReason`, `ReviewedBy`, `ReviewedAt`, audit cols. Indexes: `IX_driver_profiles_Status_Availability`, `IX_driver_profiles_UserId` (unique). |
| `service_areas` | Reference list of cities | `Id` PK, `Name` (UNIQUE), `Governorate`, `IsActive`. Seeded by `ServiceAreaSeeder`. |
| `driver_work_areas` | M:N join | `DriverProfileId` FK, `ServiceAreaId` FK, composite PK `(DriverProfileId, ServiceAreaId)`. Indexes: `IX_driver_work_areas_ServiceAreaId` for matching. |
| `driver_requests` | One per booking needing a driver | `Id` PK, `BookingId` FK (UNIQUE — at most one active request per booking), `PickupServiceAreaId` FK (nullable for free-text fallback), `PickupLocationText`, `Status` (string), `CreatedAt`, `ExpiresAt` (= CreatedAt + 60 min), `FulfilledAt`, `FulfilledByDriverProfileId`. Indexes: `IX_driver_requests_Status_ExpiresAt`, `IX_driver_requests_BookingId` (unique partial where Status='Open'). |
| `driver_request_responses` | One per driver expressing interest | `Id` PK, `DriverRequestId` FK, `DriverProfileId` FK, `Action` (string, default `'Accepted'`), `RespondedAt`. UNIQUE `(DriverRequestId, DriverProfileId)`. |
| `driver_reviews` | Customer review of driver | `Id` PK, `BookingId` FK (UNIQUE — one review per booking), `DriverProfileId` FK, `CustomerId` FK, `Rating` (1-5), `Comment`, audit cols. Indexes: `IX_driver_reviews_DriverProfileId`. |

### Columns ADDED to existing tables

`Bookings`:
- `AssignedDriverProfileId UNIQUEIDENTIFIER NULL` (FK → `driver_profiles.Id`, RESTRICT)
- `VehicleFee DECIMAL(18,2) NULL`
- `DriverFee DECIMAL(18,2) NULL`
- `GrandTotal DECIMAL(18,2) NULL`
- `DriverLockedUntil DATETIME2 NULL`
- Index: `IX_Bookings_AssignedDriverProfileId`
- Index: `IX_Bookings_AssignedDriverProfileId_PickupDate_ReturnDate` (used by overlap check)

### Rows added to existing tables (idempotent inserts in migration `Up`)

- `AspNetRoles`: insert role `Driver` if missing (matches `DbInitializer` style for safety).
- `SystemSettings`: insert `('driver.daily_rate', '25.00')` if missing (idempotent `IF NOT EXISTS`).

### Backward-compatibility checklist

- All new columns are NULLABLE → existing rows unchanged.
- Existing `Booking.DriverId` and `Booking.TotalPrice` remain — old clients keep working. Pricing logic falls back to `TotalPrice` when split fees aren't present.
- Existing `Driver` table (customer licenses) is **NOT touched** by this migration.
- New enum values appended at end → existing rows' ordinal-or-string-persisted values keep their meaning.

---

## 5. Migration strategy

1. **One additive migration:** `20260531120000_AddDriverModule`.
2. **Order inside `Up`:** create reference table (`service_areas`) → create `driver_profiles` → create `driver_work_areas` (composite PK) → create `driver_requests` → create `driver_request_responses` → create `driver_reviews` → `AlterTable Bookings` add nullable cols + indexes → seed role row → seed `SystemSettings` row.
3. **No data backfill required** — every existing booking already has `RequiresDriver=false` semantics where it matters.
4. **Run:** `dotnet ef database update --project Infrastructure --startup-project Api` (or `backend.ps1 ef-update`).
5. **Deploy:** stop API → migrate → start API. Zero downtime is possible because all changes are additive.

## 6. Rollback strategy

1. **Database:** `dotnet ef database update <PreviousMigrationName> --project Infrastructure --startup-project Api` to roll back to the last migration before `AddDriverModule`. The `Down` method drops new tables and removes new columns from `Bookings` in reverse order (FKs → indexes → cols → tables → role row → settings row).
2. **Code:** the Driver module is isolated under new files and additive modifications. Reverting the commit / branch restores prior behavior without touching unrelated entities. The `Booking.AssignedDriverProfileId` column being nullable means old code paths that don't reference it continue to function.
3. **Data safety:** rolling back **deletes** all driver_profiles / driver_requests / driver_reviews / work area assignments. This is acceptable because the feature is net-new; no pre-existing customer data lives in those tables.
4. **Feature flag (optional):** the Driver registration role can be gated behind a `SystemSettings` flag `feature.driver_module.enabled` (default `true`) so the role choice can be hidden from the register form without rolling back the migration.

---

## 7. Endpoint catalog (full list)

| Method & Route | Auth | Phase | Summary |
|---|---|---|---|
| `POST /api/auth/register` (modified) | Anonymous | 1 | Now accepts `role: "driver"`. Creates user + empty DriverProfile (Status=Incomplete). |
| `GET    /api/driver/profile/me` | Driver | 2 | Returns own profile + completion status. |
| `POST   /api/driver/profile/complete` (multipart) | Driver | 2 | Submit license, IDs, address, emergency contact, work areas. Sets Status=PendingVerification. |
| `PUT    /api/driver/profile` | Driver | 2 | Update editable fields (e.g. work areas, address). |
| `PUT    /api/driver/profile/availability` | Driver | 4 | Toggle Available/Unavailable (cannot leave Reserved manually). |
| `GET    /api/driver/dashboard/summary` | Driver | 3 | Verification status, availability, totals, rating. |
| `GET    /api/driver/requests/available` | Driver | 6/7 | Open requests matching driver's work areas. |
| `GET    /api/driver/requests/mine` | Driver | 7 | Requests this driver responded to. |
| `POST   /api/driver/requests/{id}/accept` | Driver | 7 | Express interest. |
| `GET    /api/driver/assignments` | Driver | 9 | Bookings assigned to this driver. |
| `POST   /api/driver/assignments/{bookingId}/cancel` | Driver | 11 | Cancel ≥24h before pickup. |
| `GET    /api/bookings/{bookingId}/drivers` | Customer (owner) | 8 | List interested drivers (PublicDriverDto — no PII). |
| `POST   /api/bookings/{bookingId}/drivers/{driverProfileId}/select` | Customer (owner) | 9 | Assigns driver, sets DriverLockedUntil, marks request Fulfilled. |
| `POST   /api/bookings/{bookingId}/drivers/change` | Customer (owner) | 10 | Replace assigned driver ≥24h before pickup. |
| `POST   /api/bookings/{bookingId}/drivers/retry` | Customer (owner) | 12 | Re-open driver search when previous round returned no drivers. |
| `POST   /api/drivers/{driverProfileId}/reviews` | Customer | 16 | Review a completed driver assignment. |
| `GET    /api/drivers/{driverProfileId}/reviews` | Anonymous | 16 | Public driver reviews. |
| `GET    /api/service-areas` | Anonymous | 5 | List service areas. |
| `POST   /api/service-areas` | Admin | 5 | Create. |
| `PUT    /api/service-areas/{id}` | Admin | 5 | Update. |
| `DELETE /api/service-areas/{id}` | Admin | 5 | Soft-disable. |
| `GET    /api/admin/drivers` | Admin | Admin | Paginated list with filters (status, availability, work area). |
| `GET    /api/admin/drivers/pending` | Admin | Admin | Pending verification queue. |
| `GET    /api/admin/drivers/{id}` | Admin | Admin | Full details + documents + work areas + trip history + ratings. |
| `POST   /api/admin/drivers/{id}/approve` | Admin | 3 | Approve verification. |
| `POST   /api/admin/drivers/{id}/reject` | Admin | 3 | Reject with reason. |
| `POST   /api/admin/drivers/{id}/enable` | Admin | Admin | Re-enable a disabled driver. |
| `POST   /api/admin/drivers/{id}/disable` | Admin | Admin | Disable a driver account. |
| `GET    /api/admin/settings/driver-rate` | Admin | 14 | Read current rate. |
| `PUT    /api/admin/settings/driver-rate` | Admin | 14 | Update rate (writes `driver.daily_rate`). |

All routes follow existing controller conventions (`[ApiController]`, `[Route("api/...")]`, `[Authorize(Roles = "...")]`, `[ProducesResponseType(...)]`).

---

## 8. Business rules — codified

1. **Eligibility filter (Phase 4 + 6):** `driver_profiles.Status = 'Verified' AND Availability = 'Available' AND IsActive = 1 AND ApplicationUser.Status != 'Blocked'` AND `driver_work_areas` contains the booking pickup area.
2. **Overlap rule (Phase 9):** before assignment, `NOT EXISTS (SELECT 1 FROM Bookings b WHERE b.AssignedDriverProfileId = @driverId AND b.Status IN ('Confirmed','Approved','Active','ReadyForDelivery') AND tsrange(b.PickupDate, b.ReturnDate) OVERLAPS tsrange(@pickup,@return))`. Implemented as SQL Server `EXISTS` with `<= / >=` overlap predicate.
3. **Lock window (Phase 9):** `DriverLockedUntil = ReturnDate`. Availability flips to `Reserved` while the assignment is active; flips back to `Available` (or whatever the driver chose) when the booking transitions to `Completed`/`Cancelled`.
4. **24-hour rule (Phases 10 & 11):** `DateTime.UtcNow <= PickupDate - TimeSpan.FromHours(24)`. Single `DriverChangeWindowPolicy.CanChange(...)` helper used by both change and cancel.
5. **Expiration (Phase 12):** `DriverRequestExpirationHostedService` runs every 60s, scans `Status='Open' AND ExpiresAt <= UtcNow`, flips to `Expired`. If no `Accepted` responses exist, booking moves to `NoDriverAvailable` and customer is notified.
6. **Mandatory driver (Phase 13):** when the booking owner has no approved driving license (existing `Driver` entity, `VerificationStatus='Verified'`), `RequiresDriver` is forced to `true` and the request rejects payloads with `NeedDriver=false`.
7. **Pricing (Phase 14/15):** `DriverFee = TotalDays * driver.daily_rate` when `RequiresDriver`, else `0`. `VehicleFee = TotalDays * Vehicle.PricePerDay`. `GrandTotal = VehicleFee + DriverFee`. `TotalPrice` mirrors `GrandTotal` for backward compat with existing payment code.

---

## 9. Notification integration (Phase 17)

All notifications go through the existing `INotificationService.CreateNotificationAsync(userId, title, message, type, ct)` + `NotifyAdminsAsync` — no new infra. The `Type` strings are added to `SupplierNotificationTypes.cs`-style enum file (`DriverNotificationTypes.cs`):

```
DriverNotificationTypes:
  "DriverRequestNew", "DriverApproved", "DriverRejected",
  "DriverAssigned", "DriverRemoved", "DriverCancelled",
  "NoDriverAvailable", "DriverRequestExpired", "DriverSelected"
```

| Event | Recipient | Type |
|---|---|---|
| Customer booking created with `NeedDriver=true` | Every eligible driver | `DriverRequestNew` |
| Admin approves driver | The driver | `DriverApproved` |
| Admin rejects driver | The driver (with reason) | `DriverRejected` |
| Customer selects a driver | Selected driver + other interested drivers (informational) | `DriverAssigned` / `DriverSelected` |
| Customer changes driver | Old driver (removed) + new driver (assigned) | `DriverRemoved` / `DriverAssigned` |
| Driver cancels assignment | Customer | `DriverCancelled` |
| Expiration sweep flips request to `NoDriverAvailable` | Customer | `NoDriverAvailable` |

All notification sends are wrapped in `try/catch` (matching the existing best-effort pattern) so a notification failure never rolls back the business operation.

---

## 10. Security & authorization rules (Phase 13)

| Rule | Enforcement point |
|---|---|
| Only Admin can approve/reject/enable/disable drivers | `[Authorize(Roles = "Admin")]` on `AdminDriversController` |
| Only Admin can edit `driver.daily_rate` | `[Authorize(Roles = "Admin")]` on settings route + double-checked in service |
| Driver cannot approve themselves | Admin-only routes + service-level guard `if (driver.UserId == currentUserId) throw ForbiddenException` |
| Driver cannot assign themselves to a booking | Customer-owned selection endpoint requires `booking.UserId == currentUserId` |
| Driver cannot modify another driver's profile | Service queries always pin `WHERE UserId == currentUserId` |
| Customer cannot see driver PII | `PublicDriverDto` excludes phone, email, address, emergency contact, license number, license image, national IDs |
| Customer cannot change driver inside 24h window | Service guard + validator |
| Driver cannot cancel inside 24h window | Same helper |

---

## 11. Performance / indexing

- `driver_profiles (Status, Availability, IsActive)` — eligibility scan
- `driver_work_areas (ServiceAreaId, DriverProfileId)` — pickup-area match
- `driver_requests (Status, ExpiresAt)` — expiration sweep
- `Bookings (AssignedDriverProfileId, PickupDate, ReturnDate)` — overlap check
- `driver_reviews (DriverProfileId)` — rating aggregation
- Background sweep batched (`Take(200)` per iteration) to bound work per cycle.

---

## 12. Testing strategy (Phase 14)

| Layer | Coverage |
|---|---|
| Unit | DriverProfileService (registration, completion, status transitions, rejection resubmit), DriverRequestService (eligibility filter, expiration), DriverAssignmentService (overlap, lock, 24h rule), AdminDriverService (approve/reject), DriverReviewService (rating aggregation), DriverPricingService (rate read & total split). |
| Property | `AssignedDriverProfileId × [PickupDate, ReturnDate]` never overlaps; expiration always fires within 60s of `ExpiresAt`. |
| Validators | Every new `*Validator` has a `<ValidatorName>Tests.cs`. |
| Integration | Full happy-path: register Driver → complete profile → admin approves → customer creates booking with NeedDriver → drivers receive request → 2 accept → customer selects 1 → second driver receives "not selected" info notification → trip completes → customer reviews → rating updates. |
| Negative paths | Unverified driver can't receive requests; rejected driver can resubmit; expiration fires; mandatory-driver-without-license blocks booking; overlap rejected; <24h change rejected. |

---

## 13. Phased delivery order

| Sprint | Phases delivered |
|---|---|
| **1 (this PR)** | Phase 1: Driver role + DriverProfile entity + DbContext wiring + migration + register flow + DbInitializer role seed. |
| 2 | Phase 2 + 5: Profile completion endpoints + ServiceArea + WorkAreas. |
| 3 | Phase 3 + Admin Module: Verification flow + Admin controller + AdminDriverService. |
| 4 | Phase 4 + Driver Dashboard APIs: Availability + Dashboard summary. |
| 5 | Phase 6/7/8 + Customer driver selection: DriverRequest, DriverRequestResponse, eligibility filter, selection API. |
| 6 | Phase 9/10/11: Assignment, overlap, lock, change, cancel. |
| 7 | Phase 12: ExpirationHostedService + retry/cancel customer options. |
| 8 | Phase 13/14/15: Mandatory-driver rule + pricing + payment split. |
| 9 | Phase 16/17: Driver reviews + complete notification matrix. |
| 10 | Tests (Phase 14) + DI wiring audit + performance pass. |

---

## 14. Risk register

| Risk | Mitigation |
|---|---|
| Name collision with existing `Driver` (customer license) | New entity is `DriverProfile`; existing `Driver` untouched. |
| `Booking.DriverId` already pointing at customer-license Driver | New column `AssignedDriverProfileId` introduced; existing column preserved. |
| Existing booking pricing assumes single `TotalPrice` | Keep `TotalPrice` mirroring `GrandTotal`; payment code reads from `TotalPrice` as before. |
| Identity role rollout (no `Driver` users yet) | Migration seeds role; no historical user is auto-promoted. |
| Background service in tests | `IHostedService` registered behind env check; tests use a deterministic in-memory variant. |
