# Feature: User Data Privacy Controls

## Overview

User Data Privacy Controls enforce strict privacy boundaries ensuring that customers can only access their own personal information, bookings, payment methods, and account data. This feature implements comprehensive user ID verification, query filtering, and access control to protect user privacy and comply with data protection regulations (GDPR, CCPA). The system prevents unauthorized access to other users' data through database-level filtering, API endpoint protection, and information disclosure prevention.

## Sprint Category

sprint-01

## Feature ID

F-SEC-AUTHZ-004

## User Stories

### As a customer
I want to be confident that my personal information and booking history are private, so that other users cannot access my data.

### As a platform operator
I want to enforce strict user data privacy controls, so that the platform complies with GDPR, CCPA, and other data protection regulations.

### As a security administrator
I want all unauthorized user data access attempts to be blocked and logged, so that I can detect and prevent privacy violations.

### As a compliance officer
I want user data privacy controls to meet regulatory requirements, so that the platform avoids legal liability and maintains user trust.

## Frontend Specifications

### Pages

**User Dashboard** (`/dashboard`)
- Displays only current user's data
- No visibility into other users' information
- Clear indication of data ownership (e.g., "My Bookings", "My Profile")

**Booking History** (`/bookings`)
- Lists only current user's bookings
- Cannot view or search for other users' bookings
- Booking IDs from other users return 404 Not Found

**Profile Management** (`/profile`)
- Shows only current user's profile information
- Cannot access other users' profiles
- User IDs from other users return 404 Not Found

**Payment Methods** (`/payment-methods`)
- Displays only current user's saved payment methods
- Cannot view other users' payment information
- Payment method IDs from other users return 404 Not Found

### UI Components

**User Scope Indicator Component**
- Visual indicator showing data belongs to current user
- Displays user name and avatar
- Shows data ownership context (e.g., "Your Bookings")
- Prevents confusion about data scope

**Private Data Table Component**
- Automatically filters data by user ownership
- Displays only current user's records
- Includes user-scoped search and filtering
- Shows record counts scoped to user

**Access Denied Component**
- Displays 404 Not Found for unauthorized resource access
- Does not reveal existence of resources owned by other users
- Provides helpful message without information disclosure
- Redirects to user dashboard

### User Flows

**User Viewing Own Data Flow**:
1. User logs in with customer role
2. System loads user dashboard with user_id context
3. User navigates to bookings page
4. System queries bookings WHERE user_id = current_user_id
5. System displays only user's bookings
6. User can view, modify, cancel own bookings
7. All operations scoped to user's data

**User Attempting Cross-User Access Flow**:
1. User attempts to access booking ID belonging to another user
2. System receives request with booking_id parameter
3. System queries booking WHERE id = booking_id AND user_id = current_user_id
4. Query returns no results (booking not owned by user)
5. System returns 404 Not Found (not 403 Forbidden)
6. System logs unauthorized access attempt
7. User sees "Booking not found" message
8. User cannot determine if booking exists

**User Searching Bookings Flow**:
1. User enters search query in booking history
2. System constructs search query with user_id filter
3. Query: SELECT * FROM bookings WHERE user_id = current_user_id AND vehicle_name LIKE '%query%'
4. System returns only matching bookings owned by user
5. User sees filtered results
6. No indication of bookings owned by other users

### Data Requirements

**From Backend APIs**:
- User ID from authenticated session
- User-scoped booking list
- User-scoped profile information
- User-scoped payment methods
- User-scoped preferences and settings

**To Backend APIs**:
- User ID in all requests (from JWT token)
- Resource IDs for ownership verification
- Search queries with automatic user filtering

## Backend Specifications

### API Endpoints

**GET /api/users/me**
- Purpose: Retrieve current user's profile
- Authentication: Required (JWT token with Customer role)
- Authorization: Automatically scoped to user_id from token
- Response: User profile information
- Status codes: 200 (success), 401 (unauthorized)

**PUT /api/users/me**
- Purpose: Update current user's profile
- Authentication: Required (JWT token with Customer role)
- Authorization: Automatically scoped to user_id from token
- Request body: Profile update data
- Response: Updated user profile
- Status codes: 200 (success), 401 (unauthorized), 400 (validation error)

**GET /api/users/me/bookings**
- Purpose: Retrieve current user's bookings
- Authentication: Required (JWT token with Customer role)
- Authorization: Automatically filtered by user_id from token
- Query parameters: status, date_range
- Response: Array of bookings owned by user
- Status codes: 200 (success), 401 (unauthorized)

**GET /api/users/me/bookings/:bookingId**
- Purpose: Retrieve specific booking details
- Authentication: Required (JWT token with Customer role)
- Authorization: Verify booking owned by user
- Response: Booking details if owned by user
- Status codes: 200 (success), 401 (unauthorized), 404 (not found or not owned)

**PUT /api/users/me/bookings/:bookingId**
- Purpose: Update booking information
- Authentication: Required (JWT token with Customer role)
- Authorization: Verify booking owned by user before update
- Request body: Booking update data
- Response: Updated booking details
- Status codes: 200 (success), 401 (unauthorized), 404 (not found or not owned), 400 (validation error)

**DELETE /api/users/me/bookings/:bookingId**
- Purpose: Cancel booking
- Authentication: Required (JWT token with Customer role)
- Authorization: Verify booking owned by user before cancellation
- Response: Cancellation confirmation
- Status codes: 204 (no content), 401 (unauthorized), 404 (not found or not owned)

**GET /api/users/me/payment-methods**
- Purpose: Retrieve current user's saved payment methods
- Authentication: Required (JWT token with Customer role)
- Authorization: Automatically filtered by user_id from token
- Response: Array of payment methods owned by user
- Status codes: 200 (success), 401 (unauthorized)

**GET /api/users/me/preferences**
- Purpose: Retrieve current user's preferences and settings
- Authentication: Required (JWT token with Customer role)
- Authorization: Automatically scoped to user_id from token
- Response: User preferences
- Status codes: 200 (success), 401 (unauthorized)

### Request Schemas

**Profile Update Request**:
```
{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "phone": "string (optional)",
  "address": "object (optional)",
  "preferences": "object (optional)"
}
```

**Booking Update Request**:
```
{
  "startDate": "string (optional, ISO 8601)",
  "endDate": "string (optional, ISO 8601)",
  "additionalServices": "array (optional)"
}
```

### Response Schemas

**User Profile Response**:
```
{
  "id": "number",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string"
  },
  "emailVerified": "boolean",
  "phoneVerified": "boolean",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

**User Bookings Response**:
```
{
  "bookings": [
    {
      "id": "number",
      "userId": "number (always matches current user)",
      "vehicleId": "number",
      "vehicleName": "string",
      "supplierId": "number",
      "supplierName": "string",
      "startDate": "string (ISO 8601)",
      "endDate": "string (ISO 8601)",
      "status": "string (pending, confirmed, active, completed, cancelled)",
      "totalPrice": "number",
      "createdAt": "string (ISO 8601)"
    }
  ],
  "total": "number",
  "page": "number",
  "pageSize": "number"
}
```

**Payment Methods Response**:
```
{
  "paymentMethods": [
    {
      "id": "number",
      "userId": "number (always matches current user)",
      "type": "string (credit_card, debit_card, paypal)",
      "last4": "string (last 4 digits)",
      "expiryMonth": "number",
      "expiryYear": "number",
      "isDefault": "boolean",
      "createdAt": "string (ISO 8601)"
    }
  ]
}
```

**Error Response (404 Not Found)**:
```
{
  "error": "Resource not found",
  "message": "The requested resource does not exist",
  "statusCode": 404
}
```

### Business Logic

**User Ownership Verification Logic**:
```
function verifyUserOwnership(resourceType, resourceId, userId) {
  // 1. Query resource from database
  const resource = database.query(
    `SELECT * FROM ${resourceType} WHERE id = ? AND user_id = ?`,
    [resourceId, userId]
  );
  
  // 2. If resource not found or not owned, return false
  if (!resource) {
    return false;
  }
  
  // 3. Resource exists and is owned by user
  return true;
}
```

**Query Filtering Logic**:
```
function buildUserQuery(baseQuery, userId) {
  // 1. Parse base query
  const query = parseQuery(baseQuery);
  
  // 2. Add user_id filter to WHERE clause
  query.where.push(`user_id = ${userId}`);
  
  // 3. Ensure user_id filter cannot be overridden
  query.immutableFilters.push('user_id');
  
  // 4. Return modified query
  return query.build();
}
```

**Cross-User Access Prevention**:
- All user API endpoints automatically filter by user_id from JWT token
- Resource ownership verified before any read, update, or delete operation
- Unauthorized access returns 404 Not Found (not 403 Forbidden) to prevent information disclosure
- All cross-user access attempts logged for security monitoring
- Database queries use parameterized queries to prevent SQL injection

**Information Disclosure Prevention**:
- Return 404 Not Found instead of 403 Forbidden for unauthorized access
- Do not reveal existence of resources owned by other users
- Error messages do not contain user-specific information
- API responses do not include data from other users
- Search results do not show bookings from other users

**Sensitive Data Protection**:
- Payment method details are masked (show only last 4 digits)
- Full credit card numbers never returned in API responses
- Personal information (SSN, driver's license) encrypted at rest
- Audit trail for all access to sensitive data

### Authentication Requirements

**Required Authentication**:
- Valid JWT token in Authorization header
- Token must contain user_id claim
- Token must have Customer role
- User account must be active and not suspended

**Authorization Checks**:
- Extract user_id from JWT token
- Verify user_id matches resource owner
- Automatically filter all queries by user_id
- Log all authorization failures

## Database Specifications

### Schema Changes

**bookings table** (modifications):
- Ensure `user_id` column exists: INT, NOT NULL, foreign key to users.id
- Add index on `user_id` for efficient filtering
- Add composite index on `(user_id, id)` for ownership checks

**payment_methods table** (modifications):
- Ensure `user_id` column exists: INT, NOT NULL, foreign key to users.id
- Add index on `user_id` for efficient filtering
- Ensure sensitive data is encrypted at rest

**user_preferences table** (modifications):
- Ensure `user_id` column exists: INT, NOT NULL, foreign key to users.id
- Add unique index on `user_id` (one preference record per user)

**user_access_log table** (new):
- `id` column: INT, primary key, auto-increment
- `user_id` column: INT, foreign key to users.id
- `accessed_user_id` column: INT, foreign key to users.id (user whose data was accessed)
- `resource_type` column: VARCHAR(50), type of resource accessed
- `resource_id` column: INT, ID of resource accessed
- `action` column: VARCHAR(50), action attempted (read, update, delete)
- `authorized` column: BOOLEAN, whether access was authorized
- `ip_address` column: VARCHAR(45), IP address of request
- `user_agent` column: TEXT, user agent string
- `created_at` column: TIMESTAMP, when access occurred

### Table Definitions

**user_access_log table**:
```sql
CREATE TABLE user_access_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  accessed_user_id INT NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  authorized BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (accessed_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_accessed_user_id (accessed_user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_authorized (authorized)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

**bookings ↔ users**: Many-to-One
- Many bookings belong to one user
- Foreign key: bookings.user_id → users.id
- On Delete: RESTRICT (cannot delete user with active bookings)

**payment_methods ↔ users**: Many-to-One
- Many payment methods belong to one user
- Foreign key: payment_methods.user_id → users.id
- On Delete: CASCADE (delete payment methods when user deleted)

**user_preferences ↔ users**: One-to-One
- One preference record per user
- Foreign key: user_preferences.user_id → users.id
- On Delete: CASCADE (delete preferences when user deleted)

**user_access_log ↔ users**: Many-to-One
- Many access log entries for one user
- Foreign key: user_access_log.user_id → users.id
- Foreign key: user_access_log.accessed_user_id → users.id
- On Delete: CASCADE (delete logs when user deleted)

### Indexes

**bookings table**:
- Index on `user_id` for filtering bookings by user
- Composite index on `(user_id, id)` for ownership verification
- Composite index on `(user_id, status)` for status-based queries

**payment_methods table**:
- Index on `user_id` for filtering payment methods by user
- Composite index on `(user_id, is_default)` for default payment method lookup

**user_preferences table**:
- Unique index on `user_id` (one preference record per user)

**user_access_log table**:
- Index on `user_id` for user-specific log queries
- Index on `accessed_user_id` for tracking access to specific users
- Index on `created_at` for temporal queries
- Index on `authorized` for filtering unauthorized access attempts

## Technology Stack

- **Backend**: .NET 8+ with C#, ASP.NET Core Web API
- **Database**: MySQL 8.0+ with InnoDB storage engine
- **Frontend**: Next.js 14+ with TypeScript, React 18+
- **Authentication**: JWT tokens with user_id claim
- **Authorization**: Middleware-based ownership verification
- **Encryption**: AES-256 for sensitive data at rest

## Implementation Notes

### Security Considerations

**Defense in Depth**:
- User privacy enforced at multiple layers (API, business logic, database)
- Never rely solely on client-side filtering
- Always verify ownership on server side
- Use parameterized queries to prevent SQL injection

**Information Disclosure Prevention**:
- Return 404 Not Found instead of 403 Forbidden for unauthorized access
- Do not reveal existence of resources owned by other users
- Sanitize error messages to prevent information leakage
- Do not include user-specific data in error responses

**Sensitive Data Protection**:
- Encrypt sensitive data at rest (payment methods, driver's license)
- Mask sensitive data in API responses (show only last 4 digits)
- Never log sensitive data in application logs
- Use secure connections (HTTPS) for all API requests

**Audit Trail**:
- Log all cross-user access attempts
- Log all ownership verification failures
- Retain access logs for compliance (7 years for GDPR)
- Monitor for patterns of unauthorized access attempts

### Performance Optimization

**Database Optimization**:
- Index all user_id foreign keys
- Use composite indexes for common query patterns
- Cache user-scoped queries when appropriate
- Use database views for complex user-scoped queries

**Query Optimization**:
- Always include user_id in WHERE clause
- Use covering indexes for user-scoped queries
- Avoid N+1 queries with eager loading
- Use pagination for large result sets

### Error Handling

**Ownership Verification Errors**:
- 404 Not Found: Resource does not exist or not owned by user
- 401 Unauthorized: User not authenticated
- 400 Bad Request: Invalid resource ID format
- Log all ownership verification failures

### Testing Strategy

**Unit Tests**:
- Test ownership verification logic with various scenarios
- Test query filtering with different user IDs
- Test error handling for unauthorized access
- Test information disclosure prevention

**Integration Tests**:
- Test end-to-end user data privacy
- Test cross-user access prevention
- Test audit logging functionality
- Test performance with large datasets

### Compliance

**GDPR Compliance**:
- User data privacy controls meet GDPR requirements
- Access logging provides audit trail for data access
- Users can request data export and deletion
- Information disclosure prevention protects personal data

**CCPA Compliance**:
- User data privacy controls meet CCPA requirements
- Users can opt-out of data sharing
- Access logging provides transparency

**Principle of Least Privilege**:
- Users have access only to their own data
- No visibility into other users' personal information
- Admin override requires separate authorization

## Related Requirements

- REQ-SEC-6: Role-Based Access Control (RBAC)
- REQ-SEC-7: Data Protection and Privacy
- REQ-SEC-8: Audit Logging and Monitoring
- REQ-COMP-1: GDPR Compliance
- REQ-COMP-2: CCPA Compliance

## Related Features

- F-SEC-AUTHZ-001: Role-Based Access Control (RBAC)
- F-SEC-AUTHZ-002: Application-Level Separation
- F-SEC-AUTHZ-003: Supplier Data Isolation
- F-SEC-AUTHZ-005: Admin Override with Audit Trail
- F-SEC-DATA-001: Data Encryption at Rest
- F-SEC-DATA-006: GDPR Compliance Features

## Success Metrics

- Zero cross-user data access incidents
- Ownership verification response time < 10ms
- 100% of user queries automatically filtered
- Audit log completeness > 99.99%
- User confidence in privacy protection > 4.5/5.0
- GDPR compliance audit score > 95%
