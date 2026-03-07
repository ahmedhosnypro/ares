# Verify Email Page

## Page Info

- **Route**: `/verify-email`
- **Access**: Public (no authentication required)
- **Purpose**: Verify user email address using a token received via email. Also allows resending the verification link.

---

## API Endpoints

### `POST /api/auth/verify-email`

Verify user email address with token from email.

**Request Body**

```json
{
  "token": "string"
}
```

**Response (200 OK)**

```json
{
  "message": "Email verified successfully",
  "emailVerified": true
}
```

**Error Responses**

| Status | Meaning                     |
|--------|-----------------------------|
| 400    | Invalid or expired token    |
| 404    | Token not found             |

---

### `POST /api/auth/resend-verification`

Resend the email verification link.

**Request Body**

```json
{
  "email": "string"
}
```

**Response (200 OK)**

```json
{
  "message": "Verification email sent"
}
```

**Error Responses**

| Status | Meaning                                     |
|--------|---------------------------------------------|
| 429    | Too many requests (rate limit: 3 per hour per email) |
