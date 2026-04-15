# Vehicle Details Page

## Page Info

- **Route**: `/vehicles/[vehicleId]`
- **Access**: Public (no authentication required; logged-in users get enhanced info)
- **Purpose**: Display comprehensive details for a single vehicle including specs, availability calendar, pricing breakdown, reviews, and image gallery.

---

## API Endpoints

### `GET /api/vehicles/{vehicleId}`

Retrieve comprehensive vehicle details.

**Query Parameters**

| Param        | Type   | Required | Description                 |
| ------------ | ------ | -------- | --------------------------- |
| `pickupDate` | string | ❌       | ISO 8601 — for pricing calc |
| `returnDate` | string | ❌       | ISO 8601 — for pricing calc |
| `currency`   | string | ❌       | Preferred currency code     |

**Error Responses**: 404 Not Found, 500 Server Error

---

### `GET /api/vehicles/{vehicleId}/availability`

Retrieve vehicle availability calendar.

**Query Parameters**: `startDate`, `endDate` (ISO date strings)

**Response**: Availability calendar with booked/blocked dates.

---

### `GET /api/vehicles/{vehicleId}/pricing`

Calculate pricing for a specific rental period.

**Query Parameters**

| Param                | Type   | Required | Description                  |
| -------------------- | ------ | -------- | ---------------------------- |
| `pickupDate`         | string | ✅       | ISO 8601 rental start        |
| `returnDate`         | string | ✅       | ISO 8601 rental end          |
| `insuranceOptions`   | string | ❌       | Selected insurance type      |
| `additionalServices` | string | ❌       | Comma-separated service list |
| `currency`           | string | ❌       | Preferred currency           |

**Error Responses**: 400 Invalid dates, 404 Not Found

---

### `GET /api/vehicles/{vehicleId}/reviews`

Retrieve paginated reviews and ratings.

**Query Parameters**: `page`, `pageSize`, `sortBy` (`date | rating | helpfulness`)

---

### `GET /api/vehicles/{vehicleId}/images`

Retrieve vehicle image gallery.

**Query Parameters**: `size` (`thumbnail | medium | large`)

---

### `POST /api/vehicles/{vehicleId}/favorites`

Add vehicle to user's favourites. 🔒 Requires authentication.

**Request Body**: None

**Response (201 Created)**: Success confirmation.

**Error Responses**: 401 Unauthorized, 404 Not Found
