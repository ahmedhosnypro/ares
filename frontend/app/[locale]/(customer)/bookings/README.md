# My Bookings Page

## Page Info

- **Route**: `/bookings`
- **Access**: 🔒 Authenticated customers
- **Purpose**: Paginated list of the current user's bookings. Supports filtering by status. Each row links to the booking detail page.

---

## API Endpoints

### `GET /api/has-bookings/:driver`

Check if the driver has any bookings at all (used to show an empty state).

**URL Params**

| Param    | Description |
| -------- | ----------- |
| `driver` | User `_id`  |

**Response**

| Status | Meaning             |
| ------ | ------------------- |
| 200    | Driver has bookings |
| 204    | No bookings found   |

---

### `POST /api/bookings/:page/:size/:language`

Fetch a paginated, filtered list of bookings for the current user.

**URL Params**

| Param      | Description                        |
| ---------- | ---------------------------------- |
| `page`     | 1-based page number                |
| `size`     | Number of results per page         |
| `language` | Language code for localized fields |

**Request Body**

```json
{
  "user": "string (driver _id)",
  "suppliers": ["string"],
  "statuses": ["Pending", "Deposit", "Paid", "Reserved", "Cancelled"],
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
      "car": { "_id": "string", "name": "string", "image": "string" },
      "supplier": { "_id": "string", "fullName": "string" },
      "pickupLocation": { "_id": "string", "name": "string" },
      "dropOffLocation": { "_id": "string", "name": "string" },
      "from": "string (ISO 8601)",
      "to": "string (ISO 8601)",
      "price": "number",
      "status": "string"
    }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```
