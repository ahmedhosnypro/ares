namespace Backend.Application.DTOs.UserManagement;

/// <summary>
/// Response DTO returned after a successful admin user deletion.
/// Mirrors the shape of <see cref="UserManagementResponse"/> but adds a
/// breakdown of the non-critical child records that were removed alongside
/// the user, so the admin UI can surface meaningful success feedback.
/// </summary>
public record DeleteUserResponse(
    bool Success,
    string Message,
    Guid UserId,
    IReadOnlyDictionary<string, int> DeletedRelatedRecords
);
