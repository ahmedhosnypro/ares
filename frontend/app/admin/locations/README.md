# Admin — Locations List

## Page Info

- **Route**: `/admin/locations`
- **Access**: 🔒 Admin only
- **Purpose**: Paginated list of pick-up/drop-off locations. Supports search by name. Locations with active cars or bookings cannot be deleted.

---

## API Endpoints

### `GET /api/locations/:page/:size/:language`

Fetch a paginated list of locations.

**URL Params**

| Param      | Description                       |
| ---------- | --------------------------------- |
| `page`     | 1-based page number               |
| `size`     | Number of results per page        |
| `language` | Language code for localized names |

**Response — 200 OK**

```json
{
  "resultData": [
    {
      "_id": "string",
      "name": "string",
      "country": { "_id": "string", "name": "string" },
      "image": "string | null",
      "latitude": "number | null",
      "longitude": "number | null"
    }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```

---

### `GET /api/check-location/:id`

Check if a location has cars or bookings before deletion.

**URL Params**

| Param | Description    |
| ----- | -------------- |
| `id`  | Location `_id` |

**Response**

| Status | Meaning                                    |
| ------ | ------------------------------------------ |
| 200    | Location has cars/bookings — cannot delete |
| 204    | No cars or bookings — safe to delete       |

---

### `DELETE /api/delete-location/:id`

Delete a location.

**Response**

| Status | Meaning                                 |
| ------ | --------------------------------------- |
| 200    | Location deleted                        |
| 400    | Location has cars or bookings — blocked |
| 404    | Location not found                      |
