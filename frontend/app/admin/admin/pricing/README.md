# Admin Pricing Page

## Page Info

- **Route**: `/admin/pricing`
- **Access**: 🔒 Protected — requires Admin or Supplier role
- **Purpose**: Manage vehicle-specific rates (hourly, daily, weekly, monthly), create and apply rate templates, perform bulk price updates, and view category pricing benchmarks.

---

## API Endpoints

### `GET /api/v1/pricing/vehicles/{vehicleId}/rates`

Get current and historical rates for a vehicle.

**Query Parameters**: `includeHistory` (boolean)

---

### `POST /api/v1/pricing/vehicles/{vehicleId}/rates`

Set rates for a specific vehicle.

**Request Body**

```json
{
  "vehicleId": "string (UUID)",
  "rates": {
    "hourly": "number",
    "daily": "number",
    "weekly": "number",
    "biWeekly": "number",
    "monthly": "number"
  },
  "minimumDuration": "number (hours)",
  "maximumDuration": "number (days)",
  "effectiveDate": "string (date)",
  "expirationDate": "string (date)",
  "reason": "string"
}
```

---

### `GET /api/v1/pricing/templates`

Get available rate templates.

**Query Parameters**: `supplierId`, `category`

---

### `POST /api/v1/pricing/templates`

Create a new rate template.

**Request Body**: `RateTemplate` object.

---

### `POST /api/v1/pricing/templates/{templateId}/apply`

Apply a rate template to one or more vehicles.

**Request Body**

```json
{
  "vehicleIds": ["string (UUID)"],
  "effectiveDate": "string (date)"
}
```

---

### `POST /api/v1/pricing/bulk-update`

Update rates for multiple vehicles at once.

**Request Body**: `BulkUpdateRequest` — vehicle IDs and new rate configuration.

**Response (200 OK)**: Update results with success/failure breakdown.

---

### `GET /api/v1/pricing/category-averages`

Get average rates by vehicle category for benchmarking.

**Query Parameters**: `supplierId`, `locationId`
