using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Backend.Api.Controllers;
using Backend.Application.DTOs.Booking;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Backend.Tests.UnitTests
{
    public class BookingsControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<IBookingService> _bookingServiceMock;
        private readonly Mock<IVehicleRepository> _vehicleRepositoryMock;
        private readonly Mock<ILocationRepository> _locationRepositoryMock;
        private readonly Mock<ILogger<BookingsController>> _loggerMock;
        private readonly Mock<ILogger<AdminBookingsController>> _adminLoggerMock;
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly BookingsController _controller;
        private readonly AdminBookingsController _adminController;

        public BookingsControllerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _context.Database.EnsureCreated();

            _bookingServiceMock = new Mock<IBookingService>();
            _vehicleRepositoryMock = new Mock<IVehicleRepository>();
            _locationRepositoryMock = new Mock<ILocationRepository>();
            _loggerMock = new Mock<ILogger<BookingsController>>();
            _adminLoggerMock = new Mock<ILogger<AdminBookingsController>>();
            _userManagerMock = MockUserManager();

            _controller = new BookingsController(
                _bookingServiceMock.Object,
                _vehicleRepositoryMock.Object,
                _locationRepositoryMock.Object,
                _loggerMock.Object,
                _userManagerMock.Object);

            _adminController = new AdminBookingsController(
                _bookingServiceMock.Object,
                _context,
                _adminLoggerMock.Object,
                _userManagerMock.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, "Admin")
            }, "mock"));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            _adminController.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        private static Mock<UserManager<ApplicationUser>> MockUserManager()
        {
            var store = new Mock<IUserStore<ApplicationUser>>();
            var options = new Mock<Microsoft.Extensions.Options.IOptions<IdentityOptions>>();
            var idOptions = new IdentityOptions();
            options.Setup(o => o.Value).Returns(idOptions);
            var hasher = new Mock<IPasswordHasher<ApplicationUser>>();
            var validator = new Mock<IUserValidator<ApplicationUser>>();
            var validators = new List<IUserValidator<ApplicationUser>> { validator.Object };
            var pwdValidator = new Mock<IPasswordValidator<ApplicationUser>>();
            var pwdValidators = new List<IPasswordValidator<ApplicationUser>> { pwdValidator.Object };

            return new Mock<UserManager<ApplicationUser>>(
                store.Object,
                options.Object,
                hasher.Object,
                validators,
                pwdValidators,
                null!,
                null!,
                null!,
                null!);
        }

        private static object? GetPropertyValue(object? obj, string propertyName)
        {
            if (obj == null) return null;
            var prop = obj.GetType().GetProperty(propertyName);
            return prop?.GetValue(obj, null);
        }

        [Fact]
        public async Task CreateBooking_WithNonCustomerUser_ReturnsBadRequest()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var nonCustomerUser = new ApplicationUser
            {
                Id = customerId,
                FirstName = "John",
                LastName = "Doe",
                Email = "john@example.com",
                Status = "Active"
            };

            _userManagerMock.Setup(x => x.FindByIdAsync(customerId.ToString()))
                .ReturnsAsync(nonCustomerUser);
            _userManagerMock.Setup(x => x.IsInRoleAsync(nonCustomerUser, "Customer"))
                .ReturnsAsync(false);

            var request = new CreateBookingRequest(
                Guid.NewGuid(),
                Guid.Empty,
                Guid.Empty,
                DateTime.UtcNow.AddDays(1),
                DateTime.UtcNow.AddDays(3),
                null,
                false,
                "Airport",
                "Hotel",
                customerId);

            // Act
            var result = await _controller.CreateBooking(request, CancellationToken.None);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var errorObj = badRequestResult.Value;
            
            var successValue = GetPropertyValue(errorObj, "success");
            var messageValue = GetPropertyValue(errorObj, "message");
            
            Assert.NotNull(successValue);
            Assert.NotNull(messageValue);
            Assert.False((bool)successValue);
            Assert.Equal("Selected user is not a customer.", (string)messageValue);
        }

        [Fact]
        public async Task CreateBooking_WithInactiveCustomer_ReturnsBadRequest()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var customerUser = new ApplicationUser
            {
                Id = customerId,
                FirstName = "John",
                LastName = "Doe",
                Email = "john@example.com",
                Status = "Inactive"
            };

            _userManagerMock.Setup(x => x.FindByIdAsync(customerId.ToString()))
                .ReturnsAsync(customerUser);
            _userManagerMock.Setup(x => x.IsInRoleAsync(customerUser, "Customer"))
                .ReturnsAsync(true);

            var request = new CreateBookingRequest(
                Guid.NewGuid(),
                Guid.Empty,
                Guid.Empty,
                DateTime.UtcNow.AddDays(1),
                DateTime.UtcNow.AddDays(3),
                null,
                false,
                "Airport",
                "Hotel",
                customerId);

            // Act
            var result = await _controller.CreateBooking(request, CancellationToken.None);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var errorObj = badRequestResult.Value;
            
            var successValue = GetPropertyValue(errorObj, "success");
            var messageValue = GetPropertyValue(errorObj, "message");
            
            Assert.NotNull(successValue);
            Assert.NotNull(messageValue);
            Assert.False((bool)successValue);
            Assert.Equal("Selected user is not a customer.", (string)messageValue);
        }

        [Fact]
        public async Task CreateBooking_WithCustomerWhoHasOtherRoles_ReturnsBadRequest()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var customerUser = new ApplicationUser
            {
                Id = customerId,
                FirstName = "John",
                LastName = "Doe",
                Email = "john@example.com",
                Status = "Active"
            };

            _userManagerMock.Setup(x => x.FindByIdAsync(customerId.ToString()))
                .ReturnsAsync(customerUser);
            _userManagerMock.Setup(x => x.IsInRoleAsync(customerUser, "Customer"))
                .ReturnsAsync(true);
            _userManagerMock.Setup(x => x.GetRolesAsync(customerUser))
                .ReturnsAsync(new List<string> { "Customer", "Admin" });

            var request = new CreateBookingRequest(
                Guid.NewGuid(),
                Guid.Empty,
                Guid.Empty,
                DateTime.UtcNow.AddDays(1),
                DateTime.UtcNow.AddDays(3),
                null,
                false,
                "Airport",
                "Hotel",
                customerId);

            // Act
            var result = await _controller.CreateBooking(request, CancellationToken.None);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var errorObj = badRequestResult.Value;
            
            var successValue = GetPropertyValue(errorObj, "success");
            var messageValue = GetPropertyValue(errorObj, "message");
            
            Assert.NotNull(successValue);
            Assert.NotNull(messageValue);
            Assert.False((bool)successValue);
            Assert.Equal("Selected user is not a customer.", (string)messageValue);
        }

        [Fact]
        public async Task SearchCustomers_ReturnsOnlyActiveCustomers()
        {
            // Arrange
            var activeCustomer = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                FirstName = "Active",
                LastName = "Customer",
                Email = "active@customer.com",
                Status = "Active"
            };

            var inactiveCustomer = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                FirstName = "Inactive",
                LastName = "Customer",
                Email = "inactive@customer.com",
                Status = "Inactive"
            };

            var activeAdmin = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                FirstName = "Active",
                LastName = "Admin",
                Email = "active@admin.com",
                Status = "Active"
            };

            _context.Users.AddRange(activeCustomer, inactiveCustomer, activeAdmin);
            await _context.SaveChangesAsync();

            _userManagerMock.Setup(x => x.GetUsersInRoleAsync("Customer"))
                .ReturnsAsync(new List<ApplicationUser> { activeCustomer, inactiveCustomer });

            // Act
            var result = await _adminController.SearchCustomers(search: null, limit: 20, cancellationToken: CancellationToken.None);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var items = Assert.IsAssignableFrom<IEnumerable<CustomerPickerItemDto>>(okResult.Value).ToList();

            Assert.Single(items);
            Assert.Equal(activeCustomer.Id, items[0].Id);
            Assert.Equal("Active Customer", items[0].FullName);
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
