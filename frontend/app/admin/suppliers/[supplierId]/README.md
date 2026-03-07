# Admin — Supplier Detail

## Page Info

- **Route**: `/admin/suppliers/[id]`
- **Access**: 🔒 Admin only
- **Purpose**: Read-only view of a supplier's profile — contact details, logo, bio, Pay Later preference, and the list of cars they manage.

---

## API Endpoints

### `GET /api/supplier/:id`

Fetch the supplier's full profile.

**URL Params**

| Param | Description    |
|-------|----------------|
| `id`  | Supplier `_id` |

**Response — 200 OK**

```json
{
  "_id": "string",
  "email": "string",
  "fullName": "string",
  "phone": "string | null",
  "location": "string | null",
  "bio": "string | null",
  "avatar": "string | null",
  "payLater": "boolean"
}
```

---

### `POST /api/cars/:page/:size`

Fetch the cars owned by this supplier.

**URL Params**

| Param  | Description                |
|--------|----------------------------|
| `page` | 1-based page number        |
| `size` | Number of results per page |

**Request Body**

```json
{ "suppliers": ["string (_id)"] }
```

**Response — 200 OK**

```json
{
  "resultData": [
    { "_id": "string", "name": "string", "price": "number", "available": "boolean" }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```
