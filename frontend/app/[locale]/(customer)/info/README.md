# Driver Info Page

## Page Info

- **Route**: `/info`
- **Access**: 🔒 Authenticated customers
- **Purpose**: Manage the customer's driver's license information, used for booking eligibility verification. Allows uploading, updating, and deleting the license document.

---

## API Endpoints

### `GET /api/user/:id`

Load the user's current profile including existing license info.

**URL Params**

| Param | Description |
| ----- | ----------- |
| `id`  | User `_id`  |

**Response — 200 OK**

```json
{
  "_id": "string",
  "fullName": "string",
  "license": "string | null"
}
```

---

### `POST /api/create-license`

Upload a driver's license document to a temporary folder.

**Request**: `multipart/form-data` with `file` field.

**Response — 200 OK**

```json
{ "license": "string (temp filename)" }
```

---

### `POST /api/update-license/:id`

Persist the uploaded license document for the user.

**URL Params**

| Param | Description |
| ----- | ----------- |
| `id`  | User `_id`  |

**Request Body**

```json
{ "license": "string (temp filename)" }
```

**Response**

| Status | Meaning         |
| ------ | --------------- |
| 200    | License updated |
| 400    | Invalid request |

---

### `POST /api/delete-license/:id`

Remove the user's stored license document.

**URL Params**

| Param | Description |
| ----- | ----------- |
| `id`  | User `_id`  |

---

### `POST /api/delete-temp-license/:file`

Clean up a temporary license file that was not confirmed.

**URL Params**

| Param  | Description              |
| ------ | ------------------------ |
| `file` | Temp file name to delete |

**Response (all mutation endpoints)**

| Status | Meaning             |
| ------ | ------------------- |
| 200    | Operation succeeded |
| 400    | File not found      |
