using Backend.Application.DTOs.Payment;
using Backend.Application.DTOs.Common;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Application.Settings;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Backend.Infrastructure.Data;
using Backend.Infrastructure.Repositories;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace Backend.Tests.PropertyTests;

public class PaymentPropertyTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IPaymentRepository _paymentRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IPaymentService _paymentService;

    public PaymentPropertyTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _paymentRepository = new PaymentRepository(_context);
        _bookingRepository = new BookingRepository(_context);
        _vehicleRepository = new VehicleRepository(_context);
        _paymentService = new PaymentService(
            _paymentRepository,
            _bookingRepository,
            _context,
            new Mock<IPaymobClient>().Object,
            new RefundCalculator(),
            Options.Create(new PaymobSettings()));

        _context.Database.EnsureCreated();
    }

    #region Property 26: Payment history pagination works correctly

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 26: Payment history pagination works correctly
    public bool PaymentHistoryPaginationWorksCorrectly(PositiveInt paymentCountGen, PositiveInt pageSizeGen)
    {
        var paymentCount = Math.Max(1, paymentCountGen.Get % 15 + 1); // 1-15 payments
        var pageSize = Math.Max(1, pageSizeGen.Get % 8 + 1); // 1-8 page size

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and payments
            var userId = CreateTestUser();
            var payments = CreateMultipleTestPayments(userId, paymentCount);

            // Test pagination for different pages
            var totalPages = (int)Math.Ceiling((double)paymentCount / pageSize);

            for (int page = 1; page <= Math.Min(totalPages, 3); page++) // Test first 3 pages max
            {
                var request = new PaymentHistoryRequest(
                    StartDate: null,
                    EndDate: null,
                    Status: null,
                    PaymentMethod: null,
                    Page: page,
                    PageSize: pageSize,
                    SortBy: "createdAt",
                    SortOrder: "desc"
                );

                var result = _paymentService.GetPaymentHistoryAsync(userId, request).Result;

                // Verify pagination properties
                if (result.Page != page ||
                    result.PageSize != pageSize ||
                    result.TotalCount != paymentCount ||
                    result.TotalPages != totalPages)
                {
                    return false;
                }

                // Verify data count for this page
                var expectedDataCount = Math.Min(pageSize, paymentCount - (page - 1) * pageSize);
                if (result.Data.Count != expectedDataCount)
                {
                    return false;
                }

                // Verify all returned payments belong to the user
                if (result.Data.Any(p => !payments.Any(original => original.TransactionId == p.TransactionId)))
                {
                    return false;
                }
            }

            return true;
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Property 27: Payment details returns complete information

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 27: Payment details returns complete information
    public bool PaymentDetailsReturnsCompleteInformation(PositiveInt amountGen)
    {
        var amount = Math.Max(10, amountGen.Get % 1000 + 10); // $10-$1009

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user, booking, and payment
            var (userId, bookingId) = CreateTestUserAndBooking(amount);
            var payment = CreateTestPayment(bookingId, amount);

            // Act - Get payment details by transaction ID
            var paymentDetails = _paymentRepository.GetByTransactionIdAsync(payment.TransactionId).Result;

            // Assert - Verify all required fields are present and correct
            var hasAllRequiredFields =
                paymentDetails != null &&
                paymentDetails.TransactionId == payment.TransactionId &&
                paymentDetails.BookingId == bookingId &&
                paymentDetails.Amount == amount &&
                !string.IsNullOrEmpty(paymentDetails.Currency) &&
                !string.IsNullOrEmpty(paymentDetails.PaymentMethod) &&
                !string.IsNullOrEmpty(paymentDetails.Status) &&
                paymentDetails.CreatedAt != default(DateTime);

            return hasAllRequiredFields;
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Property 28: Payment creation links to booking

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 28: Payment creation links to booking
    public bool PaymentCreationLinksToBooking(PositiveInt amountGen)
    {
        var amount = Math.Max(10, amountGen.Get % 500 + 10); // $10-$509

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and booking
            var (userId, bookingId) = CreateTestUserAndBooking(amount);

            // Create payment request
            var paymentRequest = new PaymentRequest(
                BookingId: bookingId,
                Amount: amount,
                PaymentMethodId: Guid.NewGuid(),
                PaymentMethod: "credit_card"
            );

            // Act - Process payment
            var paymentResponse = _paymentService.ProcessPaymentAsync(paymentRequest, userId).Result;

            // Get payment details by transaction ID
            var paymentDetails = _paymentRepository.GetByTransactionIdAsync(paymentResponse.TransactionId).Result;

            // Assert - Verify payment is correctly linked to booking
            var correctlyLinked =
                paymentResponse != null &&
                paymentResponse.TransactionId != Guid.Empty &&
                paymentDetails != null &&
                paymentDetails.BookingId == bookingId &&
                paymentDetails.TransactionId == paymentResponse.TransactionId;

            return correctlyLinked;
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Property 29: Successful payment updates booking status

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 29: Successful payment updates booking status
    public bool SuccessfulPaymentUpdatesBookingStatus(PositiveInt amountGen)
    {
        var amount = Math.Max(10, amountGen.Get % 300 + 10); // $10-$309

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and booking with "Pending" status
            var (userId, bookingId) = CreateTestUserAndBooking(amount, BookingStatus.PaymentPending);

            // Verify booking is initially in "Pending" status
            var initialBooking = _bookingRepository.GetByIdAsync(bookingId).Result;
            if (initialBooking?.Status != BookingStatus.PaymentPending)
            {
                // Debug: Initial booking status is not Pending
                return false;
            }

            // Store the initial status as a string to avoid EF change tracking issues
            var initialStatus = initialBooking.Status;

            // Create payment request
            var paymentRequest = new PaymentRequest(
                BookingId: bookingId,
                Amount: amount,
                PaymentMethodId: Guid.NewGuid(),
                PaymentMethod: "credit_card"
            );

            // Act - Process payment
            var paymentResponse = _paymentService.ProcessPaymentAsync(paymentRequest, userId).Result;

            // Verify payment response is successful
            if (paymentResponse == null || paymentResponse.Status != "Captured")
            {
                // Debug: Payment was not successful
                return false;
            }

            // Get updated booking - use a fresh query to avoid caching issues
            _context.ChangeTracker.Clear(); // Clear change tracker
            var updatedBooking = _bookingRepository.GetByIdAsync(bookingId).Result;

            // Debug: Check each condition separately
            if (updatedBooking == null)
            {
                // Debug: Updated booking is null
                return false;
            }

            if (updatedBooking.Status != BookingStatus.Confirmed)
            {
                // Debug: Booking status was not updated to "Paid", it's: {updatedBooking.Status}
                return false;
            }

            if (updatedBooking.Status == initialStatus)
            {
                // Debug: Booking status didn't change from initial status
                return false;
            }

            // All conditions met
            return true;
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Additional Properties for Edge Cases

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Payment with invalid amount fails
    public bool PaymentWithInvalidAmountFails()
    {
        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and booking
            var (userId, bookingId) = CreateTestUserAndBooking(100);

            // Create payment request with invalid amount (zero or negative)
            var paymentRequest = new PaymentRequest(
                BookingId: bookingId,
                Amount: 0, // Invalid amount
                PaymentMethodId: Guid.NewGuid(),
                PaymentMethod: "credit_card"
            );

            // Act & Assert - Should throw ValidationException
            try
            {
                var response = _paymentService.ProcessPaymentAsync(paymentRequest, userId).Result;
                return false; // Should have thrown exception
            }
            catch (AggregateException ae) when (ae.InnerException is ValidationException ve)
            {
                return ve.Errors.ContainsKey("Amount");
            }
            catch (ValidationException ve)
            {
                return ve.Errors.ContainsKey("Amount");
            }
            catch
            {
                return false; // Unexpected exception
            }
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Payment for non-existent booking fails
    public bool PaymentForNonExistentBookingFails(PositiveInt amountGen)
    {
        var amount = Math.Max(10, amountGen.Get % 200 + 10); // $10-$209

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user
            var userId = CreateTestUser();

            // Use non-existent booking ID
            var nonExistentBookingId = Guid.NewGuid();

            var paymentRequest = new PaymentRequest(
                BookingId: nonExistentBookingId,
                Amount: amount,
                PaymentMethodId: Guid.NewGuid(),
                PaymentMethod: "credit_card"
            );

            // Act & Assert - Should throw NotFoundException
            try
            {
                var response = _paymentService.ProcessPaymentAsync(paymentRequest, userId).Result;
                return false; // Should have thrown exception
            }
            catch (AggregateException ae) when (ae.InnerException is NotFoundException)
            {
                return true; // Expected exception
            }
            catch (NotFoundException)
            {
                return true; // Expected exception
            }
            catch
            {
                return false; // Unexpected exception
            }
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Payment for unauthorized booking fails
    public bool PaymentForUnauthorizedBookingFails(PositiveInt amountGen)
    {
        var amount = Math.Max(10, amountGen.Get % 200 + 10); // $10-$209

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create two different users
            var user1Id = CreateTestUser();
            var user2Id = CreateTestUser();

            // Create booking for user1
            var (_, bookingId) = CreateTestUserAndBooking(amount, BookingStatus.PaymentPending, user1Id);

            // Try to pay for user1's booking with user2
            var paymentRequest = new PaymentRequest(
                BookingId: bookingId,
                Amount: amount,
                PaymentMethodId: Guid.NewGuid(),
                PaymentMethod: "credit_card"
            );

            // Act & Assert - user2 should not be able to pay for user1's booking
            try
            {
                var response = _paymentService.ProcessPaymentAsync(paymentRequest, user2Id).Result;
                return false; // Should have thrown exception
            }
            catch (AggregateException ae) when (ae.InnerException is ForbiddenException)
            {
                return true; // Expected exception
            }
            catch (ForbiddenException)
            {
                return true; // Expected exception
            }
            catch
            {
                return false; // Unexpected exception
            }
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Payment history filters work correctly
    public bool PaymentHistoryFiltersWorkCorrectly(PositiveInt paymentCountGen)
    {
        var paymentCount = Math.Max(3, paymentCountGen.Get % 8 + 3); // 3-10 payments

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user
            var userId = CreateTestUser();

            // Create payments with different statuses and methods
            var payments = new List<BookingPayment>();
            var statuses = new[] { "Captured", "Failed", "Pending" };
            var methods = new[] { "credit_card", "debit_card", "paypal" };
            var baseDate = DateTime.UtcNow.AddDays(-10);

            for (int i = 0; i < paymentCount; i++)
            {
                var (_, bookingId) = CreateTestUserAndBooking(100 + i, BookingStatus.PaymentPending, userId);
                var payment = new BookingPayment
                {
                    PaymentId = Guid.NewGuid(),
                    TransactionId = Guid.NewGuid(),
                    BookingId = bookingId,
                    Amount = 100 + i,
                    Currency = "USD",
                    PaymentMethod = methods[i % methods.Length],
                    Status = statuses[i % statuses.Length],
                    CreatedAt = baseDate.AddDays(i)
                };
                _context.Payments.Add(payment);
                payments.Add(payment);
            }
            _context.SaveChanges();

            // Test status filter
            var capturedPayments = payments.Where(p => p.Status == "Captured").ToList();
            if (capturedPayments.Any())
            {
                var statusFilterRequest = new PaymentHistoryRequest(
                    Status: "Captured",
                    Page: 1,
                    PageSize: 20
                );

                var statusResult = _paymentService.GetPaymentHistoryAsync(userId, statusFilterRequest).Result;

                // Verify all returned payments have "Captured" status
                if (statusResult.Data.Any(p => p.Status != "Captured") ||
                    statusResult.TotalCount != capturedPayments.Count)
                {
                    return false;
                }
            }

            // Test payment method filter
            var creditCardPayments = payments.Where(p => p.PaymentMethod == "credit_card").ToList();
            if (creditCardPayments.Any())
            {
                var methodFilterRequest = new PaymentHistoryRequest(
                    PaymentMethod: "credit_card",
                    Page: 1,
                    PageSize: 20
                );

                var methodResult = _paymentService.GetPaymentHistoryAsync(userId, methodFilterRequest).Result;

                // Verify all returned payments use credit card
                if (methodResult.Data.Any(p => p.PaymentMethod != "credit_card") ||
                    methodResult.TotalCount != creditCardPayments.Count)
                {
                    return false;
                }
            }

            // Test date range filter
            var midDate = baseDate.AddDays(paymentCount / 2);
            var dateRangePayments = payments.Where(p =>
                p.CreatedAt >= baseDate && p.CreatedAt <= midDate).ToList();

            if (dateRangePayments.Any())
            {
                var dateFilterRequest = new PaymentHistoryRequest(
                    StartDate: baseDate,
                    EndDate: midDate,
                    Page: 1,
                    PageSize: 20
                );

                var dateResult = _paymentService.GetPaymentHistoryAsync(userId, dateFilterRequest).Result;

                // Verify all returned payments are within the date range
                if (dateResult.Data.Any(p => p.CreatedAt < baseDate || p.CreatedAt > midDate))
                {
                    return false;
                }
            }

            return true;
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Empty payment history returns correct pagination
    public bool EmptyPaymentHistoryReturnsCorrectPagination(PositiveInt pageSizeGen)
    {
        var pageSize = Math.Max(1, pageSizeGen.Get % 20 + 1); // 1-20 page size

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user with no payments
            var userId = CreateTestUser();

            var request = new PaymentHistoryRequest(
                Page: 1,
                PageSize: pageSize
            );

            // Act - Get payment history for user with no payments
            var result = _paymentService.GetPaymentHistoryAsync(userId, request).Result;

            // Assert - Should return empty list with correct pagination info
            return result.Data.Count == 0 &&
                   result.Page == 1 &&
                   result.PageSize == pageSize &&
                   result.TotalCount == 0 &&
                   result.TotalPages == 0;
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Helper Methods

    private void ClearTestData()
    {
        _context.Payments.RemoveRange(_context.Payments);
        _context.Bookings.RemoveRange(_context.Bookings);
        _context.VehicleImages.RemoveRange(_context.VehicleImages);
        _context.Vehicles.RemoveRange(_context.Vehicles);
        _context.Users.RemoveRange(_context.Users);
        _context.SaveChanges();
    }

    private Guid CreateTestUser()
    {
        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = $"test{userId}@example.com",
            FirstName = "Test",
            LastName = "User",
            UserName = $"test{userId}@example.com",
            EmailConfirmed = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();
        return userId;
    }

    private (Guid userId, Guid bookingId) CreateTestUserAndBooking(decimal amount, BookingStatus status = BookingStatus.Confirmed, Guid? existingUserId = null)
    {
        var userId = existingUserId ?? CreateTestUser();

        // Create vehicle for the booking
        var vehicleId = Guid.NewGuid();
        var vehicle = new Vehicle
        {
            Id = vehicleId,
            UserId = userId,
            Make = "Toyota",
            Model = "Camry",
            Year = 2023,
            Color = "Blue",
            LicensePlate = $"TEST{vehicleId.ToString()[..6].ToUpper()}",
            Transmission = "Automatic",
            FuelType = "Gasoline",
            Seats = 5,
            PricePerDay = amount,
            LocationCity = "Test City",
            Description = "Test vehicle for payment",
            Status = "Available",
            AvailabilityStatus = "Available",
            IsActive = true,
            ApprovedAt = DateTime.UtcNow
        };
        _context.Vehicles.Add(vehicle);

        // Add a primary vehicle image
        var image = new VehicleImage
        {
            Id = Guid.NewGuid(),
            VehicleId = vehicleId,
            ImageUrl = "https://example.com/test-vehicle.jpg",
            ThumbnailUrl = "https://example.com/test-vehicle-thumb.jpg",
            IsPrimary = true
        };
        _context.VehicleImages.Add(image);

        // Create booking
        var bookingId = Guid.NewGuid();
        var booking = new Booking
        {
            Id = bookingId,
            BookingNumber = $"BK-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..5].ToUpper()}",
            UserId = userId,
            VehicleId = vehicleId,
            PickupDate = DateTime.UtcNow.AddDays(1),
            ReturnDate = DateTime.UtcNow.AddDays(3),
            TotalDays = 2,
            TotalPrice = amount,
            Status = status,
            RequiresDriver = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Bookings.Add(booking);
        _context.SaveChanges();

        return (userId, bookingId);
    }

    private BookingPayment CreateTestPayment(Guid bookingId, decimal amount, string status = "Captured")
    {
        var payment = new BookingPayment
        {
            PaymentId = Guid.NewGuid(),
            TransactionId = Guid.NewGuid(),
            BookingId = bookingId,
            Amount = amount,
            Currency = "USD",
            PaymentMethod = "credit_card",
            Status = status,
            AuthorizationCode = status == "Captured" ? $"AUTH-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}" : null,
            ProcessedAt = status == "Captured" ? DateTime.UtcNow : null,
            CreatedAt = DateTime.UtcNow
        };
        _context.Payments.Add(payment);
        _context.SaveChanges();
        return payment;
    }

    private List<BookingPayment> CreateMultipleTestPayments(Guid userId, int count)
    {
        var payments = new List<BookingPayment>();
        var statuses = new[] { "Captured", "Failed", "Pending" };
        var methods = new[] { "credit_card", "debit_card", "paypal" };
        var baseDate = DateTime.UtcNow.AddDays(-count);

        for (int i = 0; i < count; i++)
        {
            // Create separate booking for each payment
            var (_, bookingId) = CreateTestUserAndBooking(100 + i, BookingStatus.Confirmed, userId);

            var status = statuses[i % statuses.Length];
            var method = methods[i % methods.Length];

            var payment = new BookingPayment
            {
                PaymentId = Guid.NewGuid(),
                TransactionId = Guid.NewGuid(),
                BookingId = bookingId,
                Amount = 100 + i,
                Currency = "USD",
                PaymentMethod = method,
                Status = status,
                AuthorizationCode = status == "Captured" ? $"AUTH-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}" : null,
                ProcessedAt = status == "Captured" ? DateTime.UtcNow : null,
                CreatedAt = baseDate.AddDays(i)
            };
            _context.Payments.Add(payment);
            payments.Add(payment);
        }

        _context.SaveChanges();
        return payments;
    }

    #endregion

    public void Dispose()
    {
        _context.Dispose();
    }
}