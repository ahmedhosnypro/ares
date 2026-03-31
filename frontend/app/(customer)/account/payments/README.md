# Account Payments Page

## Page Info

- **Route**: `/account/payments`
- **Access**: 🔒 Protected — requires authenticated customer
- **Purpose**: View full payment transaction history, download receipts and invoices, track refund status, and export payment records.

---

## API Endpoints

### `GET /api/v1/payments/history`

Retrieve paginated payment transaction history.

**Query Parameters**

| Param           | Type   | Required | Description                         |
|-----------------|--------|----------|-------------------------------------|
| `startDate`     | date   | ❌       | Filter from date                    |
| `endDate`       | date   | ❌       | Filter to date                      |
| `status`        | string | ❌       | Filter by status                    |
| `paymentMethod` | string | ❌       | Filter by method type               |
| `page`          | number | ❌       | Page number (default: 1)            |
| `pageSize`      | number | ❌       | Items per page (default: 20)        |
| `sortBy`        | string | ❌       | Sort field (default: `createdAt`)   |
| `sortOrder`     | string | ❌       | `asc \| desc` (default: `desc`)     |

**Response**: Paginated transaction list.

---

### `GET /api/v1/payments/{transactionId}`

Get complete details for a single transaction.

**Error Responses**: 401 Unauthorized, 403 Forbidden (not owner), 404 Not Found

---

### `GET /api/v1/payments/{transactionId}/receipt`

Download transaction receipt.

**Query Parameters**: `format` (`pdf | html`, default: `pdf`)

**Response**: Receipt file.

---

### `GET /api/v1/refunds/{refundId}`

Get refund details and status timeline.

---

### `GET /api/v1/payments/export`

Export payment history as a file.

**Request Body**

```json
{
  "startDate": "string",
  "endDate": "string",
  "format": "csv | pdf | excel",
  "includeRefunds": "boolean"
}
```

**Response**: Export file download.

---

### `GET /api/v1/payments/pending`

Get pending payment transactions with due dates.

---

### `GET /api/v1/payments/failed`

Get recent failed payment attempts.

**Query Parameters**: `limit` (number, default: 10)
