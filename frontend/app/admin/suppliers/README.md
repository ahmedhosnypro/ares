# Admin — Suppliers List

## Page Info

- **Route**: `/admin/suppliers`
- **Access**: 🔒 Admin only
- **Purpose**: Paginated list of all car rental supplier accounts. Supports searching by name and deleting suppliers that have no cars or bookings.

---

## API Endpoints

### `GET /api/suppliers/:page/:size`

Fetch a paginated list of suppliers.

**URL Params**

| Param  | Description                |
|--------|----------------------------|
| `page` | 1-based page number        |
| `size` | Number of results per page |

**Response — 200 OK**

```json
{
  "resultData": [
    {
      "_id": "string",
      "fullName": "string",
      "avatar": "string | null",
      "email": "string",
      "phone": "string | null",
      "payLater": "boolean"
    }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```

---

### `POST /api/validate-supplier`

Check if a supplier name is unique (used inline before deletion attempts).

**Request Body**

```json
{ "fullName": "string" }
```

**Response**

| Status | Meaning                     |
|--------|-----------------------------|
| 200    | Name is available           |
| 204    | Name already in use         |

---

### `DELETE /api/delete-supplier/:id`

Delete a supplier account.

**URL Params**

| Param | Description     |
|-------|-----------------|
| `id`  | Supplier `_id`  |

**Response**

| Status | Meaning                                   |
|--------|-------------------------------------------|
| 200    | Supplier deleted                          |
| 400    | Supplier has cars or bookings — blocked   |
| 404    | Supplier not found                        |
