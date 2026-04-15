# Contact Page

## Page Info

- **Route**: `/contact`
- **Access**: Public
- **Purpose**: Contact form page. Allows any visitor to send a message to the platform administrators via email.

---

## API Endpoints

### `POST /api/send-email`

Send a contact message from the visitor to the platform administrators.

**Request Body**

```json
{
  "from": "string (email)",
  "to": "string (email)",
  "subject": "string",
  "message": "string"
}
```

| Field     | Type   | Required | Description             |
| --------- | ------ | -------- | ----------------------- |
| `from`    | string | ✅       | Sender's email address  |
| `to`      | string | ✅       | Recipient email address |
| `subject` | string | ✅       | Email subject line      |
| `message` | string | ✅       | Message body            |

**Response**

| Status | Meaning                   |
| ------ | ------------------------- |
| 200    | Email sent                |
| 400    | Missing or invalid fields |
