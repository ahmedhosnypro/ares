# Admin — User Detail

## Page Info

- **Route**: `/admin/users/[id]`
- **Access**: 🔒 Admin only
- **Purpose**: Read-only view of a customer account — profile details, avatar, and booking history summary.

---

## API Endpoints

### `GET /api/user/:id`

Fetch the user's full profile.

**URL Params**

| Param | Description |
| ----- | ----------- |
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
  "active": "boolean",
  "avatar": "string | null",
  "license": "string | null"
}
```

---

### `GET /api/has-bookings/:driver`

Check if the user has any bookings on record.

**URL Params**

| Param    | Description |
| -------- | ----------- |
| `driver` | User `_id`  |

**Response**

| Status | Meaning           |
| ------ | ----------------- |
| 200    | User has bookings |
| 204    | No bookings found |
