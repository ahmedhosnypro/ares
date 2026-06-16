using Backend.Application.DTOs.Inspection;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services;

/// <summary>
/// Default implementation of <see cref="IInspectionService"/>. Drives the
/// post-approval inspection workflow: admin assignment → pending
/// inspection → image &amp; notes capture by inspector → submit
/// (approve/reject) → booking state transition + notifications.
/// </summary>
public class InspectionService : IInspectionService
{
    private readonly IRepository<VehicleInspection> _inspectionRepository;
    private readonly IRepository<InspectionImage> _inspectionImageRepository;
    private readonly IRepository<Inspector> _inspectorRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly INotificationService _notificationService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<InspectionService> _logger;

    // Notification type tags — kept here so the front-end can switch on
    // them without hard-coding strings in multiple places.
    private const string NotificationTypeInspectionAssigned = "InspectionAssigned";
    private const string NotificationTypeInspectionApproved = "InspectionApproved";
    private const string NotificationTypeInspectionRejected = "InspectionRejected";

    public InspectionService(
        IRepository<VehicleInspection> inspectionRepository,
        IRepository<InspectionImage> inspectionImageRepository,
        IRepository<Inspector> inspectorRepository,
        IBookingRepository bookingRepository,
        INotificationService notificationService,
        UserManager<ApplicationUser> userManager,
        ILogger<InspectionService> logger)
    {
        _inspectionRepository = inspectionRepository;
        _inspectionImageRepository = inspectionImageRepository;
        _inspectorRepository = inspectorRepository;
        _bookingRepository = bookingRepository;
        _notificationService = notificationService;
        _userManager = userManager;
        _logger = logger;
    }

    // ─── Admin: assign inspector to booking ─────────────────────────────
    public async Task<InspectionDetailsDto> AssignInspectorToBookingAsync(
        Guid bookingId,
        AssignInspectorRequest request,
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        var booking = await _bookingRepository.GetBookingWithDetailsAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking", bookingId);

        // Workflow gate: only bookings that are confirmed/approved can be
        // routed for inspection. Cancelled/Completed bookings are dead
        // ends, and bookings already past inspection should not be
        // reassigned through this endpoint.
        if (booking.Status == BookingStatus.Cancelled || booking.Status == BookingStatus.Completed)
        {
            throw new ConflictException(
                $"Cannot assign an inspector to a booking in status '{booking.Status}'.");
        }

        // Resolve inspector. Spec mandates inactive inspectors must be
        // rejected, so we look the profile up by UserId and validate.
        var inspector = (await _inspectorRepository.GetAllAsync(cancellationToken))
            .FirstOrDefault(i => i.UserId == request.InspectorUserId)
            ?? throw new NotFoundException(
                $"No inspector profile exists for user '{request.InspectorUserId}'.");

        if (!inspector.IsActive)
        {
            throw new ConflictException("Cannot assign an inactive inspector.");
        }

        var inspectorUser = await _userManager.FindByIdAsync(inspector.UserId.ToString())
            ?? throw new NotFoundException("Inspector user", inspector.UserId);

        // Ensure we never create a second inspection for the same booking.
        var allInspections = await _inspectionRepository.GetAllAsync(cancellationToken);
        var inspection = allInspections.FirstOrDefault(i => i.BookingId == bookingId);

        if (inspection == null)
        {
            inspection = new VehicleInspection
            {
                InspectionId = Guid.NewGuid(),
                VehicleId = booking.VehicleId,
                BookingId = booking.Id,
                InspectorId = inspector.UserId,
                InspectionType = "Pickup",
                InspectionDate = DateTime.UtcNow,
                Status = InspectionStatus.Pending,
                IsSubmitted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            await _inspectionRepository.AddAsync(inspection, cancellationToken);
        }
        else
        {
            // Reassignment to a different inspector is allowed only while
            // the inspection is still pending and not yet submitted.
            if (inspection.IsSubmitted)
            {
                throw new ConflictException(
                    "Inspection has already been submitted and is locked.");
            }

            inspection.InspectorId = inspector.UserId;
            inspection.Status = InspectionStatus.Pending;
            inspection.UpdatedAt = DateTime.UtcNow;
            await _inspectionRepository.UpdateAsync(inspection, cancellationToken);
        }

        // Mirror onto booking.
        booking.AssignedInspectorId = inspector.UserId;
        booking.InspectionStatus = InspectionStatus.Pending;
        booking.UpdatedAt = DateTime.UtcNow;
        await _bookingRepository.UpdateAsync(booking, cancellationToken);

        await _inspectionRepository.SaveChangesAsync(cancellationToken);

        // Notify the inspector — best-effort, never break the workflow.
        try
        {
            await _notificationService.CreateNotificationAsync(
                inspector.UserId,
                "New inspection assigned",
                $"You have been assigned to inspect booking {booking.BookingNumber ?? booking.Id.ToString()}.",
                NotificationTypeInspectionAssigned,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send inspection-assigned notification");
        }

        _logger.LogInformation(
            "Admin {AdminId} assigned inspector {InspectorUserId} to booking {BookingId}",
            adminUserId, inspector.UserId, booking.Id);

        return await BuildDetailsDtoAsync(inspection.InspectionId, cancellationToken)
            ?? throw new InvalidOperationException("Failed to load just-created inspection.");
    }


    public async Task<InspectionDetailsDto?> GetByIdAsync(
        Guid inspectionId,
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var inspection = await _inspectionRepository.GetByIdAsync(inspectionId, cancellationToken);
        if (inspection == null) return null;

        // Inspectors can only see their own work; admins see everything.
        if (!isAdmin && inspection.InspectorId != currentUserId)
        {
            throw new ForbiddenException("You do not have access to this inspection.");
        }

        return await BuildDetailsDtoAsync(inspectionId, cancellationToken);
    }

    public async Task<InspectionDetailsDto> UpdateDraftAsync(
        Guid inspectionId,
        Guid inspectorUserId,
        UpdateInspectionDraftRequest request,
        CancellationToken cancellationToken = default)
    {
        var inspection = await LoadEditableAsync(inspectionId, inspectorUserId, cancellationToken);

        if (request.Notes != null) inspection.Notes = request.Notes;
        if (request.GeneralCondition != null) inspection.GeneralCondition = request.GeneralCondition;
        if (request.OdometerReading > 0) inspection.OdometerReading = request.OdometerReading;
        if (request.FuelLevel > 0m) inspection.FuelLevel = request.FuelLevel;
        inspection.UpdatedAt = DateTime.UtcNow;

        await _inspectionRepository.UpdateAsync(inspection, cancellationToken);
        await _inspectionRepository.SaveChangesAsync(cancellationToken);

        return await BuildDetailsDtoAsync(inspectionId, cancellationToken)
            ?? throw new InvalidOperationException("Inspection vanished after update.");
    }

    public async Task<InspectionImageDto> AddImageAsync(
        Guid inspectionId,
        Guid inspectorUserId,
        AddInspectionImageRequest request,
        CancellationToken cancellationToken = default)
    {
        var inspection = await LoadEditableAsync(inspectionId, inspectorUserId, cancellationToken);

        var image = new InspectionImage
        {
            Id = Guid.NewGuid(),
            InspectionId = inspection.InspectionId,
            ImageUrl = request.ImageUrl,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _inspectionImageRepository.AddAsync(image, cancellationToken);
        await _inspectionImageRepository.SaveChangesAsync(cancellationToken);

        return new InspectionImageDto(image.Id, image.InspectionId, image.ImageUrl, image.CreatedAt);
    }

    public async Task<InspectionDetailsDto> SubmitAsync(
        Guid inspectionId,
        Guid inspectorUserId,
        SubmitInspectionRequest request,
        CancellationToken cancellationToken = default)
    {
        var inspection = await LoadEditableAsync(inspectionId, inspectorUserId, cancellationToken);

        // Spec §5: notes are required and at least one image must be
        // attached before submission.
        if (string.IsNullOrWhiteSpace(request.Notes))
        {
            throw new ValidationException("notes", "Inspection notes are required.");
        }

        var images = (await _inspectionImageRepository.GetAllAsync(cancellationToken))
            .Where(i => i.InspectionId == inspection.InspectionId)
            .ToList();
        if (images.Count == 0)
        {
            throw new ValidationException("images", "At least one inspection image is required before submission.");
        }

        inspection.Notes = request.Notes;
        if (!string.IsNullOrWhiteSpace(request.GeneralCondition))
        {
            inspection.GeneralCondition = request.GeneralCondition;
        }
        if (request.OdometerReading > 0) inspection.OdometerReading = request.OdometerReading;
        if (request.FuelLevel > 0m) inspection.FuelLevel = request.FuelLevel;

        inspection.Status = request.Approve ? InspectionStatus.Approved : InspectionStatus.Rejected;
        inspection.IsSubmitted = true;
        inspection.SubmittedAt = DateTime.UtcNow;
        inspection.UpdatedAt = DateTime.UtcNow;

        await _inspectionRepository.UpdateAsync(inspection, cancellationToken);

        // Transition booking state.
        var booking = await _bookingRepository.GetBookingWithDetailsAsync(inspection.BookingId, cancellationToken);
        if (booking != null)
        {
            booking.InspectionStatus = request.Approve
                ? InspectionStatus.Approved
                : InspectionStatus.Rejected;
            booking.UpdatedAt = DateTime.UtcNow;
            await _bookingRepository.UpdateAsync(booking, cancellationToken);
        }

        await _inspectionRepository.SaveChangesAsync(cancellationToken);

        // Fire notifications: customer + admins.
        var bookingLabel = booking?.BookingNumber ?? inspection.BookingId.ToString();
        var notifType = request.Approve
            ? (booking != null ? $"{NotificationTypeInspectionApproved}:{booking.Id}" : NotificationTypeInspectionApproved)
            : (booking != null ? $"{NotificationTypeInspectionRejected}:{booking.Id}" : NotificationTypeInspectionRejected);
        var notifTitle = request.Approve
            ? "Vehicle inspection approved"
            : "Vehicle inspection failed";
        var notifMessage = request.Approve
            ? $"Your booking {bookingLabel} passed inspection and is ready for delivery."
            : $"Your booking {bookingLabel} did not pass the inspection. Our team will reach out shortly.";

        try
        {
            if (booking != null)
            {
                await _notificationService.CreateNotificationAsync(
                    booking.UserId, notifTitle, notifMessage, notifType, cancellationToken);
            }
            await _notificationService.NotifyAdminsAsync(notifTitle, notifMessage, notifType, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send post-submit inspection notifications");
        }

        return await BuildDetailsDtoAsync(inspection.InspectionId, cancellationToken)
            ?? throw new InvalidOperationException("Inspection vanished after submit.");
    }

    public async Task<IReadOnlyList<InspectionDto>> GetHistoryAsync(
        Guid inspectorUserId,
        CancellationToken cancellationToken = default)
    {
        var all = await _inspectionRepository.GetAllAsync(cancellationToken);
        var submitted = all
            .Where(i => i.InspectorId == inspectorUserId && i.IsSubmitted)
            .OrderByDescending(i => i.SubmittedAt ?? i.UpdatedAt)
            .ToList();

        return await ToDtoListAsync(submitted, cancellationToken);
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    /// <summary>
    /// Loads the inspection, asserts the caller owns it and that it is
    /// still editable (not yet submitted). Throws otherwise.
    /// </summary>
    private async Task<VehicleInspection> LoadEditableAsync(
        Guid inspectionId,
        Guid inspectorUserId,
        CancellationToken cancellationToken)
    {
        var inspection = await _inspectionRepository.GetByIdAsync(inspectionId, cancellationToken)
            ?? throw new NotFoundException("Inspection", inspectionId);

        if (inspection.InspectorId != inspectorUserId)
        {
            throw new ForbiddenException("You are not assigned to this inspection.");
        }

        if (inspection.IsSubmitted)
        {
            throw new ConflictException(
                "Inspection has already been submitted and is locked.");
        }

        return inspection;
    }

    /// <summary>
    /// Hydrates the full <see cref="InspectionDetailsDto"/> by loading the
    /// inspection plus its booking, vehicle and inspector context.
    /// </summary>
    private async Task<InspectionDetailsDto?> BuildDetailsDtoAsync(
        Guid inspectionId,
        CancellationToken cancellationToken)
    {
        var inspection = await _inspectionRepository.GetByIdAsync(inspectionId, cancellationToken);
        if (inspection == null) return null;

        var booking = await _bookingRepository.GetBookingWithDetailsAsync(inspection.BookingId, cancellationToken);
        var inspectorUser = inspection.InspectorId.HasValue
            ? await _userManager.FindByIdAsync(inspection.InspectorId.Value.ToString())
            : null;

        var images = (await _inspectionImageRepository.GetAllAsync(cancellationToken))
            .Where(i => i.InspectionId == inspection.InspectionId)
            .OrderBy(i => i.CreatedAt)
            .Select(i => new InspectionImageDto(i.Id, i.InspectionId, i.ImageUrl, i.CreatedAt))
            .ToList();

        return new InspectionDetailsDto(
            InspectionId: inspection.InspectionId,
            BookingId: inspection.BookingId,
            BookingNumber: booking?.BookingNumber,
            VehicleId: inspection.VehicleId,
            VehicleDisplayName: BuildVehicleLabel(booking?.Vehicle),
            InspectorId: inspection.InspectorId ?? Guid.Empty,
            InspectorFullName: BuildPersonName(inspectorUser),
            Status: inspection.Status.ToString(),
            IsSubmitted: inspection.IsSubmitted,
            Notes: inspection.Notes,
            GeneralCondition: inspection.GeneralCondition,
            OdometerReading: inspection.OdometerReading,
            FuelLevel: inspection.FuelLevel,
            InspectionDate: inspection.InspectionDate,
            SubmittedAt: inspection.SubmittedAt,
            CreatedAt: inspection.CreatedAt,
            Images: images);
    }

    private async Task<IReadOnlyList<InspectionDto>> ToDtoListAsync(
        IReadOnlyList<VehicleInspection> inspections,
        CancellationToken cancellationToken)
    {
        if (inspections.Count == 0) return Array.Empty<InspectionDto>();

        // Pre-fetch the image counts and booking info once per inspection.
        var allImages = (await _inspectionImageRepository.GetAllAsync(cancellationToken))
            .GroupBy(i => i.InspectionId)
            .ToDictionary(g => g.Key, g => g.Count());

        var dtos = new List<InspectionDto>(inspections.Count);
        foreach (var inspection in inspections)
        {
            var booking = await _bookingRepository.GetBookingWithDetailsAsync(inspection.BookingId, cancellationToken);
            var inspectorUser = inspection.InspectorId.HasValue
                ? await _userManager.FindByIdAsync(inspection.InspectorId.Value.ToString())
                : null;

            dtos.Add(new InspectionDto(
                InspectionId: inspection.InspectionId,
                BookingId: inspection.BookingId,
                BookingNumber: booking?.BookingNumber,
                VehicleId: inspection.VehicleId,
                VehicleDisplayName: BuildVehicleLabel(booking?.Vehicle),
                InspectorId: inspection.InspectorId ?? Guid.Empty,
                InspectorFullName: BuildPersonName(inspectorUser),
                Status: inspection.Status.ToString(),
                IsSubmitted: inspection.IsSubmitted,
                InspectionDate: inspection.InspectionDate,
                SubmittedAt: inspection.SubmittedAt,
                ImageCount: allImages.TryGetValue(inspection.InspectionId, out var c) ? c : 0));
        }

        return dtos;
    }

    private static string BuildVehicleLabel(Vehicle? vehicle)
    {
        if (vehicle == null) return string.Empty;
        return string.Join(" ", new[] { vehicle.Make, vehicle.Model, vehicle.LicensePlate }
            .Where(s => !string.IsNullOrWhiteSpace(s)));
    }

    private static string BuildPersonName(ApplicationUser? user)
    {
        if (user == null) return string.Empty;
        var name = $"{user.FirstName} {user.LastName}".Trim();
        return string.IsNullOrWhiteSpace(name) ? user.Email ?? string.Empty : name;
    }
}
