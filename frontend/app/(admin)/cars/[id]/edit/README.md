# Admin — Edit Car

## Page Info

- **Route**: `/admin/cars/[id]/edit`
- **Access**: 🔒 Admin / Supplier
- **Purpose**: Edit an existing car's details — specs, pricing, locations, and image. Validates license plate uniqueness on change.

---

## API Endpoints

### `GET /api/car/:id/:language`

Load existing car data to pre-populate the form.

---

### `GET /api/validate-license-plate/:id/:licensePlate`

Check that the new license plate is not in use by a different car.

**URL Params**

| Param          | Description                             |
|----------------|-----------------------------------------|
| `id`           | Current car `_id` (to exclude from check) |
| `licensePlate` | New license plate to validate           |

**Response**

| Status | Meaning                           |
|--------|-----------------------------------|
| 200    | Plate is available                |
| 204    | Plate already used by another car |

---

### `POST /api/update-car-image/:id`

Upload and set a new car image.

**URL Params**

| Param | Description |
|-------|-------------|
| `id`  | Car `_id`   |

**Request**: `multipart/form-data` with `image` file field.

---

### `POST /api/delete-car-image/:id`

Remove the car's current image.

---

### `POST /api/delete-temp-car-image/:image`

Delete a temporary upload that was not confirmed.

---

### `PUT /api/update-car`

Save all changes to the car.

**Request Body**

Same shape as `POST /api/create-car` plus `_id` field.

```json
{
  "_id": "string",
  "name": "string",
  "supplier": "string (_id)",
  "available": "boolean",
  "price": "number",
  "dailyPrice": "number | null",
  "weeklyPrice": "number | null",
  "monthlyPrice": "number | null",
  "deposit": "number",
  "mileage": "string",
  "fuelPolicy": "string",
  "gearbox": "string",
  "seats": "number",
  "doors": "number",
  "aircon": "boolean",
  "type": "string",
  "locations": ["string (_id)"],
  "licensePlate": "string",
  "image": "string | null",
  "co2": "number | null"
}
```

**Response**

| Status | Meaning                      |
|--------|------------------------------|
| 200    | Car updated                  |
| 400    | Invalid fields               |
| 404    | Car not found                |
| 409    | License plate already in use |
