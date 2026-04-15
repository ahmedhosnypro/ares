# Register Page

## Page Info

- **Route**: `/register`
- **Access**: Public (no authentication required)
- **Purpose**: Create a new user account with email and password.

---

## API Endpoint

### `POST /api/auth/register`

Create a new user account. Returns user ID and verification status.

**Request Body**

```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "acceptedTerms": "boolean",
  "acceptedPrivacy": "boolean"
}
```

**Response (201 Created)**

```json
{
  "userId": "string",
  "email": "string",
  "emailVerified": false,
  "message": "string"
}
```

**Error Responses**

| Status | Meaning                                             |
| ------ | --------------------------------------------------- |
| 400    | Invalid email format, weak password, missing fields |
| 409    | Email already registered                            |
| 429    | Too many registration attempts (5 per hour per IP)  |
