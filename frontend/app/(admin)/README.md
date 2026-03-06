# Admin Dashboard

## Page Info

- **Route**: `/admin`
- **Access**: 🔒 Admin / Supplier
- **Purpose**: Admin landing page after sign-in. Validates the session, displays a summary of recent bookings, and shows unread notification count. Suppliers see only their own data.

---

## API Endpoints

### `POST /api/validate-access-token`

Verify the admin session on mount. Redirect to `/admin/sign-in` if invalid.

**Request**: No body — reads JWT from cookie.

**Response**

| Status | Meaning                          |
|--------|----------------------------------|
| 200    | Session valid                    |
| 401    | Session expired — redirect       |

---

### `GET /api/notification-counter/:userId`

Fetch the count of unread notifications for the badge in the top nav.

**URL Params**

| Param    | Description |
|----------|-------------|
| `userId` | User `_id`  |

**Response — 200 OK**

```json
{ "count": "number" }
```

---

### `POST /api/bookings/:page/:size/:language`

Fetch recent bookings for the dashboard overview widget.

**URL Params**

| Param      | Description             |
|------------|-------------------------|
| `page`     | Page number (e.g. `1`)  |
| `size`     | Results per page        |
| `language` | Language code           |

**Request Body**

```json
{
  "suppliers": ["string"],
  "statuses": ["Pending", "Deposit", "Paid", "Reserved", "Cancelled"],
  "user": "string | null",
  "car": "string | null",
  "filter": null
}
```

**Response — 200 OK**

```json
{
  "resultData": [
    {
      "_id": "string",
      "car": { "name": "string" },
      "driver": { "fullName": "string" },
      "from": "string",
      "to": "string",
      "price": "number",
      "status": "string"
    }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```
