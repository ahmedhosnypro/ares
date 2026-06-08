using Backend.Application.DTOs.UserManagement;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Backend.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Services;

/// <summary>
/// Implements the admin hard-delete of a user account.
///
/// Deletion is a two-phase operation:
///   1. <b>Validation</b> — refuse to delete any user that still holds
///      critical business records (bookings, payments, reviews, driver
///      assignments, owned vehicles, or inspections). These rows all use
///      <c>DeleteBehavior.Restrict</c> against the user, so deleting would
///      either orphan history or fail at the database. We surface a clear
///      reason instead.
///   2. <b>Cleanup + delete</b> — remove the user's non-critical child
///      records (profiles, addresses, verifications, favorites, payment
///      methods, notifications, refresh tokens, …) in FK-safe order, then
///      delete the user via <see cref="UserManager{TUser}"/> (which also
///      clears the ASP.NET Identity join tables).
/// </summary>
public class UserDeletionService : IUserDeletionService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<UserDeletionService> _logger;

    public UserDeletionService(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        ILogger<UserDeletionService> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<DeleteUserResponse> DeleteUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            _logger.LogWarning("Delete requested for non-existent user {UserId}", userId);
            throw new NotFoundException($"User with ID {userId} not found");
        }

        // ── Phase 1: validation ──────────────────────────────────────────
        var blockers = await CollectBlockingReasonsAsync(userId, cancellationToken);
        if (blockers.Count > 0)
        {
            var reason = string.Join(" ", blockers);
            _logger.LogWarning(
                "Blocked deletion of user {UserId}. Reasons: {Reasons}", userId, reason);
            throw new ConflictException(
                $"User cannot be deleted because {reason}");
        }

        // ── Phase 2: cleanup non-critical children, then delete user ──────
        var deleted = new Dictionary<string, int>();

        // Use a transaction on relational providers so a partial failure
        // never leaves orphaned child rows. The in-memory provider used by
        // unit tests is non-relational, so we skip the transaction there.
        var useTransaction = _context.Database.IsRelational();
        var transaction = useTransaction
            ? await _context.Database.BeginTransactionAsync(cancellationToken)
            : null;

        try
        {
            // Driver module: request responses and work areas reference the
            // DriverProfile with Restrict, so they must go before the profile.
            var driverProfileIds = await _context.DriverProfiles
                .Where(p => p.UserId == userId)
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);

            if (driverProfileIds.Count > 0)
            {
                var workAreas = await _context.DriverWorkAreas
                    .Where(w => driverProfileIds.Contains(w.DriverProfileId))
                    .ToListAsync(cancellationToken);
                Remove(deleted, "DriverWorkAreas", _context.DriverWorkAreas, workAreas);
            }

            var driverProfiles = await _context.DriverProfiles
                .Where(p => p.UserId == userId)
                .ToListAsync(cancellationToken);
            Remove(deleted, "DriverProfiles", _context.DriverProfiles, driverProfiles);

            // Legacy driving-license record.
            var drivers = await _context.Drivers
                .Where(d => d.UserId == userId)
                .ToListAsync(cancellationToken);
            Remove(deleted, "Drivers", _context.Drivers, drivers);

            // Inspector profile.
            var inspectors = await _context.Inspectors
                .Where(i => i.UserId == userId)
                .ToListAsync(cancellationToken);
            Remove(deleted, "InspectorProfiles", _context.Inspectors, inspectors);

            // Company profile.
            var companyProfiles = await _context.CompanyProfiles
                .Where(c => c.UserId == userId)
                .ToListAsync(cancellationToken);
            Remove(deleted, "CompanyProfiles", _context.CompanyProfiles, companyProfiles);

            // Addresses.
            var addresses = await _context.UserAddresses
                .Where(a => a.UserId == userId)
                .ToListAsync(cancellationToken);
            Remove(deleted, "Addresses", _context.UserAddresses, addresses);

            // Verification records.
            var verifications = await _context.Verifications
                .Where(v => v.UserId == userId)
                .ToListAsync(cancellationToken);
            Remove(deleted, "Verifications", _context.Verifications, verifications);

            // Favorites.
            var favorites = await _context.Favorites
                .Where(f => f.UserId == userId)
                .ToListAsync(cancellationToken);
            Remove(deleted, "Favorites", _context.Favorites, favorites);

            // Saved payment methods (NOT payment transactions — those are a
            // critical record checked in validation).
            var paymentMethods = await _context.PaymentMethods
                .Where(p => p.UserId == userId)
                .ToListAsync(cancellationToken);
            Remove(deleted, "PaymentMethods", _context.PaymentMethods, paymentMethods);

            // Notifications.
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .ToListAsync(cancellationToken);
            Remove(deleted, "Notifications", _context.Notifications, notifications);

            // Refresh tokens.
            var refreshTokens = await _context.RefreshTokens
                .Where(t => t.UserId == userId)
                .ToListAsync(cancellationToken);
            Remove(deleted, "RefreshTokens", _context.RefreshTokens, refreshTokens);

            await _context.SaveChangesAsync(cancellationToken);

            // Finally delete the user. UserManager also removes the Identity
            // join rows (roles, claims, logins, tokens).
            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogError("Identity failed to delete user {UserId}: {Errors}", userId, errors);
                throw new BadRequestException($"Failed to delete user: {errors}");
            }

            if (transaction != null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            _logger.LogInformation(
                "Successfully deleted user {UserId} and {Count} related record group(s)",
                userId, deleted.Count);

            return new DeleteUserResponse(
                Success: true,
                Message: "User deleted successfully",
                UserId: userId,
                DeletedRelatedRecords: deleted);
        }
        catch
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync(cancellationToken);
            }
            throw;
        }
        finally
        {
            if (transaction != null)
            {
                await transaction.DisposeAsync();
            }
        }
    }

    /// <summary>
    /// Builds the list of human-readable reasons (if any) that prevent the
    /// user from being hard-deleted. An empty list means deletion is allowed.
    /// </summary>
    private async Task<List<string>> CollectBlockingReasonsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var reasons = new List<string>();

        // ── Bookings (as the booking customer) ───────────────────────────
        var userBookingIds = await _context.Bookings
            .Where(b => b.UserId == userId)
            .Select(b => b.Id)
            .ToListAsync(cancellationToken);

        if (userBookingIds.Count > 0)
        {
            var activeStatuses = new[]
            {
                BookingStatus.Draft, BookingStatus.Confirmed, BookingStatus.Active,
                BookingStatus.PaymentPending
            };
            var hasActive = await _context.Bookings
                .AnyAsync(b => b.UserId == userId && activeStatuses.Contains(b.Status), cancellationToken);

            reasons.Add(hasActive
                ? "booking history exists (including active bookings)."
                : "booking history exists.");
        }

        // ── Payments (transactions tied to the user's bookings) ──────────
        if (userBookingIds.Count > 0)
        {
            var hasPayments = await _context.Payments
                .AnyAsync(p => userBookingIds.Contains(p.BookingId), cancellationToken);
            if (hasPayments)
            {
                reasons.Add("payment records exist.");
            }
        }

        // ── Reviews (written by the user, or driver reviews left by them) ─
        var hasReviews = await _context.Reviews.AnyAsync(r => r.UserId == userId, cancellationToken)
            || await _context.DriverReviews.AnyAsync(r => r.CustomerId == userId, cancellationToken);
        if (hasReviews)
        {
            reasons.Add("review records exist.");
        }

        // ── Driver assignments (this user, as a driver, is on bookings) ──
        var legacyDriverIds = await _context.Drivers
            .Where(d => d.UserId == userId)
            .Select(d => d.Id)
            .ToListAsync(cancellationToken);
        var driverProfileIds = await _context.DriverProfiles
            .Where(p => p.UserId == userId)
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);

        var assignedAsDriver =
            (legacyDriverIds.Count > 0 && await _context.Bookings
                .AnyAsync(b => b.DriverId != null && legacyDriverIds.Contains(b.DriverId.Value), cancellationToken))
            || (driverProfileIds.Count > 0 && await _context.Bookings
                .AnyAsync(b => b.AssignedDriverProfileId != null
                    && driverProfileIds.Contains(b.AssignedDriverProfileId.Value), cancellationToken));
        if (assignedAsDriver)
        {
            reasons.Add("the driver is linked to bookings.");
        }

        // ── Vehicle ownership (company / owner accounts with vehicles) ───
        var hasVehicles = await _context.Vehicles.AnyAsync(v => v.UserId == userId, cancellationToken);
        if (hasVehicles)
        {
            reasons.Add("the account owns vehicles.");
        }

        // ── Inspections (user is an inspector on inspections/bookings) ───
        var hasInspections =
            await _context.VehicleInspections.AnyAsync(i => i.InspectorId == userId, cancellationToken)
            || await _context.Bookings.AnyAsync(b => b.AssignedInspectorId == userId, cancellationToken);
        if (hasInspections)
        {
            reasons.Add("inspection records exist.");
        }

        return reasons;
    }

    /// <summary>
    /// Removes a batch of entities and records the count under <paramref name="key"/>.
    /// </summary>
    private static void Remove<T>(
        IDictionary<string, int> tally,
        string key,
        DbSet<T> set,
        IReadOnlyCollection<T> entities) where T : class
    {
        if (entities.Count == 0)
        {
            return;
        }

        set.RemoveRange(entities);
        tally[key] = entities.Count;
    }
}
