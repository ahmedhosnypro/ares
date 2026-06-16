using System;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Application.Interfaces;

/// <summary>
/// Service interface for handling supplier restriction workflows.
/// </summary>
public interface ISupplierRestrictionService
{
    /// <summary>
    /// Applies restriction logic for a supplier, deactivating their vehicles 
    /// and cancelling future bookings.
    /// </summary>
    Task ApplyRestrictionAsync(Guid supplierId, Guid adminId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks a restricted supplier's active bookings. If none are left,
    /// automatically converts their status to "Blocked".
    /// </summary>
    Task CheckAndConvertToBlockedAsync(Guid supplierId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes restriction logic for a supplier, making their active vehicles available again.
    /// </summary>
    Task RemoveRestrictionAsync(Guid supplierId, Guid adminId, CancellationToken cancellationToken = default);
}
