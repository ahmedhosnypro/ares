# Customer Info Translation Tasks

## Page Overview

- Route: `/(customer)/info`
- Source: app/[locale]/(customer)/info/

## Translation Status

- [ ] Not started
- [ ] In progress
- [x] Completed

## Findings

The `frontend/app/[locale]/(customer)/info/` directory contains only a `README.md`
documentation file. There is no `page.tsx`, `layout.tsx`, or `_components/`
directory. The route is a placeholder that was never implemented.

A repository-wide search for `/info`, `customer.info`, and `customerInfo`
references returns only matches inside the README itself. No other code
references this route.

The functionality described in the README (driver license upload/update/delete)
is fully implemented and already translated inside `/(customer)/account/profile`
through the following components:

- `app/[locale]/(customer)/account/profile/page.tsx`
- `components/profile/SharedProfileContainer.tsx`
- `components/profile/DriverLicenseCard.tsx`
- `components/profile/DriverLicenseModal.tsx`

Those files consume the `customer.accountProfile` namespace, which is already
present in:

- `shared/messages/types/customer/account-profile.ts`
- `shared/messages/en/customer/account-profile.ts`
- `shared/messages/ar/customer/account-profile.ts`

## Shared Components

None — the route has no source files.

## Component Discovery

None — the route has no source files.

## Translation Tasks

No translation tasks required. The page is a placeholder (README only) and is
not linked from any other code in the frontend.
