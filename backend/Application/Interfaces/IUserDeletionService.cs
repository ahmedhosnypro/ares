using Backend.Application.DTOs.UserManagement;

namespace Backend.Application.Interfaces;

/// <summary>
/// Service responsible for the admin "hard delete" of a user account.
///
/// A user is permanently removed from the database ONLY when they hold no
/// critical business records (bookings, payments, reviews, driver
/// assignments, owned vehicles, or inspections). If any such record exists
/// the deletion is rejected and the caller is told why.
///
/// Implemented in the Infrastructure layer because it needs direct
/// <c>ApplicationDbContext</c> access to validate against, and clean up,
/// many related tables in a single transaction.
/// </summary>
public interface IUserDeletionService
{
    /// <summary>
    /// Permanently deletes a user and their non-critical child records.
    /// </summary>
    /// <param name="userId">Id of the user to delete.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Details of the deletion, including which related records were removed.</returns>
    /// <exception cref="Backend.Application.Exceptions.NotFoundException">
    /// Thrown when no user exists with the supplied id.
    /// </exception>
    /// <exception cref="Backend.Application.Exceptions.ConflictException">
    /// Thrown when the user has critical business records and therefore cannot
    /// be deleted. The message explains exactly which records block deletion.
    /// </exception>
    Task<DeleteUserResponse> DeleteUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
