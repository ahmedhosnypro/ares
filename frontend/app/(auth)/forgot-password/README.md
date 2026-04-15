# Forgot Password Page

## Page Info

- **Route**: `/forgot-password`
- **Access**: Public (no authentication required)
- **Purpose**: Initiate the password reset flow by email, then complete reset with the token received.

---

## API Endpoints

### `POST /api/auth/forgot-password`

Initiate password reset — sends a reset link to the provided email.

**Request Body**

```json
{
  "email": "string"
}
```

**Response (200 OK)**

```json
{
  "message": "If an account exists with this email, a password reset link has been sent"
}
```

**Error Responses**

| Status | Meaning                                              |
| ------ | ---------------------------------------------------- |
| 429    | Too many requests (rate limit: 3 per hour per email) |

---

### `POST /api/auth/reset-password`

Complete password reset using the token from email.

**Request Body**

```json
{
  "token": "string",
  "newPassword": "string"
}
```

**Response (200 OK)**

```json
{
  "message": "Password reset successful"
}
```

**Error Responses**

| Status | Meaning                                 |
| ------ | --------------------------------------- |
| 400    | Invalid or expired token, weak password |
| 404    | Token not found                         |
