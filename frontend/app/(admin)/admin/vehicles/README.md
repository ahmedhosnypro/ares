# Admin Vehicles Page

## Page Info

- **Route**: `/admin/vehicles`
- **Access**: 🔒 Protected — requires Admin or Fleet Manager role
- **Purpose**: Full vehicle inventory management: create, update, delete, and bulk-operate vehicles; manage operational status; view performance metrics and status history.

---

## API Endpoints

### `GET /api/admin/vehicles`

List vehicles with filtering, search, and pagination.

**Query Parameters**: `page`, `limit`, `status`, `category`, `location`, `supplier`, `search`

---

### `POST /api/admin/vehicles`

Create a new vehicle.

**Request Body**: Full vehicle object with specifications, license plate, VIN, category, location.

**Response (201 Created)**: Vehicle ID and complete vehicle object.

**Error Responses**: 400 Validation (VIN format, plate uniqueness), 401 Unauthorized

---

### `GET /api/admin/vehicles/{id}`

Get detailed vehicle information including relationships.

**Error Responses**: 401 Unauthorized, 404 Not Found

---

### `PUT /api/admin/vehicles/{id}`

Update vehicle information (partial or full).

**Request Body**: Partial or complete vehicle object.

**Response (200 OK)**: Updated vehicle object.

---

### `DELETE /api/admin/vehicles/{id}`

Soft-delete a vehicle. Fails if active/future bookings exist.

**Response**: 204 No Content

**Error Responses**: 401 Unauthorized, 409 Conflict (active bookings)

---

### `PATCH /api/admin/vehicles/{id}/status`

Update vehicle operational status.

**Request Body**

```json
{
  "status": "string",
  "reason": "string",
  "expectedReturnDate": "string (ISO 8601)"
}
```

---

### `POST /api/admin/vehicles/bulk`

Perform bulk operations on multiple vehicles.

**Request Body**

```json
{
  "vehicleIds": ["string (UUID)"],
  "action": "updatePricing | changeStatus | assignLocation | updateAvailability",
  "parameters": {}
}
```

**Response (200 OK)**

```json
{
  "successful": "number",
  "failed": "number",
  "errors": ["string"]
}
```

---

### `GET /api/admin/vehicles/{id}/status-history`

Get complete status change history for a vehicle.

---

### `POST /api/admin/vehicles/import`

Bulk import vehicles from a file (CSV/Excel).

### `GET /api/admin/vehicles/export`

Export vehicle inventory data.
