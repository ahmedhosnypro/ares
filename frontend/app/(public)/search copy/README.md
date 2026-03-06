# Search Page

## Page Info

- **Route**: `/search`
- **Access**: Public
- **Purpose**: Car search results page. Accepts pickup/return location and date range (passed as URL query params). Renders a filterable list of available cars with supplier and spec filters. Supports pagination.

---

## API Endpoints

### `POST /api/frontend-cars/:page/:size`

Fetch paginated, filtered cars available for the selected period.

**URL Params**

| Param  | Description                     |
|--------|---------------------------------|
| `page` | 1-based page number             |
| `size` | Number of results per page      |

**Request Body**

```json
{
  "pickupLocation": "string (location _id)",
  "dropOffLocation": "string (location _id)",
  "from": "string (ISO 8601 date)",
  "to": "string (ISO 8601 date)",
  "suppliers": ["string"],
  "carSpecs": {
    "aircon": "boolean | null",
    "moreThanFiveSeats": "boolean | null",
    "autoTransmission": "boolean | null"
  },
  "carType": ["string"],
  "gearbox": ["string"],
  "mileage": ["string"],
  "fuelPolicy": ["string"],
  "deposit": "number"
}
```

**Response — 200 OK**

```json
{
  "resultData": [
    {
      "_id": "string",
      "name": "string",
      "supplier": { "_id": "string", "fullName": "string", "avatar": "string" },
      "type": "string",
      "gearbox": "string",
      "seats": "number",
      "doors": "number",
      "aircon": "boolean",
      "image": "string",
      "price": "number",
      "available": "boolean"
    }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```

---

### `POST /api/frontend-suppliers`

Fetch the list of suppliers available for the current search filters (used for the supplier filter panel).

**Request Body**

```json
{
  "pickupLocation": "string",
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
    "avatar": "string"
  }
]
```

---

### `GET /api/locations-with-position/:language`

Fetch all locations for the location autocomplete/picker.

**Response — 200 OK**

```json
[{ "_id": "string", "name": "string", "latitude": "number", "longitude": "number" }]
```
