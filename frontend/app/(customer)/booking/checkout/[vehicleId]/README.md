# Booking Checkout Page

## Page Info

- **Route**: `/booking/checkout/[vehicleId]`
- **Access**: 🔒 Protected — requires authenticated customer
- **Purpose**: Multi-step checkout flow: temporarily lock the vehicle, collect customer & driver info, select insurance and add-ons, review total, and accept terms before proceeding to payment.

---

## API Endpoints

### `POST /api/bookings/lock-vehicle`

Temporarily reserve a vehicle during checkout (15-minute lock).

**Request Body**

```json
{
  "vehicleId": "string (UUID)",
  "pickupDate": "string (ISO 8601)",
  "returnDate": "string (ISO 8601)",
  "sessionId": "string (UUID)"
}
```

**Response (200 OK)**

```json
{
  "lockId": "string (UUID)",
  "vehicleId": "string (UUID)",
  "expiresAt": "string (ISO 8601)",
  "durationMinutes": "number",
  "canExtend": "boolean"
}
```

---

### `PUT /api/bookings/lock-vehicle/{lockId}/extend`

Extend vehicle lock before expiration (max 2 extensions, +10 min each).

**Request Body**

```json
{
  "sessionId": "string (UUID)"
}
```

**Response (200 OK)**

```json
{
  "lockId": "string (UUID)",
  "expiresAt": "string (ISO 8601)",
  "extensionsRemaining": "number"
}
```

---

### `GET /api/users/{userId}/profile`

Retrieve user profile to pre-fill checkout form.

**Response (200 OK)**

```json
{
  "userId": "string (UUID)",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "dateOfBirth": "string (ISO 8601)",
  "driversLicense": {
    "number": "string",
    "issuingCountry": "string",
    "issuingState": "string",
    "expirationDate": "string (ISO 8601)"
  }
}
```

---

### `POST /api/bookings/validate-customer-info`

Validate customer information in real-time.

**Request Body**

```json
{
  "email": "string",
  "phone": "string",
  "dateOfBirth": "string (ISO 8601)",
  "driversLicense": {
    "number": "string",
    "expirationDate": "string (ISO 8601)"
  },
  "rentalStartDate": "string (ISO 8601)"
}
```

**Response (200 OK)**

```json
{
  "valid": "boolean",
  "errors": [
    {
      "field": "string",
      "message": "string",
      "code": "string"
    }
  ]
}
```

---

### `GET /api/insurance/options`

Retrieve available insurance options for the booking.

---

### `GET /api/services/available`

Retrieve available add-ons and equipment (GPS, child seat, etc.).

---

### `POST /api/bookings/calculate-total`

Calculate the complete booking total with all selected options.

**Error Responses**

| Status | Meaning              |
|--------|----------------------|
| 401    | Unauthorized         |
| 409    | Vehicle no longer available |
