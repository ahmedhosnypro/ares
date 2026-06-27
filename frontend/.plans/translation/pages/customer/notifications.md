# Customer Notifications Translation Tasks

## Page Overview

- Route: `/(customer)/notifications`
- Source: app/[locale]/(customer)/notifications/

## Translation Status

- [ ] Not started
- [ ] In progress
- [x] Completed

## Shared Components

- `components/notifications/DeleteNotificationDialog.tsx` — already uses
  `deleteNotificationDialog` and `common` namespaces; no additional changes
  needed.

## Component Discovery

- `app/[locale]/(customer)/notifications/page.tsx` — server component, defines
  static metadata.
- `app/[locale]/(customer)/notifications/NotificationsClient.tsx` — client
  component, renders the full notifications UI (list, empty state, loading,
  sign-in gate, snackbar toasts, mark-all-as-read, delete dialog).

## Translation Tasks

- [x] Create `shared/messages/types/customer/notifications.ts`
- [x] Register `CustomerNotificationsLabels` in `shared/messages/types/message.ts`
- [x] Create `shared/messages/en/customer/notifications.ts`
- [x] Create `shared/messages/ar/customer/notifications.ts`
- [x] Add namespace to root `shared/messages/en.ts` and `shared/messages/ar.ts`
- [x] Translate `page.tsx` metadata via `generateMetadata`
- [x] Translate all hardcoded UI strings in `NotificationsClient.tsx`
