# ARES Rental Platform — Double‑Booking Prevention & Booking Recovery

**Status:** Implemented in‑place (backend + frontend). Frontend type‑checks clean
(`tsc` 0 errors). Backend must be compiled locally — the sandbox used to author this
has no .NET SDK (`dotnet build` could not be run here). See *Verification* at the end.

**Design choice (per your selection):** the seven required lifecycle states were added
**additively**. Booking status is persisted as a *string*
(`HasConversion<string>()`), so adding enum values cannot corrupt existing rows, and the
inspection/driver modules that depend on the existing states keep working unchanged.

---

## A. Updated database schema

Two nullable UTC columns are added to `Bookings`, plus three covering indexes.

| Column | Type | Purpose |
|---|---|---|
| `HoldStartedAt` | `datetime2 NULL` | When the `PaymentPending` hold began (UTC). |
| `HoldExpiresAt` | `datetime2 NULL` | When the hold lapses → vehicle released (UTC). |

| Index | Columns | Purpose |
|---|---|---|
| `IX_Bookings_Vehicle_Status_Window` | `VehicleId, Status, PickupDate, ReturnDate` | Fast overlap/availability lookups. |
| `IX_Bookings_Status_HoldExpiresAt` | `Status, HoldExpiresAt` | Fast hold‑expiry background sweep. |
| `IX_Bookings_User_Status` | `UserId, Status` | Fast booking‑recovery lookup. |

`Bookings.RowVersion` (a `rowversion` optimistic‑concurrency token) already existed and is
reused as a second line of defence.

### Booking lifecycle (additive)

`BookingStatus` now contains the original values **plus**: `Draft`, `DriverSelected`,
`PaymentPending`, `Expired`. `Confirmed`, `Completed`, `Cancelled` are reused as‑is.

```
Vehicle selected      → Draft            (no reservation; many users may hold drafts)
Driver selected       → DriverSelected   (no reservation)
Enter payment page    → PaymentPending   (vehicle HELD for HoldMinutes, default 10)
Payment successful    → Confirmed        (vehicle fully reserved)
Rental completed      → Completed
Payment timeout       → Expired          (vehicle auto‑released)
User cancels          → Cancelled        (hold released)
```

---

## B. Required backend changes (summary)

| File | Change |
|---|---|
| `Domain/Entities/Enums/BookingEnums.cs` | Added `Draft, DriverSelected, PaymentPending, Expired`. |
| `Domain/Entities/Enums/BookingStatusPolicy.cs` *(new)* | Single source of truth for *reserving* and *resumable* status sets. |
| `Domain/Entities/Booking.cs` | Added `HoldStartedAt`, `HoldExpiresAt`. |
| `Infrastructure/Data/Configurations/BookingConfiguration.cs` | Added the three indexes above. |
| `Infrastructure/Migrations/20260603120000_AddBookingHoldFields.cs` *(new)* | Adds the columns + indexes (+ `.Designer.cs` + snapshot update). |
| `Application/Interfaces/IBookingRepository.cs` | Added `ReserveVehicleAtomicAsync(...)`. |
| `Infrastructure/Repositories/BookingRepository.cs` | Implemented the race‑safe reservation; `HasActiveBookingsAsync` now uses the shared policy. |
| `Infrastructure/Repositories/VehicleRepository.cs` | `IsAvailableAsync` now blocks only *reserving* statuses and treats expired holds as free. |
| `Application/DTOs/Checkout/CheckoutDtos.cs` | Added `CreateDraftRequest`, `SelectCheckoutDriverRequest`, `ConfirmCheckoutRequest`, `CheckoutStateDto`. |
| `Application/Services/ICheckoutService.cs` / `CheckoutService.cs` | Added the staged lifecycle methods; hardened the legacy express checkout to commit through the atomic reservation; reads configurable hold duration. |
| `Api/Controllers/CheckoutController.cs` | Added the staged + recovery endpoints. |
| `Infrastructure/Services/BookingStatusUpdateService.cs` | Added `PaymentPending → Expired` and abandoned‑draft sweeps. |
| `Api/appsettings.json` | Added `Booking:HoldMinutes` (default 10). |
| `Tests/UnitTests/CheckoutServiceTests.cs` | Updated for the new ctor arg + atomic‑commit assertion. |

---

## C. Required frontend changes (summary)

| File | Change |
|---|---|
| `api-clients/checkout/checkout.ts` *(new)* | Typed client for the staged + recovery endpoints; `CheckoutError` exposes HTTP 409. |
| `app/(customer)/booking/_components/ResumeBookingBanner.tsx` *(new)* | "You have an unfinished booking" banner with **Continue** / **Discard**. |
| `app/(customer)/booking/driver-selection/[vehicleId]/page.tsx` | Creates/restores the **Draft**, persists the **DriverSelected** step, recovers from DB instead of redirecting. |
| `app/(customer)/booking/payment/[vehicleId]/page.tsx` | Places the **hold** on load, **confirms** via the staged endpoint, shows a live hold countdown, handles 409/expiry, recovers instead of redirecting. |
| `app/(customer)/bookings/page.tsx` | Mounts the resume banner. |

---

## D. API endpoint modifications

All under `POST/GET /api/checkout` (`[Authorize]`). The legacy single‑call
`POST /api/checkout` (express) is retained and is now race‑safe.

| Method & route | Body | Result | Notes |
|---|---|---|---|
| `POST /api/checkout/draft` | `CreateDraftRequest` | `200 CheckoutStateDto` | Creates/resumes a **Draft**. Does **not** reserve. |
| `PUT /api/checkout/{id}/driver` | `SelectCheckoutDriverRequest` | `200 CheckoutStateDto` | → **DriverSelected**. Does **not** reserve. |
| `POST /api/checkout/{id}/payment` | – | `200 CheckoutStateDto` / **409** | → **PaymentPending**; places the hold. **Atomic / race‑safe.** |
| `POST /api/checkout/{id}/confirm` | `ConfirmCheckoutRequest` | `200 BookingResponse` / **409** | Captures payment → **Confirmed**. Re‑checks the lock. |
| `POST /api/checkout/{id}/cancel` | – | `200 CheckoutStateDto` | → **Cancelled**; releases the hold. |
| `GET /api/checkout/active` | – | `200 CheckoutStateDto` / **204** | **Recovery** — the caller's current resumable checkout. |
| `GET /api/checkout/{id}` | – | `200 CheckoutStateDto` / **404** | **Recovery** — a specific owned booking. |

The 409 body is the standard `ErrorResponse` with message
**"This vehicle has just been reserved by another customer."**
(`ConflictException` → HTTP 409 is already wired in `GlobalExceptionHandlerMiddleware`).

---

## E. Transaction implementation (race‑condition safe)

The authoritative check happens **only in the backend**, inside a **SERIALIZABLE**
transaction using SQL Server `UPDLOCK, HOLDLOCK` range locks. `HOLDLOCK` takes the
key‑range (serializable) lock that blocks *phantom inserts*; `UPDLOCK` makes concurrent
transactions queue on an update lock instead of dead‑locking on lock upgrade. The first
request wins; the second receives a 409. Any other changes already staged on the shared
`DbContext` (payment row, driver lock) commit in the *same* transaction.

```csharp
// Infrastructure/Repositories/BookingRepository.cs
public async Task ReserveVehicleAtomicAsync(
    Booking booking, BookingStatus targetStatus,
    DateTime? holdStartedAt, DateTime? holdExpiresAt,
    CancellationToken cancellationToken = default)
{
    if (booking.PickupDate is null || booking.ReturnDate is null)
        throw new BadRequestException("Booking is missing pickup/return dates.");

    var pickup = booking.PickupDate.Value;
    var ret    = booking.ReturnDate.Value;

    var entry = _context.Entry(booking);
    if (entry.State == EntityState.Detached) _context.Attach(booking);

    var strategy = _context.Database.CreateExecutionStrategy();
    await strategy.ExecuteAsync(async () =>
    {
        await using var tx = await _context.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.Serializable, cancellationToken);

        var nowUtc = DateTime.UtcNow;

        // Range‑lock the overlapping‑booking key range for this vehicle.
        // An expired PaymentPending hold is excluded → a lapsed hold never blocks.
        var conflicts = await _context.Database
            .SqlQueryRaw<int>(
                @"SELECT COUNT(*) AS [Value]
                  FROM [Bookings] WITH (UPDLOCK, HOLDLOCK)
                  WHERE [VehicleId] = {0}
                    AND [Id] <> {1}
                    AND [Status] IN ('Pending','PaymentPending','Confirmed','Active',
                                     'Approved','ReadyForDelivery','WaitingForDriver',
                                     'NoDriverAvailable','InspectionFailed')
                    AND NOT ([Status] = 'PaymentPending'
                             AND [HoldExpiresAt] IS NOT NULL
                             AND [HoldExpiresAt] <= {2})
                    AND [PickupDate] < {3}
                    AND [ReturnDate] > {4}",
                booking.VehicleId, booking.Id, nowUtc, ret, pickup)
            .ToListAsync(cancellationToken);

        if (conflicts.Count > 0 && conflicts[0] > 0)
        {
            await tx.RollbackAsync(cancellationToken);
            throw new ConflictException(
                "This vehicle has just been reserved by another customer.");
        }

        booking.Status        = targetStatus;
        booking.HoldStartedAt = holdStartedAt;
        booking.HoldExpiresAt = holdExpiresAt;

        try { await _context.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException)
        {
            await tx.RollbackAsync(cancellationToken);
            throw new ConflictException(
                "This vehicle has just been reserved by another customer.");
        }

        await tx.CommitAsync(cancellationToken);
    });
}
```

**Why it's safe under concurrency:** two simultaneous `POST /api/checkout/{id}/payment`
calls for the same vehicle/window both enter the SERIALIZABLE transaction. The first to
reach the `WITH (UPDLOCK, HOLDLOCK)` SELECT takes a key‑range lock; the second blocks
until the first commits, then sees the new `PaymentPending` row and is rejected with 409.
The same method is reused at **confirm** as defence‑in‑depth.

> **PostgreSQL alternative.** If the platform is ever moved to PostgreSQL, replace the
> locking SELECT with either a `SELECT ... FOR UPDATE` over the candidate rows inside a
> `SERIALIZABLE`/`REPEATABLE READ` transaction, or — preferably — a GiST **exclusion
> constraint** on `(vehicle_id WITH =, tsrange(pickup,return) WITH &&)` filtered to the
> reserving statuses, which lets the database itself reject overlaps. The service layer is
> unchanged; only this repository method swaps implementation.

---

## F. Booking recovery implementation

* **Server:** `GET /api/checkout/active` returns the caller's most‑recent resumable
  booking (`Draft`, `DriverSelected`, or **non‑expired** `PaymentPending`), excluding
  lapsed holds. `GET /api/checkout/{id}` restores a specific owned booking.
* **Client:** the driver‑selection and payment pages call `getActiveCheckout()` when their
  in‑memory intent is missing (refresh / new tab / error) and **restore** the funnel
  instead of redirecting. The reusable `ResumeBookingBanner` surfaces
  *"You have an unfinished booking. Continue where you left off."* with **Continue**
  (routes to the correct step via `checkoutStepHref`) and **Discard**.

```csharp
// CheckoutService.cs — recovery query (lazy‑expiry aware)
private async Task<Booking?> FindResumableBookingAsync(Guid userId, CancellationToken ct)
{
    var nowUtc = DateTime.UtcNow;
    var resumable = BookingStatusPolicy.ResumableStatuses; // Draft, DriverSelected, PaymentPending
    return await _context.Bookings
        .Include(b => b.Vehicle).ThenInclude(v => v!.Images)
        .Where(b => b.UserId == userId
            && resumable.Contains(b.Status)
            && !(b.Status == BookingStatus.PaymentPending
                 && b.HoldExpiresAt != null && b.HoldExpiresAt <= nowUtc))
        .OrderByDescending(b => b.UpdatedAt)
        .FirstOrDefaultAsync(ct);
}
```

---

## G. Hold expiration implementation

Two layers guarantee a stale hold never blocks anyone:

1. **Lazy expiry (always correct, no waiting):** every availability/overlap check ignores
   a `PaymentPending` row once `HoldExpiresAt <= now`, so the vehicle is effectively free
   the *instant* the hold lapses — even between sweeps.
2. **Background sweep (durable state):** `BookingStatusUpdateService` (runs every 2 min)
   flips lapsed holds to `Expired` and auto‑cancels drafts abandoned for 24h.

```csharp
// Infrastructure/Services/BookingStatusUpdateService.cs
var holdsToExpire = await context.Bookings
    .Where(b => b.Status == BookingStatus.PaymentPending
             && b.HoldExpiresAt.HasValue
             && b.HoldExpiresAt.Value <= nowUtc)
    .ToListAsync(cancellationToken);

foreach (var booking in holdsToExpire)
{
    booking.Status    = BookingStatus.Expired;   // vehicle released
    booking.UpdatedAt = nowUtc;
}
```

The hold is set when entering payment:

```csharp
// CheckoutService.BeginPaymentAsync
await _bookingRepository.ReserveVehicleAtomicAsync(
    booking, BookingStatus.PaymentPending,
    nowUtc, nowUtc.AddMinutes(HoldMinutes),   // HoldMinutes ← Booking:HoldMinutes (default 10)
    cancellationToken);
```

---

## H. Git diff excerpts (key hunks)

> The repository working tree carries unrelated line‑ending churn, so these are the
> *curated* hunks for this feature rather than a raw `git diff` dump.

**`Domain/Entities/Enums/BookingEnums.cs`**
```diff
         WaitingForDriver,
-        NoDriverAvailable
+        NoDriverAvailable,
+        // ─── Staged checkout lifecycle (double-booking prevention) ──────
+        Draft,            // Vehicle selected; does NOT reserve the vehicle
+        DriverSelected,   // Driver chosen (or self-drive); still does NOT reserve
+        PaymentPending,   // On the payment page; vehicle is HELD until HoldExpiresAt
+        Expired           // Hold elapsed without payment; vehicle released
     }
```

**`Domain/Entities/Booking.cs`**
```diff
         public DateTime? DriverLockedUntil { get; set; }
+
+        // ─── Vehicle hold (double-booking prevention), stored in UTC ─────
+        public DateTime? HoldStartedAt { get; set; }
+        public DateTime? HoldExpiresAt { get; set; }

         [Timestamp]
         public byte[]? RowVersion { get; set; }
```

**`Infrastructure/Repositories/VehicleRepository.cs` — `IsAvailableAsync`**
```diff
-        var hasOverlappingBooking = await _context.Bookings
-            .AnyAsync(b =>
-                b.VehicleId == vehicleId &&
-                b.Status != BookingStatus.Cancelled &&
-                b.Status != BookingStatus.Completed &&
-                b.PickupDate < endDate && b.ReturnDate > startDate, ct);
+        var nowUtc = DateTime.UtcNow;
+        var reserving = BookingStatusPolicy.ReservingStatuses;
+        var hasOverlappingBooking = await _context.Bookings
+            .AnyAsync(b =>
+                b.VehicleId == vehicleId &&
+                reserving.Contains(b.Status) &&
+                !(b.Status == BookingStatus.PaymentPending &&
+                  b.HoldExpiresAt != null && b.HoldExpiresAt <= nowUtc) &&
+                b.PickupDate < endDate && b.ReturnDate > startDate, ct);
```

**`Application/Services/CheckoutService.cs` — express checkout now commits atomically**
```diff
-            try { await _bookingRepository.SaveChangesAsync(cancellationToken); }
-            catch (DbUpdateConcurrencyException)
-            {
-                throw new ConflictException(
-                    "The selected driver was just assigned to another booking. ...");
-            }
+            // Re-checks overlap under SERIALIZABLE / UPDLOCK+HOLDLOCK, then commits
+            // booking + payment + driver lock in one transaction. Loser gets 409.
+            await _bookingRepository.ReserveVehicleAtomicAsync(
+                booking, BookingStatus.Confirmed, null, null, cancellationToken);
```

**`Api/Controllers/CheckoutController.cs` — payment (hold) endpoint**
```diff
+        [HttpPost("{bookingId:guid}/payment")]
+        public async Task<ActionResult<CheckoutStateDto>> BeginPayment(
+            Guid bookingId, CancellationToken cancellationToken)
+        {
+            var userId = TryGetUserId();
+            if (userId is null) return Unauthorized();
+            return Ok(await _checkoutService.BeginPaymentAsync(bookingId, userId.Value, cancellationToken));
+        }
```

**`Api/appsettings.json`**
```diff
   "Cors": { ... },
+  "Booking": {
+    "HoldMinutes": 10
+  },
   "Jwt": { ... }
```

**`app/(customer)/booking/payment/[vehicleId]/page.tsx` — no silent redirect; hold + recovery**
```diff
-  useEffect(() => {
-    if (status !== "loading" && !intent) {
-      router.replace(`/vehicles/${params.vehicleId}`);   // silent redirect
-    }
-  }, [intent, router, params.vehicleId, status]);
+  useEffect(() => {
+    if (status !== "authenticated" || !session?.accessToken) return;
+    // Resolve booking id (this tab's, else recover from DB), then place the hold.
+    // 409 → "taken"; expired hold → retry; nothing to recover → start-booking card.
+    ...
+    const held = await beginPayment(resolvedId, token);
+    setHoldSecondsLeft(held.holdSecondsRemaining ?? null);
+  }, [status, session, params.vehicleId]);
```
```diff
-      const res = await fetch(toApiUrl("/api/checkout"), { method: "POST", ... });
-      router.replace(payload.bookingId ? `/bookings/confirmation/${payload.bookingId}` : "/bookings");
+      const result = await confirmCheckout(bookingId, { paymentMethod: "credit_card" }, token);
+      router.replace(`/bookings/confirmation/${result.bookingId}`);
```

---

## I. Files modified / created

### Backend — modified
```
backend/Domain/Entities/Enums/BookingEnums.cs
backend/Domain/Entities/Booking.cs
backend/Infrastructure/Data/Configurations/BookingConfiguration.cs
backend/Infrastructure/Migrations/ApplicationDbContextModelSnapshot.cs
backend/Application/Interfaces/IBookingRepository.cs
backend/Infrastructure/Repositories/BookingRepository.cs
backend/Infrastructure/Repositories/VehicleRepository.cs
backend/Application/Services/ICheckoutService.cs
backend/Application/Services/CheckoutService.cs
backend/Application/DTOs/Checkout/CheckoutDtos.cs
backend/Api/Controllers/CheckoutController.cs
backend/Infrastructure/Services/BookingStatusUpdateService.cs
backend/Api/appsettings.json
backend/Tests/UnitTests/CheckoutServiceTests.cs
```

### Backend — new
```
backend/Domain/Entities/Enums/BookingStatusPolicy.cs
backend/Infrastructure/Migrations/20260603120000_AddBookingHoldFields.cs
backend/Infrastructure/Migrations/20260603120000_AddBookingHoldFields.Designer.cs
```

### Frontend — modified
```
frontend/app/(customer)/booking/payment/[vehicleId]/page.tsx
frontend/app/(customer)/booking/driver-selection/[vehicleId]/page.tsx
frontend/app/(customer)/bookings/page.tsx
```

### Frontend — new
```
frontend/api-clients/checkout/checkout.ts
frontend/app/(customer)/booking/_components/ResumeBookingBanner.tsx
```

---

## Verification

* **Frontend:** `tsc -p tsconfig.check.json --noEmit` → **0 errors** (all new/modified files
  included), run under the project's `strict` + `noUnusedLocals` settings.
* **Backend:** could not be compiled in the authoring sandbox (no .NET SDK, network
  restricted). Run locally:

  ```bash
  cd backend
  dotnet build Ares.slnx
  dotnet test                 # CheckoutServiceTests updated for the new flow
  dotnet run --project Api    # applies the AddBookingHoldFields migration on startup
  ```

  The migration is wired into the existing startup `Database.MigrateAsync()`, so the new
  columns/indexes are created automatically on first run.

### Suggested concurrency test (proves no double booking)
Fire two `POST /api/checkout/{id}/payment` requests for two different drafts on the **same
vehicle/overlapping window** in parallel: exactly one returns `200` (`PaymentPending`); the
other returns `409 "This vehicle has just been reserved by another customer."`

### Notes / follow‑ups
* `Draft`/`DriverSelected`/`PaymentPending` bookings will appear in the customer's bookings
  list unless filtered — consider hiding non‑terminal checkout states there.
* The legacy `payment/page.tsx` (non‑`[vehicleId]`) and the `checkout/[bookingId]` express
  flow were left intact; the express path is now race‑safe via the same atomic reservation.
