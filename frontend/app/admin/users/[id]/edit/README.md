# Admin — Edit User

## Page Info

- **Route**: `/admin/users/[id]/edit`
- **Access**: 🔒 Admin only
- **Purpose**: Edit a user's profile details including name, phone number, status, and assigned roles.

---

## API Endpoints

### `GET /api/admin/users/:id`

Load existing user data to pre-populate the form.

---

### `PUT /api/admin/users/:id/edit`

Save profile changes.

**Request Body**

```json
{
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string | null",
  "status": "string",
  "roles": ["string"]
}
```

**Response**

| Status | Meaning               |
| ------ | --------------------- |
| 200    | User updated          |
| 400    | Validation error      |
| 404    | User not found        |
| 409    | Email/Phone conflict  |

---

### `PUT /api/admin/users/:id/toggle-status`

Toggle the user's status between 'Active' and 'Blocked'.

**Response**

| Status | Meaning               |
| ------ | --------------------- |
| 200    | Status updated        |
| 404    | User not found        |
