# Driver Notifications Translation Tasks

## Page Overview

- Route: `/(dashboard)/driver/notifications`
- Source: app/[locale]/(dashboard)/driver/notifications/

## Translation Status

- [ ] Not started
- [x] In progress
- [x] Completed

## Shared Components

- NotificationsClient.tsx (from customer/notifications)
- DeleteNotificationDialog.tsx (from components/notifications)

## Component Discovery

- NotificationsClient.tsx (shared component)
  - Hardcoded strings in JSX:
    - "Driver Notifications | ARES Car Rental" (page title)
    - "New ride requests, assignments, approvals, rejections and cancellations — all your driver alerts in one place." (page description)
    - "fetchError" (error message)
    - "markAllError" (error message)
    - "deleteSuccess" (success message)
    - "deleteError" (error message)
    - "signInRequired" (authentication message)
    - "title" (page title)
    - "unreadCount" (count label)
    - "markAsReadTooltip" (tooltip)
    - "read" (status label)
    - "deleteTooltip" (tooltip)
    - "loading" (loading message)
    - "empty" (empty state message)
    - "markAllAsReadTooltip" (tooltip)

- DeleteNotificationDialog.tsx (shared component)
  - Hardcoded strings in JSX:
    - "title" (dialog title)
    - "confirmMessage" (confirmation message)
    - "cannotUndo" (warning message)
    - "cancel" (button text)
    - "delete" (button text)

## Translation Tasks

- [x] Create type file for driver notifications translations
- [x] Register type in message schema
- [x] Create English translation file
- [x] Create Arabic translation file
- [x] Update root translation files
- [x] Verify translations in UI
