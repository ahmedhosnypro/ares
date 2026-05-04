# Admin — User Detail

## Page Info

- **Route**: `/admin/users/[id]`
- **Access**: 🔒 Admin only
- **Purpose**: Read-only view of a user account — profile details, roles, and status.

---

## API Endpoints

### `GET /api/admin/users/:id`

Fetch the user's full profile details for administration purposes.

**URL Params**

| Param | Description |
| ----- | ----------- |
| `id`  | User `id`   |

**Response — 200 OK**

Returns `UserManagementDto` object containing user information:

```json
{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string | null",
  "emailConfirmed": "boolean",
  "phoneNumberConfirmed": "boolean",
  "status": "string",
  "roles": ["string"],
  "createdAt": "string",
  "updatedAt": "string"
}
```
