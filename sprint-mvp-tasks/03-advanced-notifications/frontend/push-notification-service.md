# Feature: Push Notification Service

## Overview

The Push Notification Service enables sending real-time notifications directly to users' mobile devices and web browsers. This service supports rich notifications with images and actions, deep linking to app screens, user segmentation, and comprehensive delivery analytics. Push notifications are essential for engaging mobile app users with timely updates about bookings, reminders, and promotional offers.

## Sprint Category

sprint-mvp

## Feature IDs

F-INT-NOTIF-003

## User Stories

As a mobile app user, I want to receive push notifications for booking updates, so that I stay informed about my reservation status in real-time.

As a mobile app user, I want to receive push reminders before my pickup time, so that I don't miss my reservation.

As a mobile app user, I want to tap on a notification to open the relevant screen in the app, so that I can quickly access booking details.

As a mobile app user, I want to control which types of push notifications I receive, so that I only get alerts that matter to me.

As a marketing manager, I want to send targeted push notifications to specific user segments, so that I can deliver personalized promotional offers.

## Frontend Specifications

### Pages

**Notification Settings Page**
- Push notification toggle (master switch)
- Notification type preferences (booking updates, reminders, promotions, platform updates)
- Quiet hours configuration
- Test notification button
- Notification permission status

**Notification Center Page**
- List of received push notifications
- Unread notification count badge
- Notification categories/filters
- Mark as read/unread actions
- Delete notification action
- Deep link to relevant content

### UI Components

**Push Notification Permission Prompt**
- Native OS permission dialog
- Custom pre-permission explanation screen
- Benefits of enabling notifications
- Allow/Don't Allow buttons

**Notification Card**
- Notification icon/image
- Title and message text
- Timestamp
- Read/unread indicator
- Action buttons (if applicable)
- Swipe to delete gesture

**Notification Badge**
- Unread count indicator on app icon
- Unread count on notification center tab
- Auto-update on new notifications

**Rich Notification Display**
- Large image support
- Action buttons (Accept, Decline, View, etc.)
- Progress indicators for ongoing actions
- Expandable content

### User Flows

**Initial Permission Request**
1. User installs app and opens for first time
2. App shows pre-permission explanation screen
3. User taps "Enable Notifications"
4. OS shows native permission dialog
5. User grants or denies permission
6. App registers device token with backend

**Receiving Notification**
1. Backend sends push notification
2. Device receives notification
3. Notification appears in system tray
4. User taps notification
5. App opens to relevant screen
6. Notification marked as read

**Managing Preferences**
1. User navigates to notification settings
2. User toggles notification types
3. User sets quiet hours
4. Preferences saved to backend
5. Future notifications respect preferences

### Data Requirements

- Device token for push notifications
- User notification preferences
- Notification delivery status
- Notification interaction analytics
- Deep link URLs for app navigation

## Backend Specifications

### API Endpoints

**POST /api/notifications/push/register**
- Purpose: Register device token for push notifications
- Authentication: JWT token
- Request body: Device token, platform (iOS/Android), device info
- Response: Registration success, device ID

**DELETE /api/notifications/push/unregister**
- Purpose: Unregister device token
- Authentication: JWT token
- Request body: Device token
- Response: Unregistration success

**POST /api/notifications/push/send**
- Purpose: Send push notification
- Authentication: Internal service authentication
- Request body: User IDs or segments, notification content, deep link
- Response: Notification job ID, queued status

**POST /api/notifications/push/send-bulk**
- Purpose: Send push notification to multiple users
- Authentication: Internal service authentication
- Request body: User segment criteria, notification content
- Response: Bulk job ID, estimated recipient count

**GET /api/notifications/push/{notificationId}/status**
- Purpose: Check push notification delivery status
- Authentication: JWT token (admin only)
- Response: Delivery status, delivery count, failure count

**POST /api/notifications/push/webhook**
- Purpose: Receive delivery receipts from push provider
- Authentication: Webhook signature verification
- Request body: Provider-specific webhook payload
- Response: 200 OK acknowledgment

**PUT /api/notifications/push/preferences**
- Purpose: Update user push notification preferences
- Authentication: JWT token
- Request body: Notification type preferences, quiet hours
- Response: Updated preferences

**GET /api/notifications/push/preferences**
- Purpose: Get user push notification preferences
- Authentication: JWT token
- Response: Current notification preferences

**POST /api/notifications/push/track**
- Purpose: Track notification interaction (open, dismiss, action)
- Authentication: JWT token
- Request body: Notification ID, interaction type
- Response: Tracking recorded

### Request Schemas

**Register Device Request**
```
{
  "deviceToken": "fcm_token_abc123xyz...",
  "platform": "ios",
  "deviceInfo": {
    "model": "iPhone 14 Pro",
    "osVersion": "17.2",
    "appVersion": "2.1.0"
  },
  "timezone": "America/New_York"
}
```

**Send Push Notification Request**
```
{
  "recipients": {
    "userIds": ["user_123", "user_456"],
    "segments": null
  },
  "notification": {
    "title": "Pickup Reminder",
    "body": "Your Toyota Camry pickup is in 1 hour at Downtown Branch",
    "imageUrl": "https://cdn.example.com/vehicles/camry.jpg",
    "deepLink": "app://bookings/BK-12345",
    "actions": [
      {
        "id": "view",
        "title": "View Booking",
        "deepLink": "app://bookings/BK-12345"
      },
      {
        "id": "directions",
        "title": "Get Directions",
        "deepLink": "app://map?location=downtown-branch"
      }
    ]
  },
  "priority": "high",
  "scheduledAt": null,
  "expiresAt": "2026-03-01T11:00:00Z"
}
```

**Update Preferences Request**
```
{
  "enabledTypes": ["booking_updates", "pickup_reminders", "trip_updates"],
  "disabledTypes": ["promotions", "platform_updates"],
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00",
    "timezone": "America/New_York"
  }
}
```

### Response Schemas

**Register Device Response**
```
{
  "deviceId": "dev_abc123",
  "registered": true,
  "registeredAt": "2026-02-24T14:30:00Z"
}
```

**Send Push Response**
```
{
  "notificationId": "push_xyz789",
  "status": "queued",
  "recipientCount": 2,
  "queuedAt": "2026-02-24T14:30:00Z",
  "estimatedDelivery": "2026-02-24T14:30:05Z"
}
```

**Notification Status Response**
```
{
  "notificationId": "push_xyz789",
  "status": "delivered",
  "recipientCount": 2,
  "deliveredCount": 2,
  "failedCount": 0,
  "openedCount": 1,
  "sentAt": "2026-02-24T14:30:02Z",
  "deliveryStats": {
    "ios": {
      "sent": 1,
      "delivered": 1,
      "failed": 0
    },
    "android": {
      "sent": 1,
      "delivered": 1,
      "failed": 0
    }
  }
}
```

### Business Logic

**Push Provider Integration**
- Integrate with Firebase Cloud Messaging (FCM) for Android and iOS
- Integrate with Apple Push Notification Service (APNs) for iOS
- Configure provider credentials and certificates
- Implement provider-specific API clients
- Handle provider error codes and retry logic

**Device Token Management**
- Store device tokens per user (support multiple devices)
- Update tokens when they change
- Remove invalid/expired tokens
- Associate tokens with user accounts
- Support token refresh on app updates

**Notification Delivery**
- Route notifications to appropriate provider (FCM/APNs)
- Support rich notifications with images and actions
- Implement deep linking for app navigation
- Handle notification expiration
- Support silent notifications for background updates

**User Segmentation**
- Target users by booking status (active, upcoming, past)
- Target by user preferences (vehicle type, location)
- Target by engagement level (active, inactive)
- Target by platform (iOS, Android)
- Support custom segment criteria

**Preference Management**
- Store user notification preferences
- Apply preferences before sending
- Respect quiet hours based on user timezone
- Honor opt-out for specific notification types
- Provide granular control over notification categories

**Delivery Tracking**
- Store notification metadata in database
- Process delivery receipts from providers
- Track opens, dismissals, and action clicks
- Calculate engagement metrics
- Monitor delivery success rates

**Queue Management**
- Use message queue for asynchronous sending
- Implement retry logic for failed deliveries
- Priority queue for critical notifications
- Batch notifications for efficiency
- Rate limiting to comply with provider limits

### Authentication Requirements

- JWT token authentication for device registration
- JWT token authentication for preference management
- Internal service authentication for sending notifications
- Webhook signature verification for provider callbacks
- Admin role required for bulk sending and analytics

## Database Specifications

### Schema Changes

Create new tables for device registration, push notifications, and delivery tracking.

### Table Definitions

**PushDevices**
- DeviceId (VARCHAR(50), PRIMARY KEY): Unique device identifier
- UserId (VARCHAR(50), FOREIGN KEY): Device owner
- DeviceToken (VARCHAR(500), UNIQUE, NOT NULL): Provider device token
- Platform (ENUM: ios, android, web): Device platform
- DeviceModel (VARCHAR(100), NULL): Device model name
- OsVersion (VARCHAR(50), NULL): Operating system version
- AppVersion (VARCHAR(50), NULL): App version
- Timezone (VARCHAR(50), DEFAULT 'UTC'): Device timezone
- IsActive (BOOLEAN, DEFAULT TRUE): Active status
- RegisteredAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- LastSeenAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- UpdatedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

**PushNotifications**
- NotificationId (VARCHAR(50), PRIMARY KEY): Unique notification identifier
- Title (VARCHAR(255), NOT NULL): Notification title
- Body (TEXT, NOT NULL): Notification message
- ImageUrl (VARCHAR(500), NULL): Notification image URL
- DeepLink (VARCHAR(500), NULL): App deep link URL
- NotificationType (ENUM: booking_update, pickup_reminder, promotion, trip_update, platform_update, general): Notification category
- Priority (ENUM: low, normal, high, critical): Notification priority
- Status (ENUM: queued, sent, delivered, failed): Delivery status
- RecipientCount (INT, DEFAULT 0): Total recipients
- DeliveredCount (INT, DEFAULT 0): Successfully delivered
- FailedCount (INT, DEFAULT 0): Failed deliveries
- OpenedCount (INT, DEFAULT 0): Opened notifications
- ScheduledAt (DATETIME, NULL): Scheduled send time
- ExpiresAt (DATETIME, NULL): Notification expiration
- QueuedAt (DATETIME, NOT NULL): Time added to queue
- SentAt (DATETIME, NULL): Time sent to provider
- CreatedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- UpdatedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

**PushNotificationRecipients**
- RecipientId (INT, AUTO_INCREMENT, PRIMARY KEY)
- NotificationId (VARCHAR(50), FOREIGN KEY): Reference to PushNotifications
- UserId (VARCHAR(50), FOREIGN KEY): Recipient user
- DeviceId (VARCHAR(50), FOREIGN KEY): Target device
- Status (ENUM: queued, sent, delivered, failed, opened, dismissed): Delivery status
- ProviderMessageId (VARCHAR(255), NULL): Provider's message ID
- ErrorCode (VARCHAR(50), NULL): Error code if failed
- ErrorMessage (TEXT, NULL): Error description
- SentAt (DATETIME, NULL): Sent timestamp
- DeliveredAt (DATETIME, NULL): Delivered timestamp
- OpenedAt (DATETIME, NULL): Opened timestamp
- DismissedAt (DATETIME, NULL): Dismissed timestamp
- CreatedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- UpdatedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

**PushNotificationPreferences**
- PreferenceId (INT, AUTO_INCREMENT, PRIMARY KEY)
- UserId (VARCHAR(50), UNIQUE, FOREIGN KEY): User
- EnabledTypes (JSON, NOT NULL): Array of enabled notification types
- DisabledTypes (JSON, NOT NULL): Array of disabled notification types
- QuietHoursEnabled (BOOLEAN, DEFAULT FALSE): Quiet hours active
- QuietHoursStart (TIME, NULL): Quiet hours start time
- QuietHoursEnd (TIME, NULL): Quiet hours end time
- Timezone (VARCHAR(50), DEFAULT 'UTC'): User timezone
- CreatedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- UpdatedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

**PushNotificationActions**
- ActionId (INT, AUTO_INCREMENT, PRIMARY KEY)
- NotificationId (VARCHAR(50), FOREIGN KEY): Reference to PushNotifications
- ActionIdentifier (VARCHAR(100), NOT NULL): Action button ID
- ActionTitle (VARCHAR(255), NOT NULL): Action button text
- DeepLink (VARCHAR(500), NULL): Action deep link
- CreatedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### Relationships

- PushDevices.UserId → Users.UserId (many-to-one)
- PushNotifications → PushNotificationRecipients (one-to-many)
- PushNotificationRecipients.UserId → Users.UserId (many-to-one)
- PushNotificationRecipients.DeviceId → PushDevices.DeviceId (many-to-one)
- PushNotificationPreferences.UserId → Users.UserId (one-to-one)
- PushNotificationActions.NotificationId → PushNotifications.NotificationId (many-to-one)

### Indexes

- PushDevices: Index on (UserId, IsActive) for user device lookup
- PushDevices: Unique index on (DeviceToken) for token lookup
- PushNotifications: Index on (Status, QueuedAt) for queue processing
- PushNotificationRecipients: Index on (NotificationId, Status) for delivery tracking
- PushNotificationRecipients: Index on (UserId, CreatedAt) for user history
- PushNotificationPreferences: Unique index on (UserId) for preference lookup

## Technology Stack

- Backend: .NET 8+ with C#, ASP.NET Core Web API
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript (web push), React Native (mobile)
- Push Providers: Firebase Cloud Messaging (FCM), Apple Push Notification Service (APNs)
- Message Queue: RabbitMQ or Azure Service Bus for async processing

## Implementation Notes

**Provider Setup**
- Configure Firebase project for FCM
- Generate APNs certificates for iOS
- Set up provider credentials in backend
- Implement provider-specific payload formats
- Handle provider-specific error codes

**Mobile App Integration**
- Integrate FCM SDK in mobile app
- Request notification permissions on appropriate screens
- Register device token with backend on app launch
- Handle notification taps and deep linking
- Implement notification action handlers
- Update badge counts on notification receipt

**Web Push Integration**
- Implement service worker for web push
- Request notification permission
- Subscribe to push service
- Handle notification clicks
- Support desktop and mobile browsers

**Deep Linking Strategy**
- Define URL scheme for app navigation (app://bookings/123)
- Implement deep link routing in app
- Handle deep links when app is closed, backgrounded, or active
- Validate deep link parameters
- Fallback to home screen if deep link invalid

**Rich Notification Design**
- Use high-quality images (1200x600px recommended)
- Keep titles concise (under 50 characters)
- Keep body text actionable (under 150 characters)
- Limit action buttons to 2-3 per notification
- Test notifications on different devices and OS versions

**Segmentation Strategy**
- Define user segments based on behavior and preferences
- Create reusable segment definitions
- Test segments before bulk sending
- Monitor segment performance
- Refine segments based on engagement data

**Performance Considerations**
- Use message queue to prevent blocking
- Batch notifications for efficiency
- Implement exponential backoff for retries
- Cache user preferences for fast lookups
- Monitor queue depth and processing lag
- Use connection pooling for provider APIs

**Monitoring and Analytics**
- Track delivery rate, open rate, action rate
- Monitor by platform (iOS vs Android)
- Alert on sudden drops in delivery rate
- Track provider API response times
- Dashboard for push notification performance
- A/B test notification content and timing

**Best Practices**
- Request permission at contextually relevant moments
- Explain benefits before requesting permission
- Provide granular notification preferences
- Respect quiet hours and user preferences
- Avoid notification spam (limit frequency)
- Make notifications actionable and valuable
- Test notifications across devices and OS versions
- Monitor and optimize based on engagement metrics

## Source Documentation

- docs/05-features/integration/notification-services.md
- docs/01-analysis/bookcars/features-mobile.md
