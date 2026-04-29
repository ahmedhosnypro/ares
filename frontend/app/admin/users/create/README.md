# Admin — Create User

## Page Info

- **Route**: `/admin/users/create`
- **Access**: 🔒 Admin only
- **Purpose**: Create a new user account with specific roles and status.

---

## API Endpoints

### `POST /api/admin/users/create`

Create a new user account.

**Request Body**

```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string | null",
  "status": "string",
  "roles": ["string"]
}
```

**Response — 201 Created**

Returns `UserManagementResponse` containing details of the created user.

**Error Responses**

| Status | Meaning                   |
| ------ | ------------------------- |
| 400    | Missing/Invalid fields    |
| 409    | Email/Phone already exists|
