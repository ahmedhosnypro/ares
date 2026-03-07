# Admin — Cars List

## Page Info

- **Route**: `/admin/cars`
- **Access**: 🔒 Admin / Supplier
- **Purpose**: Paginated list of all cars. Admins see all cars; suppliers see only their own. Supports filtering by supplier and searching by name. Cars with active bookings cannot be deleted.

---

## API Endpoints

### `POST /api/cars/:page/:size`

Fetch a paginated list of cars.

**URL Params**

| Param  | Description                |
|--------|----------------------------|
| `page` | 1-based page number        |
| `size` | Number of results per page |

**Request Body**

```json
{
  "suppliers": ["string (_id)"],
  "keyword": "string | null"
}
```

**Response — 200 OK**

```json
{
  "resultData": [
    {
      "_id": "string",
      "name": "string",
      "supplier": { "_id": "string", "fullName": "string" },
      "type": "string",
      "gearbox": "string",
      "seats": "number",
      "price": "number",
      "image": "string | null",
      "available": "boolean"
    }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```

---

### `GET /api/check-car/:id`

Check if a car has active bookings before attempting deletion.

**URL Params**

| Param | Description |
|-------|-------------|
| `id`  | Car `_id`   |

**Response**

| Status | Meaning                                    |
|--------|--------------------------------------------|
| 200    | Car has active bookings — cannot delete    |
| 204    | No active bookings — safe to delete        |

---

### `DELETE /api/delete-car/:id`

Delete a car (only if no active bookings).

**URL Params**

| Param | Description |
|-------|-------------|
| `id`  | Car `_id`   |

**Response**

| Status | Meaning                   |
|--------|---------------------------|
| 200    | Car deleted               |
| 400    | Car has active bookings   |
| 404    | Car not found             |
