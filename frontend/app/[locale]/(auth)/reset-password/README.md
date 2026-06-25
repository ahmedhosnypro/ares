# Reset Password Page

## Page Info

- **Route**: `/reset-password`
- **Access**: Public (reached via email link with `userId`, `email`, and `token` query params)
- **Purpose**: Complete the password reset flow. Validates the token from the reset link, shows a new password form, and activates the account with the new password on submission.

---

## API Endpoints

### `GET /api/check-token/:type/:userId/:email/:token`

Validate the reset token from the email link before showing the password form.

**URL Params**

| Param    | Description                     |
| -------- | ------------------------------- |
| `type`   | Token type (password reset)     |
| `userId` | User ID from the email link     |
| `email`  | User email from the email link  |
| `token`  | Reset token from the email link |

**Response**

| Status | Meaning                              |
| ------ | ------------------------------------ |
| 200    | Token valid — show new password form |
| 204    | Token expired or not found           |
| 400    | Invalid params                       |

---

### `POST /api/activate`

Set the new password using the validated reset token.

**Request Body**

```json
{
  "userId": "string",
  "token": "string",
  "password": "string"
}
```

| Field      | Type   | Required | Description         |
| ---------- | ------ | -------- | ------------------- |
| `userId`   | string | ✅       | User ID             |
| `token`    | string | ✅       | Reset token         |
| `password` | string | ✅       | New password to set |

**Response**

| Status | Meaning                         |
| ------ | ------------------------------- |
| 200    | Password reset successfully     |
| 204    | Token not found or already used |
| 400    | Missing required fields         |

---

### `DELETE /api/delete-tokens/:userId`

Invalidate all active tokens for the user after a successful reset.

**URL Params**

| Param    | Description |
| -------- | ----------- |
| `userId` | User ID     |

**Response**

| Status | Meaning        |
| ------ | -------------- |
| 200    | Tokens deleted |
| 400    | User not found |
