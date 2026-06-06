# Feature: Two-Factor Authentication (2FA) - Database

## Overview

Database schema for Two-Factor Authentication (2FA) system including tables for 2FA configuration, backup codes, trusted devices, and audit logging. The schema supports multiple 2FA methods per user, secure storage of TOTP secrets and backup codes, device trust management with automatic expiration, and comprehensive audit trails for security monitoring and compliance.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

F-AM-011

## Database Tables

Four new tables:
- `user_two_factor`: 2FA configuration and secrets
- `user_backup_codes`: Backup codes for account recovery
- `user_trusted_devices`: Devices that skip 2FA verification
- `two_factor_audit_log`: Audit trail of 2FA actions

## Technology Stack

- **Database**: MySQL 8.0+ with InnoDB storage engine
- **ORM**: Entity Framework Core for .NET

## Implementation Notes

Refer to frontend specification for complete table definitions, column specifications, relationships, indexes, and constraints. Key security requirements:

- TOTP secrets must be encrypted at rest using AES-256
- Backup codes must be stored as SHA-256 hashes
- Trusted devices expire after 90 days of inactivity
- All 2FA actions must be logged in audit table

