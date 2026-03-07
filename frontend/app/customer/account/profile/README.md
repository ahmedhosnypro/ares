# Account Profile Page

## Page Info

- **Route**: `/account/profile`
- **Access**: 🔒 Protected — requires authenticated customer
- **Purpose**: View and update personal information, profile photo, address, emergency contact, and language/currency preferences.

---

## API Endpoints

### `GET /api/users/{userId}/profile`

Retrieve complete user profile.

**Response (200 OK)**

```json
{
  "userId": "string (UUID)",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "emailVerified": "boolean",
  "phone": "string",
  "phoneVerified": "boolean",
  "dateOfBirth": "string (ISO date)",
  "profilePhotoUrl": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "country": "string"
  },
  "emergencyContact": {
    "name": "string",
    "phone": "string",
    "relationship": "string"
  },
  "languagePreference": "string",
  "currencyPreference": "string",
  "profileCompleteness": "number (0-100)",
  "verificationStatus": {
    "email": "boolean",
    "phone": "boolean",
    "driverLicense": "boolean",
    "kyc": "none | basic | standard | enhanced"
  }
}
```

**Error Responses**: 401 Unauthorized, 403 Forbidden, 404 Not Found

---

### `PUT /api/users/{userId}/profile`

Update user profile information.

**Request Body**

```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "dateOfBirth": "string (ISO date)",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "country": "string"
  },
  "emergencyContact": {
    "name": "string",
    "phone": "string",
    "relationship": "string"
  },
  "languagePreference": "string",
  "currencyPreference": "string"
}
```

**Response (200 OK)**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "verificationRequired": {
    "email": "boolean",
    "phone": "boolean"
  }
}
```

**Error Responses**: 400 Validation errors, 401 Unauthorized, 409 Email/phone already in use

---

### `POST /api/users/{userId}/profile/photo`

Upload or update profile photo.

**Request Body**: `multipart/form-data` with `photo` file field.

**Error Responses**: 400 Invalid file type/size, 401 Unauthorized
