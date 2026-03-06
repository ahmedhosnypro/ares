# Account Preferences Page

## Page Info

- **Route**: `/account/preferences`
- **Access**: 🔒 Protected — requires authenticated customer
- **Purpose**: Save and manage booking preferences (vehicle type, transmission, seat capacity) and frequently used locations for a faster, personalized rental experience. Also covers `/account/locations` for saved locations management.

---

## API Endpoints

### `GET /api/users/{userId}/preferences`

Retrieve all saved preferences.

**Response (200 OK)**: User preferences object (language, currency, vehicle type preferences, notification settings, etc.)

---

### `PUT /api/users/{userId}/preferences`

Update preferences. Accepts a partial or full preferences object.

---

### `GET /api/users/{userId}/locations`

Retrieve all saved locations.

**Response (200 OK)**: Array of saved location objects with `locationId`, `name`, `address`, `coordinates`, `type` (`home | work | other`).

---

### `POST /api/users/{userId}/locations`

Add a new saved location.

**Request Body**: Location object (without `locationId`).

---

### `PUT /api/users/{userId}/locations/{locationId}`

Update an existing saved location.

**Request Body**: Partial or full location object.

---

### `DELETE /api/users/{userId}/locations/{locationId}`

Remove a saved location.

---

### `GET /api/users/{userId}/location-history`

Retrieve recently used locations.

---

### `POST /api/locations/geocode`

Convert an address string to coordinates.

**Request Body**

```json
{
  "address": "string"
}
```

**Response (200 OK)**

```json
{
  "coordinates": {
    "latitude": "number",
    "longitude": "number"
  },
  "formattedAddress": "string"
}
```
