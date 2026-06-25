# Admin — Edit Booking

## Page Info

- **Route**: `/admin/bookings/[id]/edit`
- **Access**: 🔒 Admin / Supplier
- **Purpose**: Edit an existing booking — update dates, locations, driver, price, and status. Admins can also cancel the booking from this page.

---

## API Endpoints

### `GET /api/admin/bookings/{id}`

Load existing booking data to pre-populate the edit form for Admin/Supplier.

**URL Params**

| Param | Description |
| ----- | ----------- |
| `id`  | Booking ID  |

**Response — 200 OK**

```json
{
  "id": "string",
  "bookingNumber": "string",
  "status": "string",
  "totalPrice": "number",
  "fromDate": "string (ISO 8601)",
  "toDate": "string (ISO 8601)",
  "pickupLocation": { "id": "string", "name": "string" },
  "dropOffLocation": { "id": "string", "name": "string" },
  "vehicle": { "id": "string", "name": "string", "pricePerDay": "number" },
  "driver": { "id": "string", "fullName": "string", "email": "string" },
  "supplier": { "id": "string", "fullName": "string" },
  "notes": "string"
}
```

---

### `PUT /api/admin/bookings/{id}/status`

Update the booking status (Pending / Confirmed / Paid / Cancelled, etc.). Full updates to booking details are not supported in the admin panel yet.

**URL Params**

| Param | Description |
| ----- | ----------- |
| `id`  | Booking ID  |

**Request Body**

```json
{ "status": "string" }
```

**Response**

| Status | Meaning                |
| ------ | ---------------------- |
| 200    | Booking status updated |
| 400    | Invalid request        |
| 401    | Unauthorized           |
| 404    | Booking not found      |
