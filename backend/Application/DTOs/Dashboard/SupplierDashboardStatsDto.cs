namespace Backend.Application.DTOs.Dashboard;

/// <summary>
/// Supplier-scoped dashboard statistics returned by
/// <c>GET /api/supplier/dashboard/stats</c>.
///
/// All counts/sums are filtered to vehicles where
/// <see cref="Backend.Domain.Entities.Vehicle.UserId"/> equals the
/// authenticated supplier's id, so a supplier never sees another supplier's
/// numbers. Field names are camelCased on the wire to match the existing
/// frontend contract in <c>frontend/api-clients/supplier-dashboard</c>.
/// </summary>
/// <param name="TotalVehicles">Total number of (active, non-deleted) vehicles owned by the supplier.</param>
/// <param name="PendingVehicles">Subset of <paramref name="TotalVehicles"/> awaiting admin approval (Status = "Pending").</param>
/// <param name="ActiveBookings">Count of bookings on the supplier's vehicles that are currently in flight (Active or Confirmed).</param>
/// <param name="TotalEarnings">Sum of <c>TotalPrice</c> across the supplier's <c>Completed</c> bookings only — pending and cancelled bookings are excluded.</param>
public record SupplierDashboardStatsDto(
    int TotalVehicles,
    int PendingVehicles,
    int ActiveBookings,
    decimal TotalEarnings
);
