# Admin — Create Supplier

## Page Info

- **Route**: `/admin/suppliers/create`
- **Access**: 🔒 Admin only
- **Purpose**: Register a new supplier account. Creates a user of type `Supplier`, uploads their logo, and sends an activation email. The supplier must activate their account before they can sign in.

---

## API Endpoints

### `POST /api/validate-email`

Check that the supplier's email is not already registered.

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

### `POST /api/validate-supplier`

Check that the supplier's display name is unique.

**Request Body**

```json
{ "fullName": "string" }
```

**Response**

| Status | Meaning             |
| ------ | ------------------- |
| 200    | Name is available   |
| 204    | Name already in use |

---

### `POST /api/create-avatar`

Upload supplier logo to a temporary folder.

**Request**: `multipart/form-data` with `image` file field.

**Response — 200 OK**

```json
{ "avatar": "string (temp filename)" }
```

---

### `POST /api/delete-temp-avatar/:avatar`

Delete the temp logo if the user cancels.

**URL Params**

| Param    | Description             |
| -------- | ----------------------- |
| `avatar` | Temp filename to delete |

---

### `POST /api/create-user`

Create the supplier account. Sends an activation email.

**Request Body**

```json
{
  "email": "string",
  "fullName": "string",
  "phone": "string | null",
  "location": "string | null",
  "bio": "string | null",
  "language": "string",
  "type": "supplier",
  "avatar": "string | null",
  "payLater": "boolean"
}
```

**Response — 200 OK**

```json
{ "_id": "string" }
```

**Error Responses**

| Status | Meaning                      |
| ------ | ---------------------------- |
| 400    | Missing required fields      |
| 409    | Email or name already in use |
