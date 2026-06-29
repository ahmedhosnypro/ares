using Backend.Application.DTOs.Driver;

namespace Backend.Application.DTOs.Booking;

/// <summary>
/// Lightweight customer info for booking details
/// </summary>
public record BookingCustomerDto(
    Guid Id,
    string FullName,
    string? Email,
    string? Phone,
    string? ProfileImage = null,
    bool IsEmailVerified = false,
    string? VerificationStatus = null);

/// <summary>
/// Inspection overview attached to a booking — operational data only,
/// no nested per-image / per-checklist payloads.
/// </summary>
public record BookingInspectionOverviewDto(
    string PreInspectionStatus,   // Pending / Approved / Rejected / NotRequired
    string PostInspectionStatus,  // Pending / Approved / Rejected / NotRequired
    Guid? AssignedInspectorId,
    string? AssignedInspectorName,
    DateTime? PreInspectionDate,
    DateTime? PostInspectionDate);

/// <summary>
/// Full pickup / return inspection details surfaced on the admin booking page.
/// Includes mileage, fuel level, notes and image URLs so the UI can render a
/// rich Pickup / Return Inspection card without an extra round-trip.
/// </summary>
public record BookingInspectionFullDto(
    Guid InspectionId,
    string InspectionType,        // Pickup | Return
    Guid InspectorId,
    string InspectorName,
    string Status,                // Pending | Approved | Rejected
    DateTime InspectionDate,
    DateTime? SubmittedAt,
    bool IsSubmitted,
    int OdometerReading,
    decimal FuelLevel,
    string? GeneralCondition,
    string? Notes,
    IReadOnlyList<string> ImageUrls);

/// <summary>
/// Detailed payment information for the latest payment row associated with
/// the booking. Includes refund-related fields when applicable.
/// </summary>
public record BookingPaymentDetailsDto(
    Guid PaymentId,
    Guid? TransactionId,
    string Method,
    decimal Amount,
    string Currency,
    string Status,
    string? AuthorizationCode,
    DateTime? ProcessedAt,
    string? FailureReason,
    DateTime? CreatedAt,
    decimal? RefundAmount = null,
    string? RefundStatus = null,
    DateTime? RefundProcessedAt = null,
    string? RefundMethod = null);

/// <summary>
/// A single event on the booking's activity timeline. Built from real
/// data (booking creation, status changes, inspections, payments, etc.)
/// — never static / fake entries.
/// </summary>
public record BookingTimelineEventDto(
    string Type,           // BookingCreated, StatusChanged, PaymentCompleted,
                           // InspectorAssigned, PickupInspectionCompleted,
                           // ReturnInspectionCompleted, BookingCancelled, BookingUpdated
    string Title,
    string? Description,
    DateTime OccurredAt);

/// <summary>
/// DTO for detailed booking information
/// </summary>
public record BookingDetailsDto(
    Guid Id,
    string? BookingNumber,
    BookingCustomerDto? Customer,
    VehicleWithSupplierDto Car,
    DriverDto? Driver,
    LocationDto PickupLocation,
    LocationDto DropOffLocation,
    DateTime From,
    DateTime To,
    int? TotalDays,
    decimal Price,
    decimal? DailyRate,
    string Status,
    bool PayLater,
    string? PaymentStatus,
    string? PaymentMethod,
    BookingInspectionOverviewDto? Inspection,
    DateTime? CreatedAt,
    DateTime? UpdatedAt,
    BookingInspectionFullDto? PickupInspection = null,
    BookingInspectionFullDto? ReturnInspection = null,
    BookingPaymentDetailsDto? PaymentDetails = null,
    IReadOnlyList<BookingTimelineEventDto>? Timeline = null,
    PublicDriverDto? AssignedDriverProfile = null,
    decimal? VehicleFee = null,
    decimal? OriginalPrice = null,
    decimal? DiscountAmount = null,
    decimal? DriverFee = null,
    decimal? GrandTotal = null,
    bool RequiresDriver = false,
    Guid? ApprovedBy = null,
    DateTime? ApprovedAt = null,
    string? RejectionReason = null);
