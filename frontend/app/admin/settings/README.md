# Admin — Settings

## Page Info

- **Route**: `/admin/settings`
- **Access**: 🔒 Admin only
- **Purpose**: View and update global application settings — default language, currency, and other platform-wide configuration values.

---

## API Endpoints

### `GET /api/settings`

Fetch current app settings.

**Request**: No body.

**Response — 200 OK**

```json
{
  "_id": "string",
  "language": "string",
  "currency": "string"
}
```

| Status | Meaning                |
| ------ | ---------------------- |
| 200    | Settings found         |
| 204    | No settings configured |

---

### `PUT /api/update-settings`

Save updated settings.

**Request Body**

```json
{
  "language": "string",
  "currency": "string"
}
```

| Field      | Type   | Required | Description                       |
| ---------- | ------ | -------- | --------------------------------- |
| `language` | string | ✅       | Default language code (e.g. `en`) |
| `currency` | string | ✅       | Currency code (e.g. `USD`, `EUR`) |

**Response**

| Status | Meaning          |
| ------ | ---------------- |
| 200    | Settings updated |
| 400    | Invalid fields   |
