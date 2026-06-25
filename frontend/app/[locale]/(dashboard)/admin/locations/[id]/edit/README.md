# Admin — Edit Location

## Page Info

- **Route**: `/admin/locations/[id]/edit`
- **Access**: 🔒 Admin only
- **Purpose**: Edit a location's localized names, country, cover image, and geo-coordinates.

---

## API Endpoints

### `GET /api/location/:id/:language`

Load the location's current data.

**URL Params**

| Param      | Description                        |
| ---------- | ---------------------------------- |
| `id`       | Location `_id`                     |
| `language` | Language code for the name to load |

**Response — 200 OK**

```json
{
  "_id": "string",
  "name": "string",
  "country": { "_id": "string", "name": "string" },
  "image": "string | null",
  "latitude": "number | null",
  "longitude": "number | null"
}
```

---

### `POST /api/validate-location`

Validate that the updated name is unique.

---

### `POST /api/update-location-image/:id`

Replace the location's cover image.

**URL Params**

| Param | Description    |
| ----- | -------------- |
| `id`  | Location `_id` |

**Request**: `multipart/form-data` with `image` file field.

---

### `POST /api/delete-location-image/:id`

Remove the location's cover image.

---

### `PUT /api/update-location/:id`

Save all changes.

**URL Params**

| Param | Description    |
| ----- | -------------- |
| `id`  | Location `_id` |

**Request Body**

```json
{
  "values": [{ "language": "string", "name": "string" }],
  "country": "string (_id)",
  "image": "string | null",
  "latitude": "number | null",
  "longitude": "number | null"
}
```

**Response**

| Status | Meaning            |
| ------ | ------------------ |
| 200    | Location updated   |
| 400    | Invalid fields     |
| 404    | Location not found |
