# Booking Page

## Page Info

- **Route**: `/booking/[id]`
- **Access**: 🔒 Authenticated customers
- **Purpose**: View full details of a single booking — car info, pickup/return locations, dates, driver details, and status. Customers can cancel eligible bookings from this page.

---

## API Endpoints

### `GET /api/booking/:id/:language`

Fetch full booking details.

**URL Params**

| Param      | Description                        |
|------------|------------------------------------|
| `id`       | Booking `_id`                      |
| `language` | Language code for localized fields |

**Response — 200 OK**

```json
{
  "_id": "string",
  "car": {
    "_id": "string",
    "name": "string",
    "image": "string",
    "supplier": { "_id": "string", "fullName": "string" }
  },
  "driver": { "_id": "string", "fullName": "string", "email": "string" },
  "pickupLocation": { "_id": "string", "name": "string" },
  "dropOffLocation": { "_id": "string", "name": "string" },
  "from": "string (ISO 8601)",
  "to": "string (ISO 8601)",
  "price": "number",
  "status": "Pending | Deposit | Paid | Reserved | Cancelled",
  "payLater": "boolean"
}
```

**Error Responses**

| Status | Meaning                           |
|--------|-----------------------------------|
| 401    | Not authenticated                 |
| 403    | Booking does not belong to user   |
| 404    | Booking not found                 |

---

### `POST /api/cancel-booking/:id`

Cancel an eligible booking.

**URL Params**

| Param | Description   |
|-------|---------------|
| `id`  | Booking `_id` |

**Request**: No body.

**Response**

| Status | Meaning                                       |
|--------|-----------------------------------------------|
| 200    | Booking cancelled successfully                |
| 400    | Booking cannot be cancelled (wrong status)    |
| 403    | Booking does not belong to the current user   |
| 404    | Booking not found                             |
