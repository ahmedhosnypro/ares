# Admin — Edit Country

## Page Info

- **Route**: `/admin/countries/[id]/edit`
- **Access**: 🔒 Admin only
- **Purpose**: Edit a country's localized names across all supported languages.

---

## API Endpoints

### `GET /api/country/:id/:language`

Load the country's current localized name to pre-populate the form.

**URL Params**

| Param      | Description                       |
|------------|-----------------------------------|
| `id`       | Country `_id`                     |
| `language` | Language code for the name to load|

**Response — 200 OK**

```json
{
  "_id": "string",
  "name": "string"
}
```

---

### `POST /api/validate-country`

Validate that the updated name is unique (for each language being edited).

**Request Body**

```json
{ "language": "string", "name": "string" }
```

---

### `PUT /api/update-country/:id`

Save updated localized names.

**URL Params**

| Param | Description   |
|-------|---------------|
| `id`  | Country `_id` |

**Request Body**

```json
{
  "values": [
    { "language": "string", "name": "string" }
  ]
}
```

**Response**

| Status | Meaning               |
|--------|-----------------------|
| 200    | Country updated       |
| 400    | Invalid fields        |
| 404    | Country not found     |
