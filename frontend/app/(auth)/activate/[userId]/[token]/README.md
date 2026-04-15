# Activate Account Page

## Page Info

- **Route**: `/activate/[userId]/[token]`
- **Access**: Public (reached via email link)
- **Purpose**: Activate a newly registered account using the `userId` and `token` from the email verification link. If the account requires a password to be set (e.g. admin-created accounts), a password form is shown. On success, the user is redirected to sign-in.

---

## API Endpoints

### `GET /api/check-token/:type/:userId/:email/:token`

Validate the activation token from the URL before showing the form.

**URL Params**

| Param    | Description                                  |
| -------- | -------------------------------------------- |
| `type`   | Token type (e.g. `1` for account activation) |
| `userId` | User ID from the email link                  |
| `email`  | User email from the email link               |
| `token`  | Verification token from the email link       |

**Response**

| Status | Meaning                             |
| ------ | ----------------------------------- |
| 200    | Token is valid — show activate form |
| 204    | Token expired or not found          |
| 400    | Invalid params                      |

---

### `POST /api/activate`

Activate the user account. Also used to set an initial password for admin-created accounts.

**Request Body**

```json
{
  "userId": "string",
  "token": "string",
  "password": "string"
}
```

| Field      | Type   | Required | Description                                        |
| ---------- | ------ | -------- | -------------------------------------------------- |
| `userId`   | string | ✅       | User ID                                            |
| `token`    | string | ✅       | Activation token                                   |
| `password` | string | ❌       | New password (required for admin-created accounts) |

**Response**

| Status | Meaning                         |
| ------ | ------------------------------- |
| 200    | Account activated successfully  |
| 204    | Token not found or already used |
| 400    | Missing fields                  |

---

### `POST /api/resend/:type/:email/:reset`

Resend the activation email if the token has expired.

**URL Params**

| Param   | Description                                  |
| ------- | -------------------------------------------- |
| `type`  | User type (e.g. `4` for customer)            |
| `email` | User email address                           |
| `reset` | `false` for account activation (not a reset) |

**Response**

| Status | Meaning                 |
| ------ | ----------------------- |
| 200    | Activation email resent |
| 400    | Email not found         |
