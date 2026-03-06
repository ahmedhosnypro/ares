# Suppliers Page

## Page Info

- **Route**: `/suppliers`
- **Access**: Public
- **Purpose**: Browse the list of car rental suppliers available on the platform. Each supplier card links to their available cars on the search page.

---

## API Endpoints

### `GET /api/all-suppliers`

Fetch the full list of all suppliers (no pagination).

**Request**: No body.

**Response — 200 OK**

```json
[
  {
    "_id": "string",
    "fullName": "string",
    "avatar": "string | null",
    "bio": "string | null"
  }
]
```

---

### `POST /api/frontend-suppliers`

Fetch suppliers filtered by car search criteria (used when arriving from a search context).

**Request Body**

```json
{
  "pickupLocation": "string | null",
  "carType": ["string"],
  "gearbox": ["string"],
  "mileage": ["string"],
  "fuelPolicy": ["string"],
  "deposit": "number"
}
```

**Response — 200 OK**

```json
[
  {
    "_id": "string",
    "fullName": "string",
    "avatar": "string | null"
  }
]
```
