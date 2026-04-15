# Booking Payment Page

## Page Info

- **Route**: `/booking/payment`
- **Access**: 🔒 Protected — requires authenticated customer
- **Purpose**: Complete the payment step of the booking checkout. Displays available payment methods, accepts card/wallet details, authorizes payment, and handles 3DS and decline flows.

---

## API Endpoints

### `GET /api/v1/payments/methods`

Retrieve available payment methods for the user.

**Query Parameters**: `bookingId` (string)

**Response (200 OK)**

```json
{
  "availableMethods": [
    {
      "type": "credit_card | debit_card | digital_wallet | bank_transfer | pay_at_counter",
      "name": "string",
      "icon": "string (URL)",
      "supported": "boolean",
      "instantConfirmation": "boolean",
      "fees": "number",
      "description": "string"
    }
  ],
  "savedMethods": [
    {
      "id": "string",
      "type": "string",
      "last4": "string",
      "cardBrand": "string",
      "expiryMonth": "number",
      "expiryYear": "number",
      "isDefault": "boolean"
    }
  ]
}
```

**Error Responses**: 401 Unauthorized

---

### `POST /api/v1/payments/authorize`

Authorize payment for the booking.

**Request Body**

```json
{
  "bookingId": "string",
  "paymentMethodId": "string",
  "paymentDetails": {
    "cardNumber": "string",
    "expiryMonth": "number",
    "expiryYear": "number",
    "cvv": "string",
    "cardholderName": "string",
    "billingAddress": {
      "line1": "string",
      "city": "string",
      "state": "string",
      "postalCode": "string",
      "country": "string"
    }
  },
  "amount": "number",
  "currency": "string",
  "captureMode": "immediate | delayed | partial",
  "savePaymentMethod": "boolean",
  "deviceFingerprint": "string",
  "returnUrl": "string"
}
```

**Response (200 OK)**

```json
{
  "authorizationId": "string",
  "status": "authorized | declined | requires_action",
  "authorizationCode": "string",
  "requires3DS": "boolean",
  "threeDSUrl": "string",
  "declineReason": "string",
  "riskScore": "number",
  "expiresAt": "string (ISO 8601)"
}
```

**Error Responses**

| Status | Meaning                     |
| ------ | --------------------------- |
| 400    | Bad request                 |
| 401    | Unauthorized                |
| 402    | Payment required / declined |
