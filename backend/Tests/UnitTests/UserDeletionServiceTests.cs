using System.Reflection;
using Backend.Api.Controllers;
using Backend.Application.Exceptions;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Backend.Infrastructure.Data;
using Backend.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Backend.Tests.UnitTests;

/// <summary>
/// Unit tests for <see cref="UserDeletionService"/> — the admin hard-delete feature.
///
/// Covers the acceptance criteria:
///   1. Admin can delete empty/test accounts.
///   2. Admin cannot delete users with booking history.
///   3. Admin cannot delete users with payment history.
///   4. Admin cannot delete vehicle owners with active vehicles.
///   5. Non-admin users cannot access the endpoint (authorization metadata).
/// Plus: not-found handling, review/inspection/driver blocks, and child-record cleanup.
/// </summary>
public class UserDeletionServiceTests
{
    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .EnableSensitiveDataLogging()
            .Options;
        return new ApplicationDbContext(options);
    }

    private static Mock<UserManager<ApplicationUser>> CreateUserManagerMock(ApplicationDbContext context)
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        var mgr = new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        // Make DeleteAsync actually remove the user from the in-memory store
        // so assertions reflect the real outcome.
        mgr.Setup(m => m.DeleteAsync(It.IsAny<ApplicationUser>()))
            .Returns(async (ApplicationUser u) =>
            {
                context.Users.Remove(u);
                await context.SaveChangesAsync();
                return IdentityResult.Success;
            });

        return mgr;
    }

    private static UserDeletionService CreateService(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        return new UserDeletionService(
            context,
            userManager,
            new Mock<ILogger<UserDeletionService>>().Object);
    }

    private static ApplicationUser SeedUser(ApplicationDbContext context, string email = "test@example.com")
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            FirstName = "Test",
            LastName = "User",
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        context.Users.Add(user);
        context.SaveChanges();
        return user;
    }

    // ── 1. Admin can delete empty/test accounts ─────────────────────────
    [Fact]
    public async Task DeleteUserAsync_EmptyAccount_DeletesSuccessfully()
    {
        using var context = CreateContext();
        var user = SeedUser(context);
        var userManager = CreateUserManagerMock(context);
        var service = CreateService(context, userManager.Object);

        var result = await service.DeleteUserAsync(user.Id);

        Assert.True(result.Success);
        Assert.Equal(user.Id, result.UserId);
        userManager.Verify(m => m.DeleteAsync(It.Is<ApplicationUser>(u => u.Id == user.Id)), Times.Once);
        Assert.False(await context.Users.AnyAsync(u => u.Id == user.Id));
    }

    // ── Not found ───────────────────────────────────────────────────────
    [Fact]
    public async Task DeleteUserAsync_UnknownUser_ThrowsNotFound()
    {
        using var context = CreateContext();
        var userManager = CreateUserManagerMock(context);
        var service = CreateService(context, userManager.Object);

        await Assert.ThrowsAsync<NotFoundException>(
            () => service.DeleteUserAsync(Guid.NewGuid()));
    }

    // ── 2. Cannot delete users with booking history ─────────────────────
    [Fact]
    public async Task DeleteUserAsync_WithBookingHistory_ThrowsConflict()
    {
        using var context = CreateContext();
        var user = SeedUser(context);
        context.Bookings.Add(new Booking
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            VehicleId = Guid.NewGuid(),
            Status = BookingStatus.Completed,
        });
        await context.SaveChangesAsync();

        var userManager = CreateUserManagerMock(context);
        var service = CreateService(context, userManager.Object);

        var ex = await Assert.ThrowsAsync<ConflictException>(
            () => service.DeleteUserAsync(user.Id));

        Assert.Contains("booking history", ex.Message, StringComparison.OrdinalIgnoreCase);
        userManager.Verify(m => m.DeleteAsync(It.IsAny<ApplicationUser>()), Times.Never);
        Assert.True(await context.Users.AnyAsync(u => u.Id == user.Id));
    }

    [Fact]
    public async Task DeleteUserAsync_WithActiveBooking_MentionsActiveInMessage()
    {
        using var context = CreateContext();
        var user = SeedUser(context);
        context.Bookings.Add(new Booking
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            VehicleId = Guid.NewGuid(),
            Status = BookingStatus.Active,
        });
        await context.SaveChangesAsync();

        var service = CreateService(context, CreateUserManagerMock(context).Object);

        var ex = await Assert.ThrowsAsync<ConflictException>(
            () => service.DeleteUserAsync(user.Id));
        Assert.Contains("active", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    // ── 3. Cannot delete users with payment history ─────────────────────
    [Fact]
    public async Task DeleteUserAsync_WithPaymentHistory_ThrowsConflict()
    {
        using var context = CreateContext();
        var user = SeedUser(context);
        var bookingId = Guid.NewGuid();
        context.Bookings.Add(new Booking
        {
            Id = bookingId,
            UserId = user.Id,
            VehicleId = Guid.NewGuid(),
            Status = BookingStatus.Completed,
        });
        context.Payments.Add(new BookingPayment
        {
            PaymentId = Guid.NewGuid(),
            BookingId = bookingId,
            TransactionId = Guid.NewGuid(),
            Amount = 100m,
        });
        await context.SaveChangesAsync();

        var service = CreateService(context, CreateUserManagerMock(context).Object);

        var ex = await Assert.ThrowsAsync<ConflictException>(
            () => service.DeleteUserAsync(user.Id));
        // Booking is also present, so message mentions booking; payment block is exercised too.
        Assert.Contains("payment", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    // ── 4. Cannot delete vehicle owners with active vehicles ────────────
    [Fact]
    public async Task DeleteUserAsync_WithOwnedVehicles_ThrowsConflict()
    {
        using var context = CreateContext();
        var user = SeedUser(context);
        context.Vehicles.Add(new Vehicle
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
        });
        await context.SaveChangesAsync();

        var userManager = CreateUserManagerMock(context);
        var service = CreateService(context, userManager.Object);

        var ex = await Assert.ThrowsAsync<ConflictException>(
            () => service.DeleteUserAsync(user.Id));

        Assert.Contains("vehicle", ex.Message, StringComparison.OrdinalIgnoreCase);
        userManager.Verify(m => m.DeleteAsync(It.IsAny<ApplicationUser>()), Times.Never);
    }

    // ── Reviews block deletion ──────────────────────────────────────────
    [Fact]
    public async Task DeleteUserAsync_WithReviews_ThrowsConflict()
    {
        using var context = CreateContext();
        var user = SeedUser(context);
        context.Reviews.Add(new Review
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            BookingId = Guid.NewGuid(),
            VehicleId = Guid.NewGuid(),
        });
        await context.SaveChangesAsync();

        var service = CreateService(context, CreateUserManagerMock(context).Object);

        var ex = await Assert.ThrowsAsync<ConflictException>(
            () => service.DeleteUserAsync(user.Id));
        Assert.Contains("review", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    // ── Inspector with inspections blocks deletion ──────────────────────
    [Fact]
    public async Task DeleteUserAsync_InspectorWithInspections_ThrowsConflict()
    {
        using var context = CreateContext();
        var user = SeedUser(context);
        context.VehicleInspections.Add(new VehicleInspection
        {
            InspectionId = Guid.NewGuid(),
            VehicleId = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            InspectorId = user.Id,
        });
        await context.SaveChangesAsync();

        var service = CreateService(context, CreateUserManagerMock(context).Object);

        var ex = await Assert.ThrowsAsync<ConflictException>(
            () => service.DeleteUserAsync(user.Id));
        Assert.Contains("inspection", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    // ── Driver linked to bookings blocks deletion ───────────────────────
    [Fact]
    public async Task DeleteUserAsync_DriverAssignedToBookings_ThrowsConflict()
    {
        using var context = CreateContext();
        var user = SeedUser(context);

        var profileId = Guid.NewGuid();
        context.DriverProfiles.Add(new DriverProfile { Id = profileId, UserId = user.Id });
        context.Bookings.Add(new Booking
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(), // a different customer's booking
            VehicleId = Guid.NewGuid(),
            AssignedDriverProfileId = profileId,
            Status = BookingStatus.Completed,
        });
        await context.SaveChangesAsync();

        var service = CreateService(context, CreateUserManagerMock(context).Object);

        var ex = await Assert.ThrowsAsync<ConflictException>(
            () => service.DeleteUserAsync(user.Id));
        Assert.Contains("driver", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    // ── Non-critical child records are cleaned up on successful delete ──
    [Fact]
    public async Task DeleteUserAsync_RemovesNonCriticalChildRecords()
    {
        using var context = CreateContext();
        var user = SeedUser(context);

        context.UserAddresses.Add(new UserAddress { Id = Guid.NewGuid(), UserId = user.Id });
        context.Verifications.Add(new Verification { Id = Guid.NewGuid(), UserId = user.Id });
        context.Favorites.Add(new Favorite { Id = Guid.NewGuid(), UserId = user.Id, VehicleId = Guid.NewGuid() });
        context.Notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = user.Id, Title = "Hi", Message = "x" });
        context.RefreshTokens.Add(new RefreshToken { Id = Guid.NewGuid(), UserId = user.Id, Token = "t" });
        context.CompanyProfiles.Add(new CompanyProfile { Id = Guid.NewGuid(), UserId = user.Id, CompanyName = "Acme" });
        context.PaymentMethods.Add(new PaymentMethod { Id = Guid.NewGuid(), UserId = user.Id });
        context.Inspectors.Add(new Inspector { Id = Guid.NewGuid(), UserId = user.Id, EmployeeCode = "E1" });
        context.Drivers.Add(new Driver { Id = Guid.NewGuid(), UserId = user.Id });
        await context.SaveChangesAsync();

        var service = CreateService(context, CreateUserManagerMock(context).Object);

        var result = await service.DeleteUserAsync(user.Id);

        Assert.True(result.Success);
        Assert.False(await context.UserAddresses.AnyAsync(x => x.UserId == user.Id));
        Assert.False(await context.Verifications.AnyAsync(x => x.UserId == user.Id));
        Assert.False(await context.Favorites.AnyAsync(x => x.UserId == user.Id));
        Assert.False(await context.Notifications.AnyAsync(x => x.UserId == user.Id));
        Assert.False(await context.RefreshTokens.AnyAsync(x => x.UserId == user.Id));
        Assert.False(await context.CompanyProfiles.AnyAsync(x => x.UserId == user.Id));
        Assert.False(await context.PaymentMethods.AnyAsync(x => x.UserId == user.Id));
        Assert.False(await context.Inspectors.AnyAsync(x => x.UserId == user.Id));
        Assert.False(await context.Drivers.AnyAsync(x => x.UserId == user.Id));
        Assert.Contains("Addresses", result.DeletedRelatedRecords.Keys);
        Assert.Contains("CompanyProfiles", result.DeletedRelatedRecords.Keys);
    }

    // ── 5. Endpoint is Admin-only (authorization metadata) ──────────────
    [Fact]
    public void AdminUsersController_RequiresAdminRole()
    {
        var authorize = typeof(AdminUsersController)
            .GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(authorize);
        Assert.Equal("Admin", authorize!.Roles);
    }

    [Fact]
    public void DeleteUserEndpoint_UsesHttpDelete()
    {
        var method = typeof(AdminUsersController).GetMethod("DeleteUser");
        Assert.NotNull(method);

        var httpDelete = method!.GetCustomAttribute<Microsoft.AspNetCore.Mvc.HttpDeleteAttribute>();
        Assert.NotNull(httpDelete);
    }
}
