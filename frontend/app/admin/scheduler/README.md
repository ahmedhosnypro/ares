# Admin — Scheduler

## Page Info

- **Route**: `/admin/scheduler`
- **Access**: 🔒 Admin / Supplier
- **Purpose**: Calendar/timeline view of all bookings, grouped by car. Allows visual scheduling and overlap detection. Supports filtering by supplier and location.

---

## API Endpoints

### `POST /api/bookings/:page/:size/:language`

Fetch bookings to populate the scheduler timeline.

**URL Params**

| Param      | Description                    |
|------------|--------------------------------|
| `page`     | Page number                    |
| `size`     | Large number to load all at once (e.g. `1000`) |
| `language` | Language code                  |

**Request Body**

```json
{
  "suppliers": ["string (_id)"],
  "statuses": ["Pending", "Deposit", "Paid", "Reserved"],
  "user": null,
  "car": null,
  "filter": {
    "from": "string (ISO 8601)",
    "to": "string (ISO 8601)"
  }
}
```

**Response — 200 OK**

```json
{
  "resultData": [
    {
      "_id": "string",
      "car": { "_id": "string", "name": "string" },
      "from": "string (ISO 8601)",
      "to": "string (ISO 8601)",
      "status": "string"
    }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```

---

### `POST /api/admin-suppliers`

Fetch suppliers for the supplier filter.

**Request Body**

```json
{ "user": "string (_id)" }
```

**Response — 200 OK**

```json
[{ "_id": "string", "fullName": "string" }]
```

---

### `GET /api/locations/:page/:size/:language`

Fetch locations for the location filter.
