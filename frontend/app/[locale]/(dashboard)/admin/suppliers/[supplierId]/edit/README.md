# Admin — Edit Supplier

## Page Info

- **Route**: `/admin/suppliers/[id]/edit`
- **Access**: 🔒 Admin only
- **Purpose**: Edit a supplier's profile — name, contact, logo, bio, and Pay Later option. Also manages their rental contract documents per language.

---

## API Endpoints

### `GET /api/supplier/:id`

Load existing supplier data to pre-populate the form.

---

### `POST /api/validate-supplier`

Validate the new name is not already in use by another supplier.

**Request Body**

```json
{ "fullName": "string" }
```

---

### `POST /api/update-avatar/:userId`

Upload a new supplier logo.

**URL Params**

| Param    | Description    |
| -------- | -------------- |
| `userId` | Supplier `_id` |

**Request Body**

```json
{ "avatar": "string (temp filename)" }
```

---

### `POST /api/delete-avatar/:userId`

Remove the supplier's logo.

---

### `PUT /api/update-supplier`

Save all profile changes.

**Request Body**

```json
{
  "_id": "string",
  "fullName": "string",
  "phone": "string | null",
  "location": "string | null",
  "bio": "string | null",
  "payLater": "boolean"
}
```

**Response**

| Status | Meaning          |
| ------ | ---------------- |
| 200    | Supplier updated |
| 400    | Invalid fields   |

---

### `POST /api/create-contract/:language`

Upload a rental contract PDF for a specific language.

**URL Params**

| Param      | Description               |
| ---------- | ------------------------- |
| `language` | Language code (e.g. `en`) |

**Request**: `multipart/form-data` with `file` field.

---

### `POST /api/update-contract/:id/:language`

Replace an existing contract for a language.

---

### `POST /api/delete-contract/:id/:language`

Remove a contract for a language.

**Response (contract endpoints)**

| Status | Meaning             |
| ------ | ------------------- |
| 200    | Operation succeeded |
| 400    | File not found      |
