# Admin — Users List

## Page Info

- **Route**: `/admin/users`
- **Access**: 🔒 Admin only
- **Purpose**: Paginated list of customer accounts. Supports searching by name or email and bulk deleting users who have no bookings.

---

## API Endpoints

### `POST /api/users/:page/:size`

Fetch a paginated list of users.

**URL Params**

| Param  | Description                |
| ------ | -------------------------- |
| `page` | 1-based page number        |
| `size` | Number of results per page |

**Request Body**

```json
{
  "keyword": "string | null",
  "types": ["user"]
}
```

**Response — 200 OK**

```json
{
  "resultData": [
    {
      "_id": "string",
      "fullName": "string",
      "email": "string",
      "phone": "string | null",
      "birthDate": "string | null",
      "active": "boolean",
      "avatar": "string | null"
    }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```

---

### `POST /api/delete-users`

Bulk delete selected user accounts.

**Request Body**

```json
{ "ids": ["string"] }
```

**Response**

| Status | Meaning                         |
| ------ | ------------------------------- |
| 200    | Users deleted                   |
| 400    | One or more users have bookings |
