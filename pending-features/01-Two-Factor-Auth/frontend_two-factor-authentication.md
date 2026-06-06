# Feature: Two-Factor Authentication (2FA)

## Overview

Two-Factor Authentication (2FA) provides an optional additional security layer for user accounts, requiring a second verification factor beyond the password. This feature supports multiple 2FA methods including SMS OTP, authenticator apps (TOTP), email OTP, backup codes, and biometric verification. Users can manage trusted devices to skip 2FA on recognized devices while maintaining security on new or suspicious login attempts. The system includes comprehensive recovery options to prevent account lockout while maintaining robust security standards.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

F-AM-011

## Dependencies

- F-AM-002: Secure Authentication System (must be implemented first)
- R-UM-002: User Management Requirements

## User Stories

**US-1**: As a security-conscious user, I want to enable two-factor authentication on my account, so that unauthorized users cannot access my account even if they obtain my password.

**US-2**: As a user with 2FA enabled, I want to receive a one-time password via SMS when logging in, so that I can verify my identity using my phone.

**US-3**: As a user with 2FA enabled, I want to use an authenticator app (Google Authenticator, Authy) to generate time-based codes, so that I don't depend on SMS delivery.

**US-4**: As a user with 2FA enabled, I want to receive a one-time password via email as an alternative method, so that I have flexibility in how I verify my identity.

**US-5**: As a user setting up 2FA, I want to generate and save backup codes, so that I can access my account if I lose access to my primary 2FA method.

**US-6**: As a mobile app user, I want to use biometric authentication (fingerprint, Face ID) as my second factor, so that I can authenticate quickly and securely.

**US-7**: As a user with 2FA enabled, I want to mark my personal devices as trusted, so that I don't need to enter 2FA codes every time I log in from home.


**US-8**: As a user who lost my 2FA device, I want to use my backup codes to access my account, so that I'm not permanently locked out.

**US-9**: As a corporate account user, I want 2FA to be enforced by my organization, so that all company accounts maintain consistent security standards.

**US-10**: As a platform administrator, I want to require 2FA for high-value accounts or users with elevated privileges, so that sensitive accounts have additional protection.

## Frontend Specifications

### Pages

#### 1. Two-Factor Authentication Setup Page (`/settings/security/2fa`)

**Purpose**: Enable and configure two-factor authentication for the user's account.

**Layout**:
- Page header with "Two-Factor Authentication" title
- Current 2FA status indicator (Enabled/Disabled)
- 2FA method selection tabs (SMS, Authenticator App, Email, Biometric)
- Setup instructions for selected method
- QR code display (for authenticator app method)
- Backup codes section with download button
- Enable/Disable toggle
- Test 2FA button
- Trusted devices management section

**Sections**:
- **Status Section**: Shows whether 2FA is currently enabled
- **Method Selection**: Tabs or radio buttons for choosing 2FA method
- **Setup Instructions**: Step-by-step guide for selected method
- **Verification Section**: Input field to verify 2FA setup
- **Backup Codes**: Display and download backup codes
- **Trusted Devices**: List of devices that skip 2FA

**Responsive Design**:
- Mobile: Single column, full-width components
- Tablet: Centered content with max-width 700px
- Desktop: Two-column layout (setup on left, info on right)

#### 2. 2FA Verification Page (`/login/verify-2fa`)

**Purpose**: Prompt users to enter their second factor during login.

**Layout**:
- Header with "Verify Your Identity" title
- User identification (email or phone number)
- 2FA method indicator (SMS, Authenticator, Email)
- Code input field (6-digit OTP)
- "Trust this device" checkbox
- Submit button
- "Use backup code" link
- "Try another method" link
- "Didn't receive code?" resend button

**Responsive Design**:
- Mobile: Full-screen modal with large input field
- Tablet/Desktop: Centered modal (400px width)


#### 3. Backup Code Recovery Page (`/login/backup-code`)

**Purpose**: Allow users to authenticate using backup codes when primary 2FA method is unavailable.

**Layout**:
- Header with "Use Backup Code" title
- Instructions text
- Backup code input field (format: XXXX-XXXX-XXXX)
- Submit button
- "Back to 2FA verification" link
- Help text about backup codes

#### 4. Trusted Devices Management Page (`/settings/security/trusted-devices`)

**Purpose**: View and manage devices that skip 2FA verification.

**Layout**:
- Page header with "Trusted Devices" title
- List of trusted devices with details
- "Remove" button for each device
- "Remove All" button
- Last used timestamp for each device

### UI Components

#### TwoFactorSetupWizard Component

**Purpose**: Guide users through 2FA setup process with step-by-step instructions.

**Props**:
- `method`: 'sms' | 'authenticator' | 'email' | 'biometric'
- `onComplete`: Callback when setup is complete
- `onCancel`: Callback to cancel setup

**Steps**:
1. Method selection
2. Phone/email verification (for SMS/email methods)
3. QR code scan (for authenticator method)
4. Code verification
5. Backup codes display
6. Confirmation

**Features**:
- Progress indicator showing current step
- Back/Next navigation buttons
- Clear instructions for each step
- Error handling and retry logic

#### AuthenticatorQRCode Component

**Purpose**: Display QR code for authenticator app setup.

**Display**:
- QR code image (generated from TOTP secret)
- Manual entry code (for users who can't scan)
- Instructions for popular authenticator apps
- "I've scanned the code" button

**Supported Apps**:
- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password
- LastPass Authenticator


#### TwoFactorCodeInput Component

**Purpose**: Specialized input field for entering 6-digit 2FA codes.

**Features**:
- Auto-focus on mount
- Auto-advance between digits
- Paste support (handles full code paste)
- Auto-submit when 6 digits entered
- Clear button
- Countdown timer (for time-based codes)
- Resend button (for SMS/email methods)

**Validation**:
- Only numeric input allowed
- Exactly 6 digits required
- Real-time validation feedback

#### BackupCodesDisplay Component

**Purpose**: Display and manage backup codes for account recovery.

**Display**:
- List of 10 backup codes (format: XXXX-XXXX-XXXX)
- Used/unused status for each code
- "Download as Text" button
- "Print Codes" button
- "Copy All" button
- Warning message about secure storage

**Features**:
- Codes displayed in monospace font
- Visual indication of used codes (strikethrough)
- Regenerate codes button (invalidates old codes)
- Confirmation dialog before regeneration

#### TrustedDevicesList Component

**Purpose**: Display and manage trusted devices that skip 2FA.

**Display**:
- Device name and type (Desktop, Mobile, Tablet)
- Browser and OS information
- Location (city, country)
- Date added
- Last used timestamp
- "Remove" button for each device
- "This device" badge for current device

**Features**:
- Confirmation dialog before removing device
- Bulk remove option
- Auto-removal after 90 days of inactivity

#### TwoFactorStatusBadge Component

**Purpose**: Display current 2FA status in user profile or settings.

**Display**:
- Badge with "2FA Enabled" or "2FA Disabled" text
- Color coding (green for enabled, gray for disabled)
- Icon (shield with checkmark or shield with X)
- Method indicator (SMS, Authenticator, Email, Biometric)


### User Flows

#### Enable 2FA with Authenticator App Flow

1. User navigates to `/settings/security/2fa`
2. User sees 2FA is currently disabled
3. User clicks "Enable Two-Factor Authentication" button
4. System displays method selection screen
5. User selects "Authenticator App" method
6. System generates TOTP secret and displays QR code
7. User opens authenticator app on phone
8. User scans QR code with authenticator app
9. Authenticator app displays 6-digit code
10. User enters code in verification field
11. System validates code against TOTP secret
12. System generates 10 backup codes
13. System displays backup codes with download option
14. User downloads or copies backup codes
15. User confirms backup codes are saved
16. System enables 2FA and updates account status
17. System displays success message
18. System sends confirmation email

#### Login with 2FA Flow

1. User enters email and password on login page
2. System validates credentials
3. System detects 2FA is enabled for account
4. System checks if current device is trusted
5. If not trusted: System redirects to 2FA verification page
6. System sends OTP via user's preferred method (SMS/email)
7. User receives OTP on phone/email
8. User enters 6-digit OTP code
9. User optionally checks "Trust this device" checkbox
10. User clicks "Verify" button
11. System validates OTP code
12. If valid: System creates session token
13. If "Trust this device" checked: System adds device to trusted list
14. System redirects to dashboard
15. If invalid: System shows error and allows retry (3 attempts)

#### Backup Code Recovery Flow

1. User attempts to log in with 2FA
2. User doesn't have access to primary 2FA method
3. User clicks "Use backup code" link
4. System displays backup code input page
5. User retrieves backup code from secure storage
6. User enters backup code (format: XXXX-XXXX-XXXX)
7. User clicks "Verify" button
8. System validates backup code
9. System marks backup code as used
10. System creates session token and logs in user
11. System displays warning about remaining backup codes
12. System recommends generating new backup codes


#### Disable 2FA Flow

1. User navigates to `/settings/security/2fa`
2. User sees 2FA is currently enabled
3. User clicks "Disable Two-Factor Authentication" button
4. System displays confirmation dialog with warning
5. User confirms they want to disable 2FA
6. System prompts for password verification
7. User enters current password
8. System validates password
9. System disables 2FA for account
10. System removes all trusted devices
11. System invalidates all backup codes
12. System displays success message
13. System sends security notification email

### Data Requirements

#### 2FA Setup API Requests

**POST /api/auth/2fa/setup**
```
{
  "method": "authenticator",
  "userId": "user_123"
}

Response:
{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/CarRental:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=CarRental",
  "backupCodes": [
    "1234-5678-9012",
    "2345-6789-0123",
    "3456-7890-1234",
    "4567-8901-2345",
    "5678-9012-3456",
    "6789-0123-4567",
    "7890-1234-5678",
    "8901-2345-6789",
    "9012-3456-7890",
    "0123-4567-8901"
  ]
}
```

**POST /api/auth/2fa/verify-setup**
```
{
  "userId": "user_123",
  "method": "authenticator",
  "code": "123456"
}

Response:
{
  "success": true,
  "message": "Two-factor authentication enabled successfully.",
  "twoFactorEnabled": true
}
```

**POST /api/auth/2fa/disable**
```
{
  "userId": "user_123",
  "password": "current_password"
}

Response:
{
  "success": true,
  "message": "Two-factor authentication disabled.",
  "twoFactorEnabled": false
}
```


#### 2FA Verification API Requests

**POST /api/auth/2fa/verify**
```
{
  "userId": "user_123",
  "sessionId": "temp_session_abc",
  "method": "authenticator",
  "code": "123456",
  "trustDevice": true
}

Response:
{
  "success": true,
  "sessionToken": "encrypted_jwt_token",
  "deviceId": "device_xyz",
  "expiresAt": "2026-03-25T10:30:00Z"
}
```

**POST /api/auth/2fa/send-code**
```
{
  "userId": "user_123",
  "method": "sms"
}

Response:
{
  "success": true,
  "message": "Verification code sent to +1***-***-7890",
  "expiresIn": 300
}
```

**POST /api/auth/2fa/verify-backup-code**
```
{
  "userId": "user_123",
  "backupCode": "1234-5678-9012"
}

Response:
{
  "success": true,
  "sessionToken": "encrypted_jwt_token",
  "remainingBackupCodes": 9,
  "message": "Backup code verified. You have 9 backup codes remaining."
}
```

#### Trusted Devices API

**GET /api/auth/2fa/trusted-devices**
```
Response:
{
  "devices": [
    {
      "deviceId": "device_abc",
      "deviceName": "Chrome on Windows",
      "deviceType": "Desktop",
      "browser": "Chrome 120",
      "os": "Windows 11",
      "location": "New York, US",
      "ipAddress": "192.168.1.1",
      "dateAdded": "2026-02-01T10:00:00Z",
      "lastUsed": "2026-02-23T09:30:00Z",
      "isCurrent": true
    }
  ]
}
```

**DELETE /api/auth/2fa/trusted-devices/:deviceId**
```
Response:
{
  "success": true,
  "message": "Trusted device removed successfully."
}
```


## Backend Specifications

### API Endpoints

#### POST /api/auth/2fa/setup
**Purpose**: Initialize 2FA setup for a user account.

**Authentication**: Required (JWT token)

**Request Body**:
- `method`: string (required) - 2FA method: 'sms', 'authenticator', 'email', 'biometric'
- `phoneNumber`: string (optional) - Required for SMS method
- `email`: string (optional) - Required for email method

**Response**: TOTP secret, QR code URL, and backup codes

**Business Logic**:
- Generate cryptographically secure TOTP secret (Base32 encoded)
- Create QR code URL in otpauth format
- Generate 10 unique backup codes
- Store secret and backup codes in database (encrypted)
- Set 2FA status to 'pending' until verified

#### POST /api/auth/2fa/verify-setup
**Purpose**: Verify and activate 2FA after initial setup.

**Authentication**: Required (JWT token)

**Request Body**:
- `code`: string (required) - 6-digit verification code
- `method`: string (required) - 2FA method being verified

**Response**: Success confirmation and updated 2FA status

**Business Logic**:
- Retrieve TOTP secret from database
- Validate code against secret (allow 30-second time window)
- If valid: Update user account to enable 2FA
- If invalid: Return error (allow 3 attempts before lockout)
- Send confirmation email to user

#### POST /api/auth/2fa/verify
**Purpose**: Verify 2FA code during login process.

**Authentication**: Temporary session token

**Request Body**:
- `code`: string (required) - 6-digit verification code
- `trustDevice`: boolean (optional) - Whether to trust current device
- `deviceFingerprint`: string (optional) - Device identification hash

**Response**: Full session token and device ID

**Business Logic**:
- Validate code against user's TOTP secret or sent OTP
- Check code hasn't been used before (replay attack prevention)
- If valid: Generate full session token
- If trustDevice: Store device fingerprint in trusted devices
- Increment failed attempt counter on invalid code
- Lock account after 5 failed attempts


#### POST /api/auth/2fa/send-code
**Purpose**: Send OTP code via SMS or email.

**Authentication**: Temporary session token

**Request Body**:
- `method`: string (required) - 'sms' or 'email'

**Response**: Confirmation that code was sent

**Business Logic**:
- Generate 6-digit random OTP code
- Store code in database with 5-minute expiration
- Send code via SMS gateway or email service
- Rate limit: Maximum 3 codes per 15 minutes
- Log all code generation attempts

#### POST /api/auth/2fa/verify-backup-code
**Purpose**: Authenticate using backup code when primary method unavailable.

**Authentication**: Temporary session token

**Request Body**:
- `backupCode`: string (required) - Backup code in format XXXX-XXXX-XXXX

**Response**: Session token and remaining backup codes count

**Business Logic**:
- Retrieve user's backup codes from database
- Validate backup code matches and hasn't been used
- Mark backup code as used
- Generate full session token
- Send security notification email
- Recommend generating new backup codes if less than 3 remain

#### POST /api/auth/2fa/disable
**Purpose**: Disable two-factor authentication for account.

**Authentication**: Required (JWT token)

**Request Body**:
- `password`: string (required) - Current password for verification

**Response**: Confirmation of 2FA disabled

**Business Logic**:
- Verify current password
- Remove TOTP secret from database
- Invalidate all backup codes
- Remove all trusted devices
- Update user account to disable 2FA
- Send security notification email

#### GET /api/auth/2fa/trusted-devices
**Purpose**: Retrieve list of trusted devices for user account.

**Authentication**: Required (JWT token)

**Response**: Array of trusted device objects

**Business Logic**:
- Query trusted devices for current user
- Include device metadata (type, browser, OS, location)
- Sort by last used date (most recent first)
- Mark current device


#### DELETE /api/auth/2fa/trusted-devices/:deviceId
**Purpose**: Remove a device from trusted devices list.

**Authentication**: Required (JWT token)

**Response**: Confirmation of device removal

**Business Logic**:
- Verify device belongs to current user
- Remove device from trusted devices table
- Send notification email if device removed remotely
- Allow removal of current device (will require 2FA on next login)

### Request/Response Schemas

**TwoFactorSetupRequest**:
- method: string (enum: 'sms', 'authenticator', 'email', 'biometric')
- phoneNumber: string (optional, E.164 format)
- email: string (optional, valid email format)

**TwoFactorSetupResponse**:
- success: boolean
- secret: string (Base32 encoded TOTP secret)
- qrCodeUrl: string (otpauth:// URL)
- backupCodes: string[] (array of 10 codes)

**TwoFactorVerifyRequest**:
- code: string (6 digits)
- trustDevice: boolean (optional, default false)
- deviceFingerprint: string (optional, device hash)

**TwoFactorVerifyResponse**:
- success: boolean
- sessionToken: string (JWT)
- deviceId: string (if device trusted)
- expiresAt: string (ISO 8601 timestamp)

### Business Logic

**TOTP Code Generation**:
- Use HMAC-SHA1 algorithm
- 30-second time step
- 6-digit code output
- Allow ±1 time window for clock skew (90-second total window)

**Backup Code Generation**:
- Generate 10 unique codes
- Format: XXXX-XXXX-XXXX (12 characters, 3 groups of 4)
- Use cryptographically secure random number generator
- Hash codes before storing in database
- Each code can only be used once

**Device Fingerprinting**:
- Combine: User Agent, IP address, screen resolution, timezone
- Generate SHA-256 hash of combined data
- Store hash in trusted devices table
- Automatically remove devices after 90 days of inactivity

**Rate Limiting**:
- 2FA verification: 5 attempts per 15 minutes per user
- OTP code sending: 3 codes per 15 minutes per user
- Setup attempts: 3 attempts per hour per user


### Authentication Requirements

**User Authentication**: All 2FA management endpoints require valid JWT token from authenticated user.

**Temporary Session**: 2FA verification during login uses temporary session token with limited permissions.

**Password Verification**: Disabling 2FA requires current password verification for security.

**Rate Limiting**: Implement rate limiting on all 2FA endpoints to prevent brute force attacks.

**Audit Logging**: Log all 2FA-related actions (enable, disable, verification attempts, backup code usage).

## Database Specifications

### Schema Changes

**New Table: user_two_factor**

Purpose: Store 2FA configuration and secrets for user accounts.

**New Table: user_backup_codes**

Purpose: Store backup codes for account recovery.

**New Table: user_trusted_devices**

Purpose: Store devices that skip 2FA verification.

**New Table: two_factor_audit_log**

Purpose: Audit trail of all 2FA-related actions.

### Table Definitions

#### user_two_factor

```sql
CREATE TABLE user_two_factor (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  method ENUM('sms', 'authenticator', 'email', 'biometric') NOT NULL,
  totp_secret VARCHAR(255) NULL,
  phone_number VARCHAR(20) NULL,
  email VARCHAR(255) NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_method (user_id, method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
- `id`: Primary key
- `user_id`: Foreign key to users table
- `method`: 2FA method type
- `totp_secret`: Encrypted TOTP secret (for authenticator method)
- `phone_number`: Phone number for SMS OTP
- `email`: Email address for email OTP
- `is_enabled`: Whether 2FA is active
- `is_verified`: Whether setup has been verified
- `created_at`: Record creation timestamp
- `updated_at`: Last modification timestamp

**Constraints**:
- Foreign key to users table with CASCADE delete
- Unique constraint on (user_id, method) to prevent duplicate methods
- totp_secret must be encrypted at rest using AES-256


#### user_backup_codes

```sql
CREATE TABLE user_backup_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_unused (user_id, is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
- `id`: Primary key
- `user_id`: Foreign key to users table
- `code_hash`: SHA-256 hash of backup code
- `is_used`: Whether code has been used
- `used_at`: Timestamp when code was used
- `created_at`: Record creation timestamp

**Constraints**:
- Foreign key to users table with CASCADE delete
- Index on (user_id, is_used) for efficient unused code queries
- Store only hashed codes, never plain text

#### user_trusted_devices

```sql
CREATE TABLE user_trusted_devices (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  device_type ENUM('Desktop', 'Mobile', 'Tablet') NOT NULL,
  browser VARCHAR(100) NULL,
  os VARCHAR(100) NULL,
  ip_address VARCHAR(45) NOT NULL,
  location VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_device (user_id, device_fingerprint),
  INDEX idx_user_active (user_id, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
- `id`: Primary key
- `user_id`: Foreign key to users table
- `device_fingerprint`: SHA-256 hash of device characteristics
- `device_name`: Human-readable device name
- `device_type`: Device category
- `browser`: Browser name and version
- `os`: Operating system name and version
- `ip_address`: IP address when device was trusted
- `location`: Geographic location (city, country)
- `created_at`: When device was added to trusted list
- `last_used_at`: Last time device was used for login
- `expires_at`: When trust expires (90 days from creation)

**Constraints**:
- Foreign key to users table with CASCADE delete
- Unique constraint on (user_id, device_fingerprint)
- Index on (user_id, expires_at) for cleanup queries


#### two_factor_audit_log

```sql
CREATE TABLE two_factor_audit_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  action ENUM('setup', 'verify_setup', 'verify_login', 'send_code', 'use_backup_code', 'disable', 'trust_device', 'remove_device') NOT NULL,
  method VARCHAR(50) NULL,
  success BOOLEAN NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT NULL,
  error_message VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_action_created (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
- `id`: Primary key
- `user_id`: Foreign key to users table
- `action`: Type of 2FA action performed
- `method`: 2FA method used (if applicable)
- `success`: Whether action succeeded
- `ip_address`: IP address of request
- `user_agent`: Browser user agent string
- `error_message`: Error details if action failed
- `created_at`: Timestamp of action

**Constraints**:
- Foreign key to users table with CASCADE delete
- Index on (user_id, created_at) for user activity queries
- Index on (action, created_at) for system-wide analytics

### Relationships

**user_two_factor → users**: Many-to-one relationship. Each user can have multiple 2FA methods configured.

**user_backup_codes → users**: Many-to-one relationship. Each user has multiple backup codes (typically 10).

**user_trusted_devices → users**: Many-to-one relationship. Each user can have multiple trusted devices.

**two_factor_audit_log → users**: Many-to-one relationship. Each user has multiple audit log entries.

### Indexes

**Performance Indexes**:
- `idx_user_unused` on user_backup_codes (user_id, is_used): Fast lookup of unused backup codes
- `idx_user_active` on user_trusted_devices (user_id, expires_at): Efficient trusted device queries
- `idx_user_created` on two_factor_audit_log (user_id, created_at): User activity history queries
- `idx_action_created` on two_factor_audit_log (action, created_at): System-wide analytics

**Security Indexes**:
- Unique index on (user_id, method) in user_two_factor: Prevent duplicate 2FA methods
- Unique index on (user_id, device_fingerprint) in user_trusted_devices: Prevent duplicate trusted devices


## Technology Stack

- **Frontend**: Next.js 14+ with TypeScript, React 18+
- **Backend**: .NET 8+ with C#, ASP.NET Core Web API
- **Database**: MySQL 8.0+ with InnoDB storage engine
- **TOTP Library**: OtpNet (for .NET) or similar TOTP implementation
- **QR Code Generation**: QRCoder (for .NET) or similar library
- **SMS Gateway**: Twilio, AWS SNS, or similar service
- **Email Service**: SendGrid, AWS SES, or similar service
- **Encryption**: AES-256 for TOTP secret encryption at rest
- **Hashing**: SHA-256 for backup codes and device fingerprints

## Implementation Notes

### Security Considerations

1. **Secret Storage**: TOTP secrets must be encrypted at rest using AES-256 encryption with secure key management.

2. **Backup Code Storage**: Store only hashed backup codes (SHA-256), never plain text.

3. **Rate Limiting**: Implement strict rate limiting on verification endpoints to prevent brute force attacks.

4. **Time Window**: Allow ±1 time step (30 seconds) for TOTP validation to account for clock skew.

5. **Replay Prevention**: Track used TOTP codes within time window to prevent replay attacks.

6. **Device Fingerprinting**: Use multiple device characteristics for fingerprinting, but don't rely solely on it for security.

7. **Audit Logging**: Log all 2FA actions for security monitoring and compliance.

### User Experience Considerations

1. **Progressive Disclosure**: Don't overwhelm users with all 2FA options at once. Guide them through setup step-by-step.

2. **Clear Instructions**: Provide clear, visual instructions for each 2FA method, especially for authenticator app setup.

3. **Backup Codes Emphasis**: Strongly encourage users to save backup codes and provide multiple download/copy options.

4. **Trusted Devices**: Make it easy to trust frequently used devices while maintaining security.

5. **Recovery Options**: Provide clear recovery paths if users lose access to their 2FA method.

6. **Mobile Optimization**: Ensure 2FA verification works seamlessly on mobile devices.

### Accessibility Requirements

1. **Keyboard Navigation**: All 2FA setup and verification flows must be fully keyboard accessible.

2. **Screen Reader Support**: Provide clear ARIA labels for all 2FA components.

3. **Error Announcements**: Screen readers must announce validation errors and success messages.

4. **Time Extensions**: Provide option to extend OTP code expiration for users who need more time.

5. **Alternative Methods**: Offer multiple 2FA methods to accommodate different user needs and abilities.

### Testing Requirements

1. **Unit Tests**: Test TOTP generation, validation, and backup code logic.

2. **Integration Tests**: Test complete 2FA setup and verification flows.

3. **Security Tests**: Test rate limiting, replay prevention, and encryption.

4. **E2E Tests**: Test user flows from setup through login with 2FA.

5. **Load Tests**: Verify system can handle concurrent 2FA verifications.

