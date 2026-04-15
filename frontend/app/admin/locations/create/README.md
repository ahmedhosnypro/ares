# Admin — Create Location

## Page Info

- **Route**: `/admin/locations/create`
- **Access**: 🔒 Admin only
- **Purpose**: Add a new pick-up/drop-off location with localized names, a country assignment, an optional cover image, and optional geo-coordinates.

---

## API Endpoints

### `POST /api/validate-location`

Check that the location name is unique before saving.

**Request Body**

```json
{ "language": "string", "name": "string" }
```

**Response**

| Status | Meaning             |
| ------ | ------------------- |
| 200    | Name is available   |
| 204    | Name already in use |

---

### `GET /api/countries/:page/:size/:language`

Fetch countries for the country dropdown.

**URL Params**

| Param      | Description                              |
| ---------- | ---------------------------------------- |
| `page`     | Page number (use large size to load all) |
| `size`     | Number of results per page               |
| `language` | Language code                            |

---

### `POST /api/create-location-image`

Upload a location cover image to a temporary folder.

**Request**: `multipart/form-data` with `image` file field.

**Response — 200 OK**

```json
{ "image": "string (temp filename)" }
```

---

### `POST /api/delete-temp-location-image/:image`

Delete a temp image if the user cancels the upload.

---

### `POST /api/create-location`

Create the location record.

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

**Response — 200 OK**

```json
{ "_id": "string" }
```

**Error Responses**

| Status | Meaning                      |
| ------ | ---------------------------- |
| 400    | Missing required fields      |
| 409    | Location name already exists |
