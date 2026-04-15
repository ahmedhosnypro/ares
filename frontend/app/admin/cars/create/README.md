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
