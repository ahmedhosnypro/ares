# Admin — Edit User

## Page Info

- **Route**: `/admin/users/[id]/edit`
- **Access**: 🔒 Admin only
- **Purpose**: Edit a customer's profile — name, phone, birth date, language, and email notification preference. Admins can also update the user's avatar.

---

## API Endpoints

### `GET /api/user/:id`

Load existing user data to pre-populate the form.

---

### `POST /api/update-user`

Save profile changes.

**Request Body**

```json
{
  "_id": "string",
  "fullName": "string",
  "phone": "string | null",
  "birthDate": "string (ISO 8601) | null",
  "language": "string",
  "enableEmailNotifications": "boolean"
}
```

**Response**

| Status | Meaning           |
|--------|-------------------|
| 200    | User updated      |
| 400    | Invalid fields    |

---

### `POST /api/update-avatar/:userId`

Update the user's avatar.

**URL Params**

| Param    | Description |
|----------|-------------|
| `userId` | User `_id`  |

**Request Body**

```json
{ "avatar": "string (temp filename)" }
```

---

### `POST /api/delete-avatar/:userId`

Remove the user's avatar.

---

### `POST /api/update-email-notifications`

Toggle the user's email notification preference.

**Request Body**

```json
{ "_id": "string", "enableEmailNotifications": "boolean" }
```
