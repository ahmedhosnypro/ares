# Admin — Edit Booking

## Page Info

- **Route**: `/admin/bookings/[id]/edit`
- **Access**: 🔒 Admin / Supplier
- **Purpose**: Edit an existing booking — update dates, locations, driver, price, and status. Admins can also cancel the booking from this page.

---

## API Endpoints

### `GET /api/booking/:id/:language`

Load existing booking data to pre-populate the edit form.

**URL Params**

| Param      | Description                        |
|------------|------------------------------------|
| `id`       | Booking `_id`                      |
| `language` | Language code for localized fields |

**Response — 200 OK**

```json
{
  "_id": "string",
  "car": { "_id": "string", "name": "string", "price": "number" },
  "supplier": { "_id": "string", "fullName": "string" },
  "driver": { "_id": "string", "fullName": "string" },
  "pickupLocation": { "_id": "string", "name": "string" },
  "dropOffLocation": { "_id": "string", "name": "string" },
  "from": "string (ISO 8601)",
  "to": "string (ISO 8601)",
  "price": "number",
  "status": "string",
  "payLater": "boolean"
}
```

---

### `PUT /api/update-booking`

Save changes to the booking.

**Request Body**

```json
{
  "_id": "string",
  "car": "string (_id)",
  "supplier": "string (_id)",
  "driver": "string (_id)",
  "pickupLocation": "string (_id)",
  "dropOffLocation": "string (_id)",
  "from": "string (ISO 8601)",
  "to": "string (ISO 8601)",
  "price": "number",
  "status": "string",
  "payLater": "boolean"
}
```

**Response**

| Status | Meaning            |
|--------|--------------------|
| 200    | Booking updated    |
| 400    | Invalid fields     |
| 404    | Booking not found  |

---

### `POST /api/update-booking-status`

Update only the booking status (Pending / Deposit / Paid / Reserved / Cancelled).

**Request Body**

```json
{ "_id": "string", "status": "string" }
```

---

### `POST /api/cancel-booking/:id`

Cancel the booking.

**URL Params**

| Param | Description   |
|-------|---------------|
| `id`  | Booking `_id` |

**Response**

| Status | Meaning                                   |
|--------|-------------------------------------------|
| 200    | Booking cancelled                         |
| 400    | Booking status does not allow cancellation|
