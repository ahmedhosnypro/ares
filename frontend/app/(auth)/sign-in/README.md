# Login Page

## Page Info

- **Route**: `/login`
- **Access**: Public (no authentication required)
- **Purpose**: Authenticate a registered user and issue a session token to access protected routes.

---

## API Endpoint

### `POST /api/auth/login`

Authenticate a user with email and password. Returns a JWT token and basic user profile.

---

### Request Body

```json
{
  "email": "string",
  "password": "string",
  "stayConnected": "boolean"
}
```

| Field          | Type    | Required | Description                              |
|----------------|---------|----------|------------------------------------------|
| `email`        | string  | ✅       | Registered user email address            |
| `password`     | string  | ✅       | User password                            |
| `stayConnected`| boolean | ❌       | Extend session up to 400 days if `true`  |

---

### Response Body

**200 OK**

```json
{
  "token": "string",
  "expiresAt": "string (ISO 8601)",
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "roles": ["customer | admin"],
    "emailVerified": "boolean"
  }
}
```

**Error Responses**

| Status | Meaning                                         |
|--------|-------------------------------------------------|
| 401    | Invalid credentials                             |
| 403    | Account not verified, suspended, or locked      |
| 429    | Too many attempts (rate limit: 5 per 15 min)    |
