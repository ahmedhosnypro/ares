# Admin — Create Booking

## Page Info

- **Route**: `/admin/bookings/create`
- **Access**: 🔒 Admin / Supplier
- **Purpose**: Admin form to manually create a new booking. Selects a driver (existing user), a car (filtered by supplier and available for the selected dates), pickup/return location, dates, and price. Optionally set as "Pay Later".

---

## API Endpoints

### `POST /api/admin-suppliers`

Fetch the list of suppliers for the supplier filter dropdown.

**Request Body**

```json
{ "user": "string (_id)" }
```

**Response — 200 OK**

```json
[{ "_id": "string", "fullName": "string", "avatar": "string | null" }]
```

---

### `POST /api/booking-cars/:page/:size`

Fetch cars that are available for the selected supplier, dates, and locations.

**URL Params**

| Param  | Description                |
|--------|----------------------------|
| `page` | 1-based page number        |
| `size` | Number of results per page |

**Request Body**

```json
{
  "supplier": "string (_id)",
  "pickupLocation": "string (_id)",
  "from": "string (ISO 8601)",
  "to": "string (ISO 8601)",
  "language": "string"
}
```

**Response — 200 OK**

```json
{
  "resultData": [{ "_id": "string", "name": "string", "price": "number" }],
  "pageInfo": [{ "totalRecords": "number" }]
}
```

---

### `POST /api/users/:page/:size`

Search for users/drivers to assign to the booking.

**URL Params**

| Param  | Description                |
|--------|----------------------------|
| `page` | 1-based page number        |
| `size` | Number of results per page |

**Request Body**

```json
{ "keyword": "string", "types": ["user"] }
```

**Response — 200 OK**

```json
{
  "resultData": [{ "_id": "string", "fullName": "string", "email": "string" }],
  "pageInfo": [{ "totalRecords": "number" }]
}
```

---

### `GET /api/locations/:page/:size/:language`

Fetch locations for the pickup/return dropdowns.

---

### `POST /api/create-booking`

Save the new booking.

**Request Body**

```json
{
  "car": "string (_id)",
  "supplier": "string (_id)",
  "driver": "string (_id)",
  "pickupLocation": "string (_id)",
  "dropOffLocation": "string (_id)",
  "from": "string (ISO 8601)",
  "to": "string (ISO 8601)",
  "status": "string",
  "price": "number",
  "additionalDriver": "boolean",
  "payLater": "boolean"
}
```

**Response — 200 OK**

```json
{ "_id": "string" }
```

**Error Responses**

| Status | Meaning                            |
|--------|------------------------------------|
| 400    | Missing required fields            |
| 409    | Car not available for selected period |
