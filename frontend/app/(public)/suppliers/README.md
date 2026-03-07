# Suppliers Page

## Page Info

- **Route**: `/suppliers`
- **Access**: Public (no authentication required)
- **Purpose**: Browse and compare rental suppliers with filtering by location, rating, specialization, and fleet size.

---

## API Endpoint

### `GET /api/suppliers`

Retrieve paginated list of suppliers with filtering and sorting.

**Query Parameters**

| Param            | Type    | Required | Description                                            |
|------------------|---------|----------|--------------------------------------------------------|
| `page`           | integer | ❌       | Page number (default: 1)                               |
| `limit`          | integer | ❌       | Items per page (default: 20, max: 100)                 |
| `minRating`      | decimal | ❌       | Minimum rating filter (0–5)                            |
| `location`       | string  | ❌       | Filter by city or region                               |
| `specialization` | string  | ❌       | `luxury \| electric \| accessible \| commercial \| budget` |
| `fleetSize`      | string  | ❌       | `small \| medium \| large`                             |
| `sortBy`         | string  | ❌       | `rating \| name \| fleetSize \| responseTime`          |
| `sortOrder`      | string  | ❌       | `asc \| desc` (default: `desc`)                        |

**Response (200 OK)**

```json
{
  "suppliers": [
    {
      "supplierId": "string",
      "name": "string",
      "rating": "number",
      "reviewCount": "number",
      "fleetSize": "number",
      "specialization": ["string"],
      "locations": ["string"],
      "logoUrl": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

---

### `GET /api/suppliers/compare`

Compare up to 4 suppliers side-by-side.

**Query Parameters**

| Param         | Type   | Required | Description                                  |
|---------------|--------|----------|----------------------------------------------|
| `supplierIds` | string | ✅       | Comma-separated supplier GUIDs (max: 4)      |
