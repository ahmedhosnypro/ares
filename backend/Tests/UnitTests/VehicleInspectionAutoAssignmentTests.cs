using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Exceptions;
using Backend.Application.Features.VehicleInspections.Commands.AssignInspector;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Backend.Domain.Events;
using Backend.Infrastructure.BackgroundServices;
using Backend.Infrastructure.Data;
using Backend.Infrastructure.Repositories;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Backend.Tests.UnitTests
{
    public class VehicleInspectionAutoAssignmentTests
    {
        private static ApplicationDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .EnableSensitiveDataLogging()
                .Options;
            return new ApplicationDbContext(options);
        }

        private static (Booking, Vehicle) SeedBooking(ApplicationDbContext context, BookingStatus status, DateTime? pickupDate = null)
        {
            var vehicle = new Vehicle
            {
                Id = Guid.NewGuid(),
                Make = "Toyota",
                Model = "Corolla",
                LicensePlate = "ABC-123",
                PricePerDay = 50m,
                AvailabilityStatus = "Available"
            };

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                VehicleId = vehicle.Id,
                UserId = Guid.NewGuid(),
                PickupDate = pickupDate ?? DateTime.UtcNow.AddHours(5),
                ReturnDate = (pickupDate ?? DateTime.UtcNow.AddHours(5)).AddDays(3),
                PickupLocation = "Cairo",
                DropoffLocation = "Cairo",
                Status = status,
                InspectionStatus = InspectionStatus.NotRequired
            };

            context.Vehicles.Add(vehicle);
            context.Bookings.Add(booking);
            context.SaveChanges();

            return (booking, vehicle);
        }

        private static Inspector SeedInspector(ApplicationDbContext context, string region, bool isAvailable = true, bool isActive = true)
        {
            var inspector = new Inspector
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                EmployeeCode = "INS-" + Guid.NewGuid().ToString().Substring(0, 5),
                Region = region,
                IsAvailable = isAvailable,
                IsActive = isActive
            };
            context.Inspectors.Add(inspector);
            context.SaveChanges();
            return inspector;
        }

        [Fact]
        public async Task Handle_SuccessfulAssignment_CreatesBothPickupAndReturnInspections()
        {
            using var context = CreateContext();
            var (booking, _) = SeedBooking(context, BookingStatus.Confirmed);
            var inspector = SeedInspector(context, "Cairo");

            var mediatorMock = new Mock<IMediator>();
            var notificationServiceMock = new Mock<INotificationService>();
            var loggerMock = new Mock<ILogger<AssignInspectorCommandHandler>>();

            var handler = new AssignInspectorCommandHandler(context, mediatorMock.Object, notificationServiceMock.Object, loggerMock.Object);
            var command = new AssignInspectorCommand(booking.Id);

            var result = await handler.Handle(command, CancellationToken.None);

            // Assertions
            Assert.NotEqual(Guid.Empty, result);

            // Check inspections
            var inspections = await context.VehicleInspections.Where(vi => vi.BookingId == booking.Id).ToListAsync();
            Assert.Equal(2, inspections.Count);

            var pickup = inspections.FirstOrDefault(vi => vi.InspectionType == "Pickup");
            var @return = inspections.FirstOrDefault(vi => vi.InspectionType == "Return");

            Assert.NotNull(pickup);
            Assert.NotNull(@return);
            Assert.Equal(inspector.UserId, pickup.InspectorId);
            Assert.Equal(inspector.UserId, @return.InspectorId);
            Assert.Equal(InspectionStatus.Pending, pickup.Status);
            Assert.Equal(InspectionStatus.Pending, @return.Status);

            // Check Booking fields
            var updatedBooking = await context.Bookings.FindAsync(booking.Id);
            Assert.NotNull(updatedBooking);
            Assert.Equal(inspector.UserId, updatedBooking.AssignedInspectorId);
            Assert.Equal(InspectionStatus.Pending, updatedBooking.InspectionStatus);

            // Check notification sent to inspector
            notificationServiceMock.Verify(
                n => n.CreateNotificationAsync(inspector.UserId, "New inspection assigned", It.IsAny<string>(), "InspectionAssigned", It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task Handle_CancelledOrCompletedBooking_ThrowsConflictException()
        {
            using var context = CreateContext();
            var (cancelledBooking, _) = SeedBooking(context, BookingStatus.Cancelled);
            var (completedBooking, _) = SeedBooking(context, BookingStatus.Completed);
            SeedInspector(context, "Cairo");

            var mediatorMock = new Mock<IMediator>();
            var notificationServiceMock = new Mock<INotificationService>();
            var loggerMock = new Mock<ILogger<AssignInspectorCommandHandler>>();

            var handler = new AssignInspectorCommandHandler(context, mediatorMock.Object, notificationServiceMock.Object, loggerMock.Object);

            await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(new AssignInspectorCommand(cancelledBooking.Id), CancellationToken.None));
            await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(new AssignInspectorCommand(completedBooking.Id), CancellationToken.None));
        }

        [Fact]
        public async Task Handle_NoInspectorAvailable_PublishesNoInspectorAvailableEvent()
        {
            using var context = CreateContext();
            var (booking, _) = SeedBooking(context, BookingStatus.Confirmed);

            var mediatorMock = new Mock<IMediator>();
            var notificationServiceMock = new Mock<INotificationService>();
            var loggerMock = new Mock<ILogger<AssignInspectorCommandHandler>>();

            var handler = new AssignInspectorCommandHandler(context, mediatorMock.Object, notificationServiceMock.Object, loggerMock.Object);
            var command = new AssignInspectorCommand(booking.Id);

            var result = await handler.Handle(command, CancellationToken.None);

            // Check that dummy inspections were still created but with null inspector
            var inspections = await context.VehicleInspections.Where(vi => vi.BookingId == booking.Id).ToListAsync();
            Assert.Equal(2, inspections.Count);
            Assert.All(inspections, vi => Assert.Null(vi.InspectorId));

            // Check Booking fields
            var updatedBooking = await context.Bookings.FindAsync(booking.Id);
            Assert.NotNull(updatedBooking);
            Assert.Null(updatedBooking.AssignedInspectorId);
            Assert.Equal(InspectionStatus.Pending, updatedBooking.InspectionStatus);

            // Check that event was published
            mediatorMock.Verify(
                m => m.Publish(It.Is<NoInspectorAvailableEvent>(e => e.BookingId == booking.Id), It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task Handle_LoadBalancing_SelectsInspectorWithLeastWorkload()
        {
            using var context = CreateContext();
            var (booking, _) = SeedBooking(context, BookingStatus.Confirmed);

            var inspector1 = SeedInspector(context, "Cairo"); // will have 1 pending inspection
            var inspector2 = SeedInspector(context, "Cairo"); // will have 0 pending inspections

            // Assign a pending inspection to inspector1
            context.VehicleInspections.Add(new VehicleInspection
            {
                InspectionId = Guid.NewGuid(),
                BookingId = Guid.NewGuid(),
                VehicleId = Guid.NewGuid(),
                InspectorId = inspector1.UserId,
                InspectionType = "Pickup",
                Status = InspectionStatus.Pending
            });
            context.SaveChanges();

            var mediatorMock = new Mock<IMediator>();
            var notificationServiceMock = new Mock<INotificationService>();
            var loggerMock = new Mock<ILogger<AssignInspectorCommandHandler>>();

            var handler = new AssignInspectorCommandHandler(context, mediatorMock.Object, notificationServiceMock.Object, loggerMock.Object);
            var command = new AssignInspectorCommand(booking.Id);

            await handler.Handle(command, CancellationToken.None);

            // Verify inspector2 was selected (least workload)
            var updatedBooking = await context.Bookings.FindAsync(booking.Id);
            Assert.NotNull(updatedBooking);
            Assert.Equal(inspector2.UserId, updatedBooking.AssignedInspectorId);
        }
    }
}
