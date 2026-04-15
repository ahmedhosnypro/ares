# Checkout Page

## Page Info

- **Route**: `/checkout/[id]`
- **Access**: Public — supports both authenticated users and guests
- **Purpose**: Complete a car booking for a specific car (`id` is the car `_id`). Collects driver details (from profile if logged in, or a guest form), pickup/return location, dates, and payment method. Supports Pay Later, Stripe embedded checkout, and PayPal. On cancellation, the temporary booking is deleted and the user is redirected to `/`.

---

## API Endpoints

### `GET /api/car/:id/:language`

Fetch full car details to display on the booking summary.

**URL Params**

| Param      | Description                        |
| ---------- | ---------------------------------- |
| `id`       | Car `_id`                          |
| `language` | Language code for localized fields |

**Response — 200 OK**

```json
{
  "_id": "string",
  "name": "string",
  "supplier": { "_id": "string", "fullName": "string" },
  "price": "number",
  "image": "string",
  "type": "string",
  "gearbox": "string",
  "seats": "number",
  "deposit": "number"
}
```

---

### `POST /api/validate-email`

Guest only. Check that the driver's email is not blacklisted or already in use.

**Request Body**

```json
{ "email": "string" }
```

**Response**

| Status | Meaning              |
| ------ | -------------------- |
| 200    | Email is valid       |
| 400    | Email already exists |

---

### `POST /api/checkout`

Create the booking. Used for Pay Later and as the final step after PayPal verification.

**Request Body**

```json
{
  "car": "string (_id)",
  "pickupLocation": "string (_id)",
  "dropOffLocation": "string (_id)",
  "from": "string (ISO 8601)",
  "to": "string (ISO 8601)",
  "driver": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "birthDate": "string"
  },
  "price": "number",
  "payLater": "boolean"
}
```

**Response — 200 OK**

```json
{ "_id": "string" }
```

---

### `POST /api/create-checkout-session`

Create a Stripe embedded checkout session. The Stripe SDK renders the payment form inline. After payment, Stripe redirects the browser to `/checkout-session/:sessionId`.

**Request Body**

```json
{
  "bookingId": "string",
  "amount": "number",
  "currency": "string",
  "locale": "string",
  "returnUrl": "string"
}
```

**Response — 200 OK**

```json
{ "clientSecret": "string" }
```

---

### `POST /api/create-paypal-order`

Create a PayPal order for payment.

**Request Body**

```json
{
  "bookingId": "string",
  "amount": "number",
  "currency": "string"
}
```

**Response — 200 OK**

```json
{ "orderId": "string" }
```

---

### `POST /api/check-paypal-order/:bookingId/:orderId`

Verify PayPal payment completion after the user approves the order.

**URL Params**

| Param       | Description     |
| ----------- | --------------- |
| `bookingId` | Booking `_id`   |
| `orderId`   | PayPal order ID |

**Response**

| Status | Meaning                         |
| ------ | ------------------------------- |
| 200    | Payment confirmed, booking paid |
| 400    | Order not found or failed       |

---

### `DELETE /api/delete-temp-booking/:bookingId/:sessionId`

Delete the temporary booking if the user cancels before completing payment.

**URL Params**

| Param       | Description             |
| ----------- | ----------------------- |
| `bookingId` | Temporary booking `_id` |
| `sessionId` | Stripe session ID       |

**Response**

| Status | Meaning         |
| ------ | --------------- |
| 200    | Booking deleted |
