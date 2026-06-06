# Feature: Authentication Attack Protection

## Overview

Authentication Attack Protection provides comprehensive security measures against brute force attacks, session hijacking, and credential stuffing through rate limiting, account lockout, CAPTCHA integration, and breach database monitoring. This feature protects user accounts and platform integrity by detecting and preventing common authentication attacks.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature IDs

- F-SEC-AUTH-008: Authentication Attack Protection

## User Stories

### As a user
- I want my account protected from brute force attacks so that unauthorized users cannot guess my password
- I want to be notified of suspicious login attempts so that I can take action if my account is compromised
- I want my account temporarily locked after failed attempts so that attackers are prevented from continuing

### As a security administrator
- I want to detect credential stuffing attacks so that I can protect users whose credentials may have been breached
- I want to implement rate limiting so that automated attacks are slowed down
- I want to monitor authentication patterns so that I can identify and respond to threats

## Backend Specifications

### API Endpoints

**POST /api/auth/login** (Enhanced with protection)
- Rate limiting: 5 attempts per 15 minutes per IP address
- Account lockout: 5 failed attempts locks account for 30 minutes
- CAPTCHA required after 3 failed attempts
- Breach database check on successful login

**GET /api/auth/captcha**
- Purpose: Generate CAPTCHA challenge
- Response: CAPTCHA image or reCAPTCHA site key

**POST /api/auth/unlock-account**
- Purpose: Request account unlock email
- Rate limiting: 3 requests per hour

### Business Logic

**Brute Force Protection**:
1. Track failed login attempts per IP address (Redis)
2. Track failed login attempts per user account (database)
3. After 3 failures: Require CAPTCHA
4. After 5 failures: Lock account for 30 minutes
5. After 10 failures from same IP: Block IP for 1 hour
6. Reset counters on successful login

**Session Hijacking Prevention**:
1. Token expiration limits session duration
2. HTTP-only cookies prevent JavaScript access
3. Secure flag ensures HTTPS-only transmission
4. SameSite attribute prevents CSRF attacks
5. Optional: IP address validation
6. Optional: User agent validation

**Credential Stuffing Defense**:
1. Monitor for unusual login patterns (many failures from single IP)
2. Integration with Have I Been Pwned API
3. Check if email/password combination appears in breach databases
4. Force password reset for compromised credentials
5. Notify user of potential breach

**Rate Limiting Strategy**:
- Login endpoint: 5 attempts per 15 minutes per IP
- Password reset: 3 requests per hour per email
- Account unlock: 3 requests per hour per account
- Use Redis for fast counter management

### Authentication Requirements

**Security Measures**:
- bcrypt password hashing (work factor 10+)
- Account lockout after failed attempts
- CAPTCHA integration (reCAPTCHA v3)
- Rate limiting on all authentication endpoints
- Breach database monitoring
- Security event logging

## Database Specifications

### Schema Changes

**users table** (add columns):
```sql
ALTER TABLE users
ADD COLUMN failed_login_attempts INT DEFAULT 0,
ADD COLUMN account_locked_until TIMESTAMP NULL,
ADD COLUMN last_failed_login_at TIMESTAMP NULL,
ADD COLUMN password_compromised BOOLEAN DEFAULT FALSE;
```

**security_events table** (new):
```sql
CREATE TABLE security_events (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  event_type ENUM('login_success', 'login_failure', 'account_locked', 'account_unlocked', 'password_reset', 'suspicious_activity') NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Technology Stack

- Backend: .NET 8+ with C# (ASP.NET Core Web API)
- Database: MySQL 8.0+
- Cache: Redis (rate limiting counters)
- Libraries:
  - AspNetCoreRateLimit (rate limiting middleware)
  - reCAPTCHA.AspNetCore (CAPTCHA integration)
  - HaveIBeenPwned.NET (breach database API)

## Dependencies

- F-SEC-AUTH-001: Email/Password Authentication
- F-SEC-AUTH-006: Token-Based Session Management
- Redis cache infrastructure
- reCAPTCHA API keys

## Acceptance Criteria

1. Failed login attempts are tracked per IP and per user
2. Account is locked after 5 failed attempts for 30 minutes
3. CAPTCHA is required after 3 failed attempts
4. Rate limiting prevents excessive login attempts
5. Breach database is checked on successful login
6. Users are notified of compromised credentials
7. Security events are logged for monitoring
8. IP addresses with excessive failures are blocked
9. Account unlock process is available via email
10. All authentication endpoints have rate limiting

