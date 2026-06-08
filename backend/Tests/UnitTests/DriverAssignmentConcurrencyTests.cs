using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Backend.Tests.UnitTests;

/// <summary>
/// Verifies the concurrency safeguards on driver selection / assignment.
///
/// Production protection is layered:
///   1. A guard rejecting selection when the booking is already assigned.
///   2. An overlap check rejecting a driver already booked for the window.
///   3. A SQL Server <c>rowversion</c> on DriverProfile: when two requests
///      race past the guards, the losing commit raises
///      <see cref="DbUpdateConcurrencyException"/>, which the service maps to
///      a clean <see cref="ConflictException"/> (HTTP 409) instead of a 500
///      or a double assignment.
///
/// These tests simulate the deterministic outcomes of those paths.
/// </summary>
public class DriverAssignmentConcurrencyTests
{
    private readonly Mock<IDriverProfileRepository> _profiles = new();
    private readonly Mock<IBookingRepository> _bookings = new();
    private readonly Mock<IDriverNotificationService> _notifications = new();
    private readonly Mock<IApplicationDbContext> _context = new();
    private readonly Mock<IDriverReviewRepository> _driverReviews = new();
    private readonly Mock<IDriverPricingService> _driverPricing = new();
    private readonly DriverAssignmentService _service;

    private readonly Guid _customerId = Guid.NewGuid();
    private readonly Guid _bookingId = Guid.NewGuid();
    private readonly Guid _driverProfileId = Guid.NewGuid();

    public DriverAssignmentConcurrencyTests()
    {
        // Make every Task-returning side-effect a no-op so awaits don't NRE.
        _profiles.Setup(x => x.UpdateAsync(It.IsAny<DriverProfile>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _bookings.Setup(x => x.UpdateAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _notifications.Setup(x => x.NotifyDriverAssignedAsync(It.IsAny<Guid>(), It.IsAny<Booking>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _notifications.Setup(x => x.NotifyCustomerDriverCancelledAsync(It.IsAny<Guid>(), It.IsAny<Booking>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _driverPricing.Setup(x => x.GetDailyRateAsync(It.IsAny<CancellationToken>())).ReturnsAsync(100m);

        _service = new DriverAssignmentService(
            _profiles.Object, _bookings.Object,
            _notifications.Object, _context.Object,
            _driverReviews.Object, _driverPricing.Object);
    }

    private Booking ValidBooking(Guid? assigned = null) => new Booking
    {
        Id = _bookingId,
        UserId = _customerId,
        PickupDate = DateTime.UtcNow.AddDays(5),
        ReturnDate = DateTime.UtcNow.AddDays(7),
        AssignedDriverProfileId = assigned,
        RequiresDriver = true,
        Status = BookingStatus.Draft
    };

    private void SetupHappyPathLookups(Booking booking)
    {
        _bookings.Setup(x => x.GetByIdAsync(_bookingId, It.IsAny<CancellationToken>())).ReturnsAsync(booking);

        _profiles.Setup(x => x.GetByIdAsync(_driverProfileId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DriverProfile
            {
                Id = _driverProfileId,
                UserId = Guid.NewGuid(),
                Status = DriverProfileStatus.Verified,
                IsActive = true,
                Availability = DriverAvailability.Available
            });
    }

    // ── 1. Double-assignment guard ──────────────────────────────────────────
    [Fact]
    public async Task SelectDriver_WhenBookingAlreadyAssigned_ThrowsBadRequest()
    {
        var booking = ValidBooking(assigned: Guid.NewGuid());
        _bookings.Setup(x => x.GetByIdAsync(_bookingId, It.IsAny<CancellationToken>())).ReturnsAsync(booking);

        await Assert.ThrowsAsync<BadRequestException>(() =>
            _service.SelectDriverAsync(_bookingId, _driverProfileId, _customerId));

        _bookings.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // ── 2. Overlap prevention ───────────────────────────────────────────────
    [Fact]
    public async Task SelectDriver_WhenDriverHasOverlappingAssignment_ThrowsBadRequest()
    {
        var booking = ValidBooking();
        SetupHappyPathLookups(booking);
        _profiles.Setup(x => x.HasOverlappingAssignmentAsync(
                _driverProfileId, It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        await Assert.ThrowsAsync<BadRequestException>(() =>
            _service.SelectDriverAsync(_bookingId, _driverProfileId, _customerId));

        _bookings.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // ── 3. Concurrency: losing commit → Conflict, not double assignment ─────
    [Fact]
    public async Task SelectDriver_WhenRowVersionConflictOnCommit_ThrowsConflict()
    {
        var booking = ValidBooking();
        SetupHappyPathLookups(booking);
        _profiles.Setup(x => x.HasOverlappingAssignmentAsync(
                _driverProfileId, It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // The other concurrent selection committed first; this commit loses.
        _bookings.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new DbUpdateConcurrencyException());

        await Assert.ThrowsAsync<ConflictException>(() =>
            _service.SelectDriverAsync(_bookingId, _driverProfileId, _customerId));
    }

    // ── 4. Happy path commits exactly once ──────────────────────────────────
    [Fact]
    public async Task SelectDriver_HappyPath_CommitsAndReservesDriver()
    {
        var booking = ValidBooking();
        SetupHappyPathLookups(booking);
        _profiles.Setup(x => x.HasOverlappingAssignmentAsync(
                _driverProfileId, It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _bookings.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        await _service.SelectDriverAsync(_bookingId, _driverProfileId, _customerId);

        Assert.Equal(_driverProfileId, booking.AssignedDriverProfileId);
        Assert.Equal(BookingStatus.Draft, booking.Status);
        _bookings.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── 5. Driver-initiated cancel maps concurrency conflict → Conflict ─────
    [Fact]
    public async Task DriverCancelAssignment_WhenRowVersionConflict_ThrowsConflict()
    {
        var booking = ValidBooking(assigned: _driverProfileId);
        booking.Status = BookingStatus.Confirmed;
        _bookings.Setup(x => x.GetByIdAsync(_bookingId, It.IsAny<CancellationToken>())).ReturnsAsync(booking);
        _profiles.Setup(x => x.GetByIdAsync(_driverProfileId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DriverProfile { Id = _driverProfileId, UserId = Guid.NewGuid() });
        _bookings.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new DbUpdateConcurrencyException());

        await Assert.ThrowsAsync<ConflictException>(() =>
            _service.DriverCancelAssignmentAsync(_bookingId, _driverProfileId));
    }
}
