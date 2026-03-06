# Checkout Session Page

## Page Info

- **Route**: `/checkout-session/[sessionId]`
- **Access**: Public — Stripe redirect landing page, no authentication required
- **Purpose**: Handle the return from a Stripe embedded checkout. Reads the `sessionId` from the URL, verifies the payment status with the backend, then shows a success or failure message. If successful, fetches the `bookingId` and renders the booking confirmation.

---

## API Endpoints

### `POST /api/check-checkout-session/:sessionId`

Verify the Stripe checkout session status. On success, the backend marks the booking as `Paid`.

**URL Params**

| Param       | Description              |
|-------------|--------------------------|
| `sessionId` | Stripe checkout session ID from the URL |

**Request**: No body.

**Response**

| Status | Meaning                                              |
|--------|------------------------------------------------------|
| 200    | Payment confirmed — booking status updated to `Paid` |
| 204    | Session not found or payment not completed           |
| 400    | Invalid session ID                                   |

---

### `GET /api/booking-id/:sessionId`

After confirming payment, retrieve the booking `_id` linked to the Stripe session.

**URL Params**

| Param       | Description              |
|-------------|--------------------------|
| `sessionId` | Stripe checkout session ID |

**Response — 200 OK**

```json
{ "bookingId": "string" }
```

**Error Responses**

| Status | Meaning                              |
|--------|--------------------------------------|
| 204    | No booking found for this session ID |
