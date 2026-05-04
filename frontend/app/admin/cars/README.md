# Admin — Cars List

## Page Info

- **Route**: `/admin/cars`
- **Access**: 🔒 Admin / Supplier
- **Purpose**: Paginated list of all cars. Admins see all cars; suppliers see only their own. Supports filtering by supplier and searching by name. Cars with active bookings cannot be deleted.

---

## API Endpoints

### `POST /api/cars/:page/:size`

Fetch a paginated list of cars.

**URL Params**

| Param  | Description                |
| ------ | -------------------------- |
| `page` | 1-based page number        |
| `size` | Number of results per page |

**Request Body**

```json
{
  "suppliers": ["string (_id)"],
  "keyword": "string | null"
}
```

**Response — 200 OK**

```json
{
  "resultData": [
    {
      "_id": "string",
      "name": "string",
      "supplier": { "_id": "string", "fullName": "string" },
      "type": "string",
      "gearbox": "string",
      "seats": "number",
      "price": "number",
      "image": "string | null",
      "available": "boolean"
    }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```

---

### `GET /api/check-car/:id`

Check if a car has active bookings before attempting deletion.

**URL Params**

| Param | Description |
| ----- | ----------- |
| `id`  | Car `_id`   |

**Response**

| Status | Meaning                                 |
| ------ | --------------------------------------- |
| 200    | Car has active bookings — cannot delete |
| 204    | No active bookings — safe to delete     |

---

### `DELETE /api/delete-car/:id`

Delete a car (only if no active bookings).

**URL Params**

| Param | Description |
| ----- | ----------- |
| `id`  | Car `_id`   |

**Response**

| Status | Meaning                 |
| ------ | ----------------------- |
| 200    | Car deleted             |
| 400    | Car has active bookings |
| 404    | Car not found           |

---

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

| Param          | Description                               |
| -------------- | ----------------------------------------- |
| `id`           | Current car `_id` (to exclude from check) |
| `licensePlate` | New license plate to validate             |

**Response**

| Status | Meaning                           |
| ------ | --------------------------------- |
| 200    | Plate is available                |
| 204    | Plate already used by another car |

---

### `POST /api/update-car-image/:id`

Upload and set a new car image.

**URL Params**

| Param | Description |
| ----- | ----------- |
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
| ------ | ---------------------------- |
| 200    | Car updated                  |
| 400    | Invalid fields               |
| 404    | Car not found                |
| 409    | License plate already in use |

---

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

---

# Admin — Create Car

## Page Info

- **Route**: `/admin/cars/create`
- **Access**: 🔒 Admin / Supplier
- **Purpose**: Form to add a new car to the fleet. Collects all car details including specs, pricing (daily/weekly/monthly), and images. Validates license plate uniqueness before saving.

---

## API Endpoints

### `GET /api/all-suppliers`

Load supplier list for the supplier selector (admin only — suppliers see only themselves).

**Response — 200 OK**

```json
[{ "_id": "string", "fullName": "string" }]
```

---

### `GET /api/validate-license-plate/:licensePlate`

Check that the license plate is not already in use.

**URL Params**

| Param          | Description            |
| -------------- | ---------------------- |
| `licensePlate` | License plate to check |

**Response**

| Status | Meaning              |
| ------ | -------------------- |
| 200    | Plate is available   |
| 204    | Plate already in use |

---

### `POST /api/create-car-image`

Upload a car image to a temporary folder.

**Request**: `multipart/form-data` with `image` file field.

**Response — 200 OK**

```json
{ "image": "string (temp filename)" }
```

---

### `POST /api/delete-temp-car-image/:image`

Delete a temporary car image if the user cancels the upload.

**URL Params**

| Param   | Description             |
| ------- | ----------------------- |
| `image` | Temp filename to delete |

---

### `POST /api/create-car`

Create the new car record.

**Request Body**

```json
{
  "name": "string",
  "supplier": "string (_id)",
  "minimumAge": "number",
  "available": "boolean",
  "type": "string",
  "licenseRequired": "boolean",
  "seats": "number",
  "doors": "number",
  "aircon": "boolean",
  "image": "string",
  "price": "number",
  "dailyPrice": "number | null",
  "discountedDailyPrice": "number | null",
  "weeklyPrice": "number | null",
  "discountedWeeklyPrice": "number | null",
  "monthlyPrice": "number | null",
  "discountedMonthlyPrice": "number | null",
  "deposit": "number",
  "mileage": "string",
  "fuelPolicy": "string",
  "gearbox": "string",
  "locations": ["string (_id)"],
  "licensePlate": "string",
  "co2": "number | null"
}
```

**Response — 200 OK**

```json
{ "_id": "string" }
```

**Error Responses**

| Status | Meaning                      |
| ------ | ---------------------------- |
| 400    | Missing required fields      |
| 409    | License plate already in use |

---

# Admin — Cars List

## Page Info

- **Route**: `/admin/cars`
- **Access**: 🔒 Admin / Supplier
- **Purpose**: Paginated list of all cars. Admins see all cars; suppliers see only their own. Supports filtering by supplier and searching by name. Cars with active bookings cannot be deleted.

---

## API Endpoints

### `POST /api/cars/:page/:size`

Fetch a paginated list of cars.

**URL Params**

| Param  | Description                |
| ------ | -------------------------- |
| `page` | 1-based page number        |
| `size` | Number of results per page |

**Request Body**

```json
{
  "suppliers": ["string (_id)"],
  "keyword": "string | null"
}
```

**Response — 200 OK**

```json
{
  "resultData": [
    {
      "_id": "string",
      "name": "string",
      "supplier": { "_id": "string", "fullName": "string" },
      "type": "string",
      "gearbox": "string",
      "seats": "number",
      "price": "number",
      "image": "string | null",
      "available": "boolean"
    }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```

---

### `GET /api/check-car/:id`

Check if a car has active bookings before attempting deletion.

**URL Params**

| Param | Description |
| ----- | ----------- |
| `id`  | Car `_id`   |

**Response**

| Status | Meaning                                 |
| ------ | --------------------------------------- |
| 200    | Car has active bookings — cannot delete |
| 204    | No active bookings — safe to delete     |

---

### `DELETE /api/delete-car/:id`

Delete a car (only if no active bookings).

**URL Params**

| Param | Description |
| ----- | ----------- |
| `id`  | Car `_id`   |

**Response**

| Status | Meaning                 |
| ------ | ----------------------- |
| 200    | Car deleted             |
| 400    | Car has active bookings |
| 404    | Car not found           |
