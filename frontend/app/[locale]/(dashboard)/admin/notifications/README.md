# Admin — Notifications

## Page Info

- **Route**: `/admin/notifications`
- **Access**: 🔒 Admin / Supplier
- **Purpose**: Paginated list of in-app notifications for the signed-in admin or supplier. Supports marking as read/unread and deleting notifications.

---

## API Endpoints

### `GET /api/notification-counter/:userId`

Get the count of unread notifications for the badge in the top nav.

**URL Params**

| Param    | Description |
| -------- | ----------- |
| `userId` | User `_id`  |

**Response — 200 OK**

```json
{ "count": "number" }
```

---

### `GET /api/notifications/:userId/:page/:size`

Fetch a paginated list of notifications.

**URL Params**

| Param    | Description                |
| -------- | -------------------------- |
| `userId` | User `_id`                 |
| `page`   | 1-based page number        |
| `size`   | Number of results per page |

**Response — 200 OK**

```json
{
  "resultData": [
    {
      "_id": "string",
      "user": "string",
      "message": "string",
      "booking": "string | null",
      "isRead": "boolean",
      "createdAt": "string (ISO 8601)"
    }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```

---

### `POST /api/mark-notifications-as-read/:userId`

Mark selected notifications as read.

**Request Body**

```json
{ "ids": ["string"] }
```

---

### `POST /api/mark-notifications-as-unread/:userId`

Mark selected notifications as unread.

**Request Body**

```json
{ "ids": ["string"] }
```

---

### `POST /api/delete-notifications/:userId`

Delete selected notifications.

**Request Body**

```json
{ "ids": ["string"] }
```

**Response (all mutation endpoints)**

| Status | Meaning             |
| ------ | ------------------- |
| 200    | Operation succeeded |
| 400    | Invalid request     |
