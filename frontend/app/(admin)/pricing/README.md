# Admin — Pricing

## Page Info

- **Route**: `/admin/pricing`
- **Access**: 🔒 Admin / Supplier
- **Purpose**: View and manage car pricing — daily, weekly, and monthly rates with optional discounted variants. Pricing data lives on each car record. This page lists cars with their current rates and allows inline editing.

---

## API Endpoints

### `POST /api/cars/:page/:size`

Fetch cars with their current pricing for the pricing table.

**URL Params**

| Param  | Description                |
|--------|----------------------------|
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
      "price": "number",
      "dailyPrice": "number | null",
      "discountedDailyPrice": "number | null",
      "weeklyPrice": "number | null",
      "discountedWeeklyPrice": "number | null",
      "monthlyPrice": "number | null",
      "discountedMonthlyPrice": "number | null"
    }
  ],
  "pageInfo": [{ "totalRecords": "number" }]
}
```

---

### `PUT /api/update-car`

Save updated pricing for a single car (send the full car object with updated price fields).

**Request Body**

Full car object (same as Edit Car) with updated price fields.

**Response**

| Status | Meaning         |
|--------|-----------------|
| 200    | Car updated     |
| 400    | Invalid fields  |

---

### `POST /api/admin-suppliers`

Fetch suppliers for the supplier filter.

**Request Body**

```json
{ "user": "string (_id)" }
```
