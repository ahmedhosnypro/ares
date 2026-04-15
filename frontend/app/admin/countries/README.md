# Admin — Countries List

## Page Info

- **Route**: `/admin/countries`
- **Access**: 🔒 Admin only
- **Purpose**: Paginated list of countries used to group pick-up/drop-off locations. Supports searching by name and deleting countries that have no locations.

---

## API Endpoints

### `GET /api/countries/:page/:size/:language`

Fetch a paginated list of countries.

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
      "image": "string | null"
    }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```

---

### `GET /api/check-country/:id`

Check if a country has locations before attempting deletion.

**URL Params**

| Param | Description   |
| ----- | ------------- |
| `id`  | Country `_id` |

**Response**

| Status | Meaning                               |
| ------ | ------------------------------------- |
| 200    | Country has locations — cannot delete |
| 204    | No locations — safe to delete         |

---

### `DELETE /api/delete-country/:id`

Delete a country.

**URL Params**

| Param | Description   |
| ----- | ------------- |
| `id`  | Country `_id` |

**Response**

| Status | Meaning                         |
| ------ | ------------------------------- |
| 200    | Country deleted                 |
| 400    | Country has locations — blocked |
| 404    | Country not found               |
