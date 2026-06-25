# Admin — Bookings List

## Page Info

- **Route**: `/admin/bookings`
- **Access**: 🔒 Admin / Supplier
- **Purpose**: Paginated, filterable list of all bookings. Admins see all bookings; suppliers see only bookings for their cars. Supports bulk delete and filtering by supplier, status, date range, keyword, and location.

---

## API Endpoints

### `POST /api/admin/bookings/search/{page}/{size}`

Fetch a paginated, filtered list of bookings for Admin/Supplier dashboards.

**URL Params**

| Param  | Description                |
| ------ | -------------------------- |
| `page` | 1-based page number        |
| `size` | Number of results per page |

**Request Body**

```json
{
  "suppliers": ["string (Guid)"],
  "statuses": ["Pending", "Deposit", "Paid", "Reserved", "Cancelled"],
  "user": "string (Guid) | null",
  "carId": "string (Guid) | null",
  "filter": {
    "from": "string (ISO 8601) | null",
    "to": "string (ISO 8601) | null",
    "keyword": "string | null",
    "pickupLocation": "string | null",
    "dropOffLocation": "string | null"
  },
  "page": "number",
  "size": "number",
  "language": "string"
}
```

**Response — 200 OK**

```json
{
  "data": [
    {
      "id": "string",
      "car": { "id": "string", "name": "string", "supplier": { "fullName": "string" } },
      "driver": { "id": "string", "fullName": "string", "email": "string" },
      "pickupLocation": { "id": "string", "name": "string" },
      "dropOffLocation": { "id": "string", "name": "string" },
      "from": "string (ISO 8601)",
      "to": "string (ISO 8601)",
      "price": "number",
      "status": "string",
      "payLater": "boolean"
    }
  ],
  "totalCount": "number",
  "totalPages": "number",
  "page": "number",
  "pageSize": "number"
}
```

---

### `POST /api/admin/bookings/delete-bookings`

Bulk delete selected bookings.

**Request Body**

```json
{ "ids": ["string (Guid)"] }
```

**Response**

| Status | Meaning          |
| ------ | ---------------- |
| 200    | Bookings deleted |
| 400    | Invalid request  |
| 401    | Unauthorized     |
| 403    | Forbidden        |
