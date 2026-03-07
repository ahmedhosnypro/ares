# Admin — Bookings List

## Page Info

- **Route**: `/admin/bookings`
- **Access**: 🔒 Admin / Supplier
- **Purpose**: Paginated, filterable list of all bookings. Admins see all bookings; suppliers see only bookings for their cars. Supports bulk delete and filtering by supplier, status, date range, keyword, and location.

---

## API Endpoints

### `POST /api/bookings/:page/:size/:language`

Fetch a paginated, filtered list of bookings.

**URL Params**

| Param      | Description                       |
|------------|-----------------------------------|
| `page`     | 1-based page number               |
| `size`     | Number of results per page        |
| `language` | Language code for localized fields|

**Request Body**

```json
{
  "suppliers": ["string (_id)"],
  "statuses": ["Pending", "Deposit", "Paid", "Reserved", "Cancelled"],
  "user": "string | null",
  "car": "string | null",
  "filter": {
    "from": "string (ISO 8601) | null",
    "to": "string (ISO 8601) | null",
    "keyword": "string | null",
    "pickupLocation": "string | null",
    "dropOffLocation": "string | null"
  }
}
```

**Response — 200 OK**

```json
{
  "resultData": [
    {
      "_id": "string",
      "car": { "_id": "string", "name": "string", "supplier": { "fullName": "string" } },
      "driver": { "_id": "string", "fullName": "string", "email": "string" },
      "pickupLocation": { "_id": "string", "name": "string" },
      "dropOffLocation": { "_id": "string", "name": "string" },
      "from": "string (ISO 8601)",
      "to": "string (ISO 8601)",
      "price": "number",
      "status": "string",
      "payLater": "boolean"
    }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```

---

### `POST /api/delete-bookings`

Bulk delete selected bookings.

**Request Body**

```json
{ "ids": ["string"] }
```

**Response**

| Status | Meaning             |
|--------|---------------------|
| 200    | Bookings deleted    |
| 400    | Invalid request     |
