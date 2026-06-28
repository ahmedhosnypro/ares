# Backend Specification: Pagination & Filtering for Inspector History

## 1. Overview
To optimize network payloads and improve performance, the inspection history endpoint for inspectors must be updated from returning a flat list of all records to returning paginated, filtered results.

**Target Endpoint:** `GET /api/inspector/inspections/history`

---

## 2. Request Parameters
The endpoint should accept the following query parameters:

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | `int` | No | `1` | The 1-based page number to retrieve. |
| `pageSize` | `int` | No | `10` | The number of records to return per page. |
| `searchTerm` | `string` | No | `null` | Optional search term matching `BookingNumber`, `VehicleDisplayName`, or `Status`. |
| `status` | `string` | No | `null` | Optional status filter (`Approved`, `Rejected`, `Pending`). If `"All"` or omitted, returns all. |

---

## 3. Response Format
The response must use the project's standard `PagedResult<T>` wrapper class:

```json
{
  "data": [
    {
      "inspectionId": "string (guid)",
      "bookingId": "string (guid)",
      "bookingNumber": "string",
      "vehicleId": "string (guid)",
      "vehicleDisplayName": "string",
      "inspectorId": "string (guid)",
      "inspectorFullName": "string",
      "status": "string",
      "isSubmitted": true,
      "inspectionDate": "string (ISO date)",
      "submittedAt": "string (ISO date)",
      "imageCount": 0
    }
  ],
  "page": 1,
  "pageSize": 10,
  "totalCount": 42,
  "totalPages": 5,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

---

## 4. Implementation Recommendations (C#)

### A. Controller Action
Update the endpoint in `InspectorDashboardController.cs` to bind from query parameters:

```csharp
[HttpGet("inspections/history")]
[ProducesResponseType(typeof(PagedResult<InspectionDto>), StatusCodes.Status200OK)]
public async Task<ActionResult<PagedResult<InspectionDto>>> GetHistory(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10,
    [FromQuery] string? searchTerm = null,
    [FromQuery] string? status = null,
    CancellationToken cancellationToken = default)
{
    if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

    var result = await _inspectionService.GetHistoryAsync(
        userId, page, pageSize, searchTerm, status, cancellationToken);
    return Ok(result);
}
```

### B. Service Method
Update `IInspectionService.cs` and `InspectionService.cs`:

```csharp
public async Task<PagedResult<InspectionDto>> GetHistoryAsync(
    Guid inspectorUserId,
    int page,
    int pageSize,
    string? searchTerm,
    string? status,
    CancellationToken cancellationToken = default)
{
    // Apply initial filters
    var query = _dbContext.VehicleInspections
        .Where(i => i.InspectorId == inspectorUserId && i.IsSubmitted);

    if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
    {
        query = query.Where(i => i.Status == status);
    }

    if (!string.IsNullOrWhiteSpace(searchTerm))
    {
        var term = searchTerm.ToLower();
        query = query.Where(i => 
            i.Booking.BookingNumber.ToLower().Contains(term) ||
            i.Vehicle.DisplayName.ToLower().Contains(term) ||
            i.Status.ToLower().Contains(term));
    }

    // Get total count
    var totalCount = await query.CountAsync(cancellationToken);

    // Apply pagination and sort
    var items = await query
        .OrderByDescending(i => i.SubmittedAt ?? i.UpdatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync(cancellationToken);

    var dtos = await ToDtoListAsync(items, cancellationToken);
    var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

    return new PagedResult<InspectionDto>(dtos, page, pageSize, totalCount, totalPages);
}
```
