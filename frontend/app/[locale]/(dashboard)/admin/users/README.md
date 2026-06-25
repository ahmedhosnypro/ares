# Admin — Users List

## Page Info

- **Route**: `/admin/users`
- **Access**: 🔒 Admin only
- **Purpose**: Paginated list of user accounts. Supports searching by name or email and toggling active/blocked status.

---

## API Endpoints

### `POST /api/admin/users/:page/:size`

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

Returns a paginated list of users (`PagedResult<UserManagementDto>`).

---

### `PUT /api/admin/users/:id/toggle-status`

Toggle the status of a user between 'Active' and 'Blocked'.

**Response — 200 OK**

Status successfully changed.
