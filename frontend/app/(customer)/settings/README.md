# Settings Page

## Page Info

- **Route**: `/settings`
- **Access**: 🔒 Authenticated customers
- **Purpose**: Edit profile information (name, phone, birth date, language preference, email notifications toggle). Also handles email change confirmation flow and avatar upload.

---

## API Endpoints

### `GET /api/user/:id`

Load the current user's profile data to pre-populate the form.

**URL Params**

| Param | Description |
|-------|-------------|
| `id`  | User `_id`  |

**Response — 200 OK**

```json
{
  "_id": "string",
  "email": "string",
  "fullName": "string",
  "phone": "string | null",
  "birthDate": "string | null",
  "language": "string",
  "enableEmailNotifications": "boolean",
  "avatar": "string | null"
}
```

---

### `POST /api/update-user`

Save updated profile fields.

**Request Body**

```json
{
  "_id": "string",
  "fullName": "string",
  "phone": "string",
  "birthDate": "string (ISO 8601)",
  "language": "string",
  "enableEmailNotifications": "boolean"
}
```

**Response**

| Status | Meaning            |
|--------|--------------------|
| 200    | Profile updated    |
| 400    | Invalid fields     |

---

### `POST /api/create-avatar`

Upload a new avatar image to a temporary folder before confirming.

**Request**: `multipart/form-data` with `image` file field.

**Response — 200 OK**

```json
{ "avatar": "string (temp filename)" }
```

---

### `POST /api/update-avatar/:userId`

Persist the uploaded avatar as the user's profile photo.

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

Remove the user's current avatar.

---

### `POST /api/update-email-notifications`

Toggle email notification preference.

**Request Body**

```json
{ "_id": "string", "enableEmailNotifications": "boolean" }
```

---

### `POST /api/update-language`

Update the user's preferred language.

**Request Body**

```json
{ "id": "string", "language": "string" }
```

---

### `POST /api/validate-email`

Check availability of a new email address before requesting a change.

**Request Body**

```json
{ "email": "string" }
```

---

### `POST /api/resend-link`

Resend email confirmation link if the user wants to change their email.

**Request**: No body — uses the authenticated user's session.

**Response**

| Status | Meaning                          |
|--------|----------------------------------|
| 200    | Confirmation email sent          |
| 400    | No pending email change          |
