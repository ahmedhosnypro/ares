# Feature: Privacy Controls (Database)

## Overview

Database schema for storing user privacy settings including profile visibility, app permissions, data sharing preferences, marketing preferences, cookie settings, data export requests, account deletion requests, and privacy settings audit log for GDPR compliance.

## Sprint Category

sprint-01

## Feature ID

F-AM-017

## Schema Changes

### PrivacySettings Table
```sql
CREATE TABLE PrivacySettings (
  setting_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  profile_visibility ENUM('public', 'private', 'friends') DEFAULT 'public',
  location_permission ENUM('granted', 'denied', 'not_requested') DEFAULT 'not_requested',
  camera_permission ENUM('granted', 'denied', 'not_requested') DEFAULT 'not_requested',
  photos_permission ENUM('granted', 'denied', 'not_requested') DEFAULT 'not_requested',
  microphone_permission ENUM('granted', 'denied', 'not_requested') DEFAULT 'not_requested',
  notifications_permission ENUM('granted', 'denied', 'not_requested') DEFAULT 'not_requested',
  analytics_data_sharing BOOLEAN DEFAULT TRUE,
  marketing_partners_sharing BOOLEAN DEFAULT FALSE,
  insurance_providers_sharing BOOLEAN DEFAULT TRUE,
  payment_processors_sharing BOOLEAN DEFAULT TRUE,
  mapping_services_sharing BOOLEAN DEFAULT TRUE,
  email_marketing BOOLEAN DEFAULT TRUE,
  sms_marketing BOOLEAN DEFAULT FALSE,
  push_marketing BOOLEAN DEFAULT TRUE,
  phone_marketing BOOLEAN DEFAULT FALSE,
  postal_marketing BOOLEAN DEFAULT FALSE,
  platform_promotions BOOLEAN DEFAULT TRUE,
  partner_promotions BOOLEAN DEFAULT FALSE,
  surveys BOOLEAN DEFAULT TRUE,
  product_updates BOOLEAN DEFAULT TRUE,
  functional_cookies BOOLEAN DEFAULT TRUE,
  analytics_cookies BOOLEAN DEFAULT TRUE,
  marketing_cookies BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  INDEX idx_user_privacy_settings (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### DataExportRequests Table
```sql
CREATE TABLE DataExportRequests (
  request_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  request_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  export_file_url VARCHAR(500),
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  error_message TEXT,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  INDEX idx_user_export_requests (user_id),
  INDEX idx_request_status (request_status),
  INDEX idx_requested_at (requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### AccountDeletionRequests Table
```sql
CREATE TABLE AccountDeletionRequests (
  request_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  request_status ENUM('pending', 'cancelled', 'completed') DEFAULT 'pending',
  deletion_reason VARCHAR(255),
  feedback TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  grace_period_ends_at TIMESTAMP NOT NULL,
  cancellation_token VARCHAR(255) UNIQUE,
  cancelled_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  INDEX idx_user_deletion_requests (user_id),
  INDEX idx_request_status (request_status),
  INDEX idx_grace_period_ends_at (grace_period_ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### PrivacySettingsAuditLog Table
```sql
CREATE TABLE PrivacySettingsAuditLog (
  log_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  setting_changed VARCHAR(100) NOT NULL,
  old_value VARCHAR(255),
  new_value VARCHAR(255),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  INDEX idx_user_privacy_audit (user_id),
  INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Relationships

- Users (1) → PrivacySettings (1): One user has one privacy settings record
- Users (1) → DataExportRequests (Many): One user can make multiple data export requests
- Users (1) → AccountDeletionRequests (Many): One user can make multiple account deletion requests (if cancelled)
- Users (1) → PrivacySettingsAuditLog (Many): One user can have many privacy settings audit log entries

## Indexes

- `idx_user_privacy_settings (user_id)`: Fast lookup of user privacy settings
- `idx_user_export_requests (user_id)`: Fast lookup of user data export requests
- `idx_request_status (request_status)`: Monitor pending export requests
- `idx_requested_at (requested_at)`: Time-based queries for export requests
- `idx_user_deletion_requests (user_id)`: Fast lookup of user account deletion requests
- `idx_grace_period_ends_at (grace_period_ends_at)`: Identify deletion requests ready for processing
- `idx_user_privacy_audit (user_id)`: Fast lookup of user privacy audit log
- `idx_changed_at (changed_at)`: Time-based queries for audit log

## Technology Stack

- **Database**: MySQL 8.0+ with InnoDB storage engine
