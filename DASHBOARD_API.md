# Admin Dashboard API Requirements

This document outlines the API endpoints required by the Frontend for the Admin Dashboard. Please ensure the backend implements these endpoints and returns the exact JSON structures defined below.

## 1. Dashboard Statistics (Stats Cards)
- **Endpoint:** `GET /api/dashboard/summary`
- **Status:** 🟡 **Partially Available (Needs Update)**
- **Requirement:** The endpoint exists, but the DTO needs to be updated to include the following missing fields so the frontend can display all 8 top statistics cards dynamically.

```json
{
  // --- MISSING FIELDS (Please add these) ---
  "activeVehicles": 150,
  "activeBookings": 234,
  "pendingVerifications": 45,
  "availableVehicles": 342,
  "pendingInspections": 12,
  
  // --- EXISTING FIELDS (Already working) ---
  "totalSuppliers": 20,
  "totalRevenue": 45231.50,
  "totalUsers": 892,
  "totalVehicles": 342,
  "totalBookings": 300,
  "pendingBookings": 15
}
```

## 2. Revenue Overview Chart
- **Endpoint:** `GET /api/dashboard/revenue`
- **Status:** 🔴 **Not Available (Needs Implementation)**
- **Requirement:** Must return an array of revenue statistics over time to draw the chart.

```json
[
  { 
    "date": "May 1", 
    "revenue": 45000, 
    "bookings": 58, 
    "refunds": 5000 
  },
  { 
    "date": "May 6", 
    "revenue": 52000, 
    "bookings": 72, 
    "refunds": 8000 
  }
]
```

## 3. Vehicle Status Chart
- **Endpoint:** `GET /api/dashboard/vehicle-status`
- **Status:** 🔴 **Not Available (Needs Implementation)**
- **Requirement:** Must return the distribution of vehicles by their current status for the pie/donut chart.

```json
[
  { "name": "Active", "value": 400, "color": "#10b981" },
  { "name": "In Maintenance", "value": 50, "color": "#f59e0b" },
  { "name": "Inactive", "value": 30, "color": "#ef4444" }
]
```

## 4. Alerts Center
- **Endpoint:** `GET /api/dashboard/alerts`
- **Status:** 🔴 **Not Available (Needs Implementation)**
- **Requirement:** Must return an array of alerts. The `type` field must be one of: `error`, `warning`, `info`, `success`.

```json
[
  {
    "id": "al1",
    "message": "3 driver licenses will expire in 7 days",
    "timestamp": "May 25, 2024 • 10:30 AM",
    "type": "warning"
  },
  {
    "id": "al2",
    "message": "Database backup completed successfully",
    "timestamp": "May 24, 2024 • 03:00 AM",
    "type": "success"
  }
]
```

## 5. Top Vehicles by Booking
- **Endpoint:** `GET /api/dashboard/top-vehicles`
- **Status:** 🔴 **Not Available (Needs Implementation)**
- **Requirement:** Must return an array of the most frequently booked vehicles.

```json
[
  {
    "id": "1",
    "make": "Mercedes-Benz",
    "model": "S-Class",
    "year": 2023,
    "bookingsCount": 120,
    "revenue": 12500,
    "imageUrl": "https://example.com/image.jpg",
    "trendPercentage": 12
  }
]
```

---

### Note on Endpoints That Are Working ✅
The following endpoints are currently being successfully used by the frontend and require **NO modifications**:
- `GET /api/dashboard/recent-summary` (Recent Activity Table)
- `POST /api/admin/bookings/search/1/5` (Recent Bookings Table)
