# Change Password Page

## Page Info

- **Route**: `/change-password`
- **Access**: 🔒 Authenticated customers
- **Purpose**: Allow an authenticated customer to change their account password. First checks whether the user has a password set (social login users may not), then verifies the current password before accepting the new one.

---

## API Endpoints

### `GET /api/has-password/:id`

Check if the user has a password set. Social sign-in users may not have one.

**URL Params**

| Param | Description |
| ----- | ----------- |
| `id`  | User `_id`  |

**Response**

| Status | Meaning                                         |
| ------ | ----------------------------------------------- |
| 200    | User has a password — show current + new fields |
| 204    | No password set — show new password only        |

---

### `GET /api/check-password/:id/:password`

Verify the user's current password before allowing the change.

**URL Params**

| Param      | Description                    |
| ---------- | ------------------------------ |
| `id`       | User `_id`                     |
| `password` | Current password (URL-encoded) |

**Response**

| Status | Meaning                 |
| ------ | ----------------------- |
| 200    | Password matches        |
| 204    | Password does not match |

---

### `POST /api/change-password`

Set the new password.

**Request Body**

```json
{
  "_id": "string",
  "password": "string",
  "newPassword": "string",
  "strict": "boolean"
}
```

| Field         | Type    | Required | Description                                              |
| ------------- | ------- | -------- | -------------------------------------------------------- |
| `_id`         | string  | ✅       | User `_id`                                               |
| `password`    | string  | ❌       | Current password (required if `strict` is `true`)        |
| `newPassword` | string  | ✅       | New password                                             |
| `strict`      | boolean | ✅       | `true` to verify current password, `false` to skip check |

**Response**

| Status | Meaning                              |
| ------ | ------------------------------------ |
| 200    | Password changed successfully        |
| 400    | Missing or invalid fields            |
| 403    | Current password verification failed |
