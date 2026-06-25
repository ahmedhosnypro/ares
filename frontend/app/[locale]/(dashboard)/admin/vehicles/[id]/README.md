# Admin — Car Detail

## Page Info

- **Route**: `/admin/cars/[id]`
- **Access**: 🔒 Admin / Supplier
- **Purpose**: Read-only view of a specific car's full details — specs, pricing, available locations, and current booking status.

---

## API Endpoints

### `GET /api/car/:id/:language`

Fetch full car details.

**URL Params**

| Param      | Description                        |
| ---------- | ---------------------------------- |
| `id`       | Car `_id`                          |
| `language` | Language code for localized fields |

**Response — 200 OK**

```json
{
  "_id": "string",
  "name": "string",
  "supplier": { "_id": "string", "fullName": "string", "avatar": "string | null" },
  "minimumAge": "number",
  "available": "boolean",
  "type": "string",
  "licenseRequired": "boolean",
  "seats": "number",
  "doors": "number",
  "aircon": "boolean",
  "image": "string | null",
  "price": "number",
  "dailyPrice": "number | null",
  "weeklyPrice": "number | null",
  "monthlyPrice": "number | null",
  "deposit": "number",
  "mileage": "string",
  "fuelPolicy": "string",
  "gearbox": "string",
  "locations": [{ "_id": "string", "name": "string" }],
  "licensePlate": "string",
  "co2": "number | null"
}
```

**Error Responses**

| Status | Meaning       |
| ------ | ------------- |
| 404    | Car not found |
