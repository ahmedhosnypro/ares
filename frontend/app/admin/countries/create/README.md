# Admin — Create Country

## Page Info

- **Route**: `/admin/countries/create`
- **Access**: 🔒 Admin only
- **Purpose**: Add a new country with localized names (all supported languages must be filled in).

---

## API Endpoints

### `POST /api/validate-country`

Check that the country name is unique before saving.

**Request Body**

```json
{
  "language": "string",
  "name": "string"
}
```

**Response**

| Status | Meaning             |
| ------ | ------------------- |
| 200    | Name is available   |
| 204    | Name already in use |

---

### `POST /api/create-country`

Create the new country record with localized names.

**Request Body**

```json
{
  "values": [{ "language": "string", "name": "string" }]
}
```

**Response — 200 OK**

```json
{ "_id": "string" }
```

**Error Responses**

| Status | Meaning                            |
| ------ | ---------------------------------- |
| 400    | Missing or invalid localized names |
| 409    | Country name already exists        |
