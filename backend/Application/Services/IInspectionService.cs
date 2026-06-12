using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Inspection;

namespace Backend.Application.Services;

/// <summary>
/// End-to-end inspection workflow for both administrators (assigning an
/// inspector to an approved booking) and inspectors themselves
/// (operating on their assigned tasks).
/// </summary>
public interface IInspectionService
{
    // ─── Admin ───────────────────────────────────────────────────────────

    /// <summary>
    /// Assigns the inspector identified by <paramref name="request"/> to
    /// the given booking, creating a <c>Pending</c> VehicleInspection if
    /// none exists. Sends a notification to the inspector.
    /// </summary>
    Task<InspectionDetailsDto> AssignInspectorToBookingAsync(
        Guid bookingId,
        AssignInspectorRequest request,
        Guid adminUserId,
        CancellationToken cancellationToken = default);

    // ─── Inspector dashboard ─────────────────────────────────────────────

    Task<InspectionDetailsDto?> GetByIdAsync(
        Guid inspectionId,
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    Task<InspectionDetailsDto> UpdateDraftAsync(
        Guid inspectionId,
        Guid inspectorUserId,
        UpdateInspectionDraftRequest request,
        CancellationToken cancellationToken = default);

    Task<InspectionImageDto> AddImageAsync(
        Guid inspectionId,
        Guid inspectorUserId,
        AddInspectionImageRequest request,
        CancellationToken cancellationToken = default);

    Task<InspectionDetailsDto> SubmitAsync(
        Guid inspectionId,
        Guid inspectorUserId,
        SubmitInspectionRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<InspectionDto>> GetHistoryAsync(
        Guid inspectorUserId,
        CancellationToken cancellationToken = default);
}
