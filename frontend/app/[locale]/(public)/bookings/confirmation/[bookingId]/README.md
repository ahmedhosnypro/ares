# Booking Confirmation Page

## Page Info

- **Route**: `/bookings/confirmation/[bookingId]`
- **Access**: Public — accessible via unique confirmation token (guest bookings) or authenticated session
- **Purpose**: Display complete booking confirmation immediately after checkout, including booking reference, vehicle details, pickup instructions, pricing breakdown, QR code, and digital convenience actions.

---

## API Endpoints

### `GET /api/bookings/{bookingId}/confirmation`

Retrieve complete booking confirmation details.

**Authentication**: Booking owner JWT or guest confirmation token

**Error Responses**: 401 Unauthorized, 404 Not Found

---

### `POST /api/bookings/{bookingId}/resend-confirmation`

Resend confirmation email and/or SMS.

**Request Body**

```json
{
  "channels": ["email", "sms"]
}
```

**Response (200 OK)**

```json
{
  "emailSent": "boolean",
  "smsSent": "boolean",
  "sentAt": "string (ISO 8601)"
}
```

**Error Responses**: 400 Invalid request, 401 Unauthorized, 404 Not Found

---

### `GET /api/bookings/{bookingId}/qr-code`

Generate QR code for booking.

**Query Parameters**: `format` (`png | svg`, default: `png`), `size` (number, default: 300)

**Response**: Binary image data

---

### `GET /api/bookings/{bookingId}/pdf`

Generate PDF confirmation document.

**Response**: PDF file download

---

### `GET /api/bookings/{bookingId}/calendar-event`

Generate calendar event file.

**Query Parameters**: `format` (`ics | google | outlook`, default: `ics`)

**Response**: Calendar event file (.ics)
