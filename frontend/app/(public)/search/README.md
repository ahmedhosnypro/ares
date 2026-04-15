# Search Page

## Page Info

- **Route**: `/search`
- **Access**: Public (no authentication required)
- **Purpose**: Search for available vehicles by pickup/drop-off location, dates, and filters. Supports address autocomplete, current location detection, landmark search, map-based selection, and one-way rentals.

---

## API Endpoints

### `GET /api/locations/autocomplete`

Fetch location suggestions as the user types.

**Query Parameters**

| Param   | Type   | Required | Description               |
| ------- | ------ | -------- | ------------------------- |
| `query` | string | ✅       | Search term (min 3 chars) |
| `type`  | string | ❌       | `pickup` \| `dropoff`     |

**Response (200 OK)**

```json
{
  "suggestions": [
    {
      "locationId": "string",
      "displayText": "string",
      "address": "string",
      "locationType": "airport | neighborhood | delivery",
      "distance": "number | null",
      "isLandmark": "boolean"
    }
  ]
}
```

---

### `GET /api/vehicles/search`

Search for available vehicles by location and rental period.

**Query Parameters**

| Param              | Type   | Required | Description                         |
| ------------------ | ------ | -------- | ----------------------------------- |
| `pickupLocationId` | string | ✅       | Pickup location ID                  |
| `returnLocationId` | string | ❌       | Return location ID (one-way rental) |
| `pickupDate`       | string | ✅       | ISO 8601 datetime                   |
| `returnDate`       | string | ✅       | ISO 8601 datetime                   |
| `category`         | string | ❌       | Vehicle category filter             |
| `transmission`     | string | ❌       | `manual` \| `automatic`             |
| `minPrice`         | number | ❌       | Minimum daily rate                  |
| `maxPrice`         | number | ❌       | Maximum daily rate                  |
| `sortBy`           | string | ❌       | `price` \| `distance` \| `rating`   |
| `page`             | number | ❌       | Page number (default: 1)            |
| `limit`            | number | ❌       | Items per page (default: 20)        |

**Response (200 OK)**

```json
{
  "vehicles": [
    {
      "vehicleId": "string",
      "make": "string",
      "model": "string",
      "category": "string",
      "dailyRate": "number",
      "currency": "string",
      "imageUrl": "string",
      "rating": "number",
      "reviewCount": "number",
      "distance": "number",
      "available": "boolean"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```
