# Account Bookings Page

## Page Info

- **Route**: `/account/bookings`
- **Access**: 🔒 Protected — requires authenticated customer
- **Purpose**: View full booking history with filtering and search, monitor active rental in real-time (map, vehicle controls), export booking records, and extend or cancel trips.

---

## API Endpoints

### `GET /api/bookings/history`

Retrieve paginated booking history.

**Query Parameters**

| Param        | Type   | Required | Description                         |
| ------------ | ------ | -------- | ----------------------------------- |
| `status`     | string | ❌       | Filter by status (multiple allowed) |
| `startDate`  | string | ❌       | Date range start                    |
| `endDate`    | string | ❌       | Date range end                      |
| `supplierId` | string | ❌       | Filter by supplier                  |
| `search`     | string | ❌       | Search term                         |
| `page`       | number | ❌       | Page number                         |
| `limit`      | number | ❌       | Items per page                      |
| `sortBy`     | string | ❌       | `date \| price \| status`           |
| `sortOrder`  | string | ❌       | `asc \| desc`                       |

**Response**: Paginated list of booking items.

---

### `GET /api/bookings/active`

Retrieve active trip information. Supports polling/WebSocket for live updates.

**Response**: Active trip object or `null` if no active trip.

---

### `POST /api/bookings/export`

Generate booking history export file.

**Request Body**

```json
{
  "format": "csv | pdf | excel",
  "startDate": "string",
  "endDate": "string",
  "includeStatus": ["string"],
  "detailed": "boolean"
}
```

**Response**: File download URL.

---

### `POST /api/trips/{tripId}/extend`

Extend active trip duration.

**Request Body**: `{ "newReturnTime": "string (ISO 8601)", "paymentMethodId": "string" }`

---

### `POST /api/vehicles/{vehicleId}/control`

Send remote control command to vehicle (lock, unlock, horn, lights).

**Request Body**

```json
{
  "action": "lock | unlock | horn | lights",
  "tripId": "string"
}
```
