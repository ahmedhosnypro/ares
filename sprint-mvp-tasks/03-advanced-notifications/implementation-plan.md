# Advanced Notifications Implementation Plan

## Associated Documentation
Please refer to the detailed specification documents copied in this directory for exact requirements:
- [Backend Specs](./backend)
- [Frontend Specs](./frontend)

## Current State (Gap Analysis)
The application currently has a foundational `EmailService.cs` that can send basic emails. It completely lacks SMS notifications and web push notifications, which are critical for time-sensitive alerts like booking confirmations and pickup reminders.

## Implementation Steps

### Backend Tasks (.NET 8)
1. **SMS Gateway Integration:** Implement an `SmsService` using a provider like **Twilio** or **AWS SNS**. Add methods for sending short, time-sensitive booking confirmations and OTPs.
2. **Push Notification Service:** Integrate a web push provider (e.g., **Firebase Cloud Messaging** or **OneSignal**) or implement VAPID-based push notifications directly.
3. **Notification Orchestrator:** Update the `NotificationService` to orchestrate multi-channel delivery based on user preferences (e.g., send Push + Email for receipts, but SMS for immediate alerts).
4. **Database Models:** Update `User` and `NotificationSettings` tables to store device push tokens (`FCMToken`/`WebPushSubscription`) and SMS preferences/phone numbers.

### Frontend Tasks (Next.js)
1. **Push Notification Service Worker:** Create a service worker to intercept and display web push notifications when the application is in the background.
2. **Permission Prompts:** Build UI prompts to ask the user for Push Notification permissions at appropriate times (e.g., right after a booking is confirmed).
3. **User Settings Panel:** Update the customer profile settings page to allow users to toggle their preferred notification channels (Email, SMS, Push) for various event types.
4. **Phone Number Verification:** Build a UI flow to collect and verify phone numbers (via OTP) before enabling SMS notifications.
