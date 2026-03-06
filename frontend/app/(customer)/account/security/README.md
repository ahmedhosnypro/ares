# Account Security Page

## Page Info

- **Route**: `/account/security`
- **Access**: 🔒 Protected — requires authenticated customer
- **Purpose**: Centralized security dashboard: change password, update email/phone, manage active sessions, view login history, and enable 2FA.

---

## API Endpoints

### `POST /api/account/security/password`

Change account password. Terminates all other active sessions.

**Request Body**

```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**Response (200 OK)**

```json
{
  "success": true,
  "message": "string",
  "sessionsTerminated": "number"
}
```

---

### `POST /api/account/security/email`

Initiate email address change — sends verification to new email.

**Request Body**

```json
{
  "newEmail": "string",
  "password": "string"
}
```

**Response (200 OK)**

```json
{
  "success": true,
  "message": "string",
  "verificationRequired": true
}
```

---

### `GET /api/account/security/sessions`

Retrieve all active login sessions.

**Response (200 OK)**

```json
{
  "sessions": [
    {
      "sessionId": "string",
      "deviceType": "string",
      "deviceName": "string",
      "browser": "string",
      "os": "string",
      "ipAddress": "string",
      "location": "string",
      "lastActivity": "string (ISO 8601)",
      "isCurrent": "boolean"
    }
  ],
  "totalSessions": "number"
}
```

---

### `DELETE /api/account/security/sessions/{sessionId}`

Terminate a specific session.

**Response (200 OK)**

```json
{
  "success": true,
  "message": "Session terminated successfully."
}
```

---

### `POST /api/account/security/sessions/logout-all`

Log out from all sessions except the current one.

---

### `GET /api/account/security/login-history`

Retrieve paginated login history for security monitoring.

**Query Parameters**: `page`, `limit`, `startDate`, `endDate`
