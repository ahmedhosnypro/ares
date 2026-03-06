# Supplier Profile Page

## Page Info

- **Route**: `/suppliers/[supplierId]`
- **Access**: Public (no authentication required)
- **Purpose**: Display detailed supplier profile including fleet, locations, reviews, and operational metrics.

---

## API Endpoints

### `GET /api/suppliers/{supplierId}`

Retrieve detailed supplier profile information.

**Error Responses**: 404 Not Found

---

### `GET /api/suppliers/{supplierId}/vehicles`

Retrieve all vehicles offered by the supplier.

**Query Parameters**

| Param       | Type    | Required | Description                         |
|-------------|---------|----------|-------------------------------------|
| `page`      | integer | ❌       | Page number                         |
| `limit`     | integer | ❌       | Items per page                      |
| `category`  | string  | ❌       | Filter by vehicle category          |
| `available` | boolean | ❌       | Show only currently available vehicles |

---

### `GET /api/suppliers/{supplierId}/locations`

Retrieve all locations where the supplier operates. Returns location list with coordinates.

---

### `GET /api/suppliers/{supplierId}/reviews`

Retrieve customer reviews for the supplier.

**Query Parameters**

| Param    | Type    | Required | Description                           |
|----------|---------|----------|---------------------------------------|
| `page`   | integer | ❌       | Page number                           |
| `limit`  | integer | ❌       | Reviews per page (default: 10)        |
| `sortBy` | string  | ❌       | `date \| rating \| helpfulness`       |

---

### `GET /api/suppliers/{supplierId}/metrics`

Retrieve operational metrics: response time, cancellation rate, completion rate.
