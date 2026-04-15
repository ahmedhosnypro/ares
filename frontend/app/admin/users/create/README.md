# Admin — Create User

## Page Info

- **Route**: `/admin/users/create`
- **Access**: 🔒 Admin only
- **Purpose**: Create a new customer account on behalf of a user. Sends an activation email so the user can set their password.

---

## API Endpoints

### `POST /api/validate-email`

Check that the email is not already registered.

**Request Body**

```json
{ "email": "string" }
```

**Response**

| Status | Meaning              |
| ------ | -------------------- |
| 200    | Email is available   |
| 400    | Email already in use |

---

### `POST /api/create-avatar`

Upload a user avatar to a temporary folder.

**Request**: `multipart/form-data` with `image` file field.

**Response — 200 OK**

```json
{ "avatar": "string (temp filename)" }
```

---

### `POST /api/delete-temp-avatar/:avatar`

Delete the temp avatar if the user cancels.

---

### `POST /api/create-user`

Create the user account.

**Request Body**

```json
{
  "email": "string",
  "fullName": "string",
  "phone": "string | null",
  "birthDate": "string (ISO 8601) | null",
  "language": "string",
  "type": "user",
  "avatar": "string | null",
  "enableEmailNotifications": "boolean"
}
```

**Response — 200 OK**

```json
{ "_id": "string" }
```

**Error Responses**

| Status | Meaning                  |
| ------ | ------------------------ |
| 400    | Missing required fields  |
| 409    | Email already registered |
