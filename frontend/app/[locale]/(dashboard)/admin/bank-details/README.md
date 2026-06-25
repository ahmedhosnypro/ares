# Admin — Bank Details

## Page Info

- **Route**: `/admin/bank-details`
- **Access**: 🔒 Admin only
- **Purpose**: View and manage the platform's bank account information displayed to customers who choose Pay Later or bank transfer payment.

---

## API Endpoints

### `GET /api/bank-details`

Fetch the current bank details.

**Request**: No body.

**Response — 200 OK**

```json
{
  "_id": "string",
  "bankName": "string | null",
  "accountHolder": "string | null",
  "iban": "string | null",
  "swiftBic": "string | null",
  "accountNumber": "string | null",
  "routingNumber": "string | null",
  "notes": "string | null"
}
```

| Status | Meaning                 |
| ------ | ----------------------- |
| 200    | Bank details found      |
| 204    | No bank details set yet |

---

### `POST /api/upsert-bank-details`

Create or update the bank details (upsert — creates if none exist, updates otherwise).

**Request Body**

```json
{
  "bankName": "string | null",
  "accountHolder": "string | null",
  "iban": "string | null",
  "swiftBic": "string | null",
  "accountNumber": "string | null",
  "routingNumber": "string | null",
  "notes": "string | null"
}
```

**Response**

| Status | Meaning            |
| ------ | ------------------ |
| 200    | Bank details saved |
| 400    | Invalid request    |
