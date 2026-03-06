# Locations Page

## Page Info

- **Route**: `/locations`
- **Access**: Public
- **Purpose**: Browse all available pick-up and drop-off locations, grouped by country. Supports pagination and search by location name.

---

## API Endpoints

### `GET /api/locations/:page/:size/:language`

Fetch a paginated list of all locations.

**URL Params**

| Param      | Description                       |
|------------|-----------------------------------|
| `page`     | 1-based page number               |
| `size`     | Number of results per page        |
| `language` | Language code for localized names |

**Response — 200 OK**

```json
{
  "resultData": [
    {
      "_id": "string",
      "name": "string",
      "country": { "_id": "string", "name": "string" },
      "image": "string | null",
      "latitude": "number | null",
      "longitude": "number | null"
    }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```

---

### `GET /api/countries-with-locations/:language/:imageRequired/:minLocations`

Fetch countries with their locations for the grouped view.

**URL Params**

| Param           | Description                                               |
|-----------------|-----------------------------------------------------------|
| `language`      | Language code for localized names                         |
| `imageRequired` | `1` to only include countries that have a cover image     |
| `minLocations`  | Minimum number of locations required to include a country |

**Response — 200 OK**

```json
[
  {
    "_id": "string",
    "name": "string",
    "image": "string | null",
    "locations": [
      { "_id": "string", "name": "string" }
    ]
  }
]
```
