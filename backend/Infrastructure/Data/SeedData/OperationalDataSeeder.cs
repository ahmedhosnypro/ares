using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Data.SeedData;

public static class OperationalDataSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        ILogger logger)
    {
        logger.LogInformation("Starting operational data seeding...");

        // 0. Cleanup existing operational data (Matches behavior of cancel_data.sql)
        logger.LogInformation("Cleaning up existing operational data...");
        
        // Identify targeted demo users
        var demoUserEmails = new List<string>();
        for (int i = 1; i <= 2; i++) demoUserEmails.Add($"newcustomer{i}@ares.local");
        for (int i = 1; i <= 4; i++) demoUserEmails.Add($"newdriver{i}@ares.local");
        for (int i = 1; i <= 4; i++) demoUserEmails.Add($"newinspector{i}@ares.local");

        var demoUsers = await context.Users
            .Where(u => u.Email != null && demoUserEmails.Contains(u.Email))
            .ToListAsync();
        var demoUserIds = demoUsers.Select(u => u.Id).ToList();

        if (demoUserIds.Any())
        {
            // Cancel bookings instead of deleting them to maintain referential integrity
            var bookingsToCancel = await context.Bookings
                .Where(b => demoUserIds.Contains(b.UserId) || 
                           (b.AssignedInspectorId != null && demoUserIds.Contains(b.AssignedInspectorId.Value)))
                .ToListAsync();
            
            foreach (var b in bookingsToCancel)
            {
                b.Status = BookingStatus.Cancelled;
                b.CancelledAt = DateTime.UtcNow;
                b.CancellationReason = "System refresh for operational seeding";
                b.AssignedInspectorId = null;
                b.AssignedDriverProfileId = null;
            }
            await context.SaveChangesAsync();

            // Delete dependencies for targeted users
            var driverProfilesToCleanup = await context.DriverProfiles
                .Where(dp => demoUserIds.Contains(dp.UserId))
                .ToListAsync();
            var driverProfileIds = driverProfilesToCleanup.Select(dp => dp.Id).ToList();

            if (driverProfileIds.Any())
            {
                var workAreas = await context.DriverWorkAreas.Where(wa => driverProfileIds.Contains(wa.DriverProfileId)).ToListAsync();
                context.DriverWorkAreas.RemoveRange(workAreas);
                
                var reviews = await context.DriverReviews.Where(r => driverProfileIds.Contains(r.DriverProfileId)).ToListAsync();
                context.DriverReviews.RemoveRange(reviews);
                
                context.DriverProfiles.RemoveRange(driverProfilesToCleanup);
            }

            var inspectorsToCleanup = await context.Inspectors
                .Where(i => demoUserIds.Contains(i.UserId))
                .ToListAsync();
            context.Inspectors.RemoveRange(inspectorsToCleanup);

            var addresses = await context.UserAddresses
                .Where(a => demoUserIds.Contains(a.UserId))
                .ToListAsync();
            context.UserAddresses.RemoveRange(addresses);

            var notifications = await context.Notifications
                .Where(n => demoUserIds.Contains(n.UserId))
                .ToListAsync();
            context.Notifications.RemoveRange(notifications);

            await context.SaveChangesAsync();

            // Delete users via UserManager
            foreach (var user in demoUsers)
            {
                await userManager.DeleteAsync(user);
            }
            
            logger.LogInformation("Operational cleanup completed.");
        }

        var random = new Random(42); // Deterministic seed

        // 1. Create 2 fully verified Customers
        var customers = new List<ApplicationUser>();
        for (int i = 1; i <= 2; i++)
        {
            var email = $"newcustomer{i}@ares.local";
            var customer = await EnsureUserAsync(userManager, email, $"CustFirst{i}", $"CustLast{i}", $"+2011000000{i}", "Customer", true);
            customers.Add(customer);

            // Add Address
            if (!await context.UserAddresses.AnyAsync(a => a.UserId == customer.Id))
            {
                await context.UserAddresses.AddAsync(new UserAddress
                {
                    Id = Guid.NewGuid(),
                    UserId = customer.Id,
                    AddressLine = $"Test Street {i}",
                    City = i == 1 ? "Cairo" : "Alexandria",
                    Governorate = i == 1 ? "Cairo Governorate" : "Alexandria Governorate",
                    Country = "Egypt",
                    PostalCode = "12345",
                    IsPrimary = true
                });
            }
        }

        // 2. Create 4 fully verified Drivers
        var drivers = new List<ApplicationUser>();
        var driverProfiles = new List<DriverProfile>();
        for (int i = 1; i <= 4; i++)
        {
            var email = $"newdriver{i}@ares.local";
            var driver = await EnsureUserAsync(userManager, email, $"DriverFirst{i}", $"DriverLast{i}", $"+2012000000{i}", "Driver", true);
            drivers.Add(driver);

            var profile = await context.DriverProfiles.FirstOrDefaultAsync(dp => dp.UserId == driver.Id);
            if (profile == null)
            {
                profile = new DriverProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = driver.Id,
                    LicenseNumber = $"DL-EGY-9990{i}",
                    LicenseExpiryDate = DateTime.UtcNow.AddYears(random.Next(1, 5)),
                    Status = DriverProfileStatus.Verified,
                    Availability = i % 2 == 0 ? DriverAvailability.Available : DriverAvailability.Unavailable,
                    IsActive = true
                };
                await context.DriverProfiles.AddAsync(profile);
            }
            driverProfiles.Add(profile);
        }

        // 3. Create 4 Inspectors
        var inspectors = new List<ApplicationUser>();
        var inspectorLocations = new[]
        {
            "12 Tahrir Square",
            "Corniche Road",
            "Naama Bay",
            "Marina Boulevard"
        };
        var firstNames = new[] { "Cairo", "Alex", "Sharm", "Hurghada" };

        for (int i = 0; i < 4; i++)
        {
            var index = i + 1;
            var email = $"newinspector{index}@ares.local";
            var locationName = inspectorLocations[i];
            var firstName = firstNames[i];
            
            var inspector = await EnsureUserAsync(userManager, email, $"{firstName}Insp", "Official", $"+2013000000{index}", "Inspector", true);
            inspectors.Add(inspector);

            var inspectorProfile = await context.Inspectors.FirstOrDefaultAsync(ip => ip.UserId == inspector.Id);
            if (inspectorProfile == null)
            {
                inspectorProfile = new Inspector
                {
                    Id = Guid.NewGuid(),
                    UserId = inspector.Id,
                    EmployeeCode = $"EMP-INSP-00{index}",
                    Region = locationName,
                    IsActive = true,
                    IsAvailable = true
                };
                await context.Inspectors.AddAsync(inspectorProfile);
            }
            else
            {
                inspectorProfile.Region = locationName;
                inspectorProfile.EmployeeCode = $"EMP-INSP-00{index}";
                inspectorProfile.IsActive = true;
                inspectorProfile.IsAvailable = true;
            }
        }

        await context.SaveChangesAsync();

        // 4. Use Existing Vehicles
        var vehicles = await context.Vehicles.Include(v => v.Category).Where(v => v.IsActive).Take(10).ToListAsync();
        if (!vehicles.Any())
        {
            logger.LogWarning("No vehicles found to assign bookings.");
            return;
        }

        // 5. Create Realistic Booking History (15 completed, 3 active, 2 cancelled)
        var totalBookings = 20;
        var statuses = Enumerable.Repeat(BookingStatus.Completed, 15)
            .Concat(Enumerable.Repeat(BookingStatus.Active, 3))
            .Concat(Enumerable.Repeat(BookingStatus.Cancelled, 2))
            .ToList();

        var paymentMethods = new[] { "CreditCard", "DebitCard", "VodafoneCash", "InstaPay" };
        var locations = new[] { "12 Tahrir Square", "Corniche Road", "Naama Bay", "Marina Boulevard" };

        var generatedBookings = new List<Booking>();
        var now = DateTime.UtcNow;

        for (int i = 0; i < totalBookings; i++)
        {
            var status = statuses[i];
            var customer = customers[random.Next(customers.Count)];
            var vehicle = vehicles[random.Next(vehicles.Count)];
            var driverProfile = i % 2 == 0 ? driverProfiles[random.Next(driverProfiles.Count)] : null;
            
            var locationIndex = random.Next(locations.Length);
            var bookingLocation = locations[locationIndex];
            var inspector = inspectors[locationIndex];

            // Ensure high revenue by multiplying price and days
            var totalDays = random.Next(3, 15);
            var pickupDate = now.AddDays(-random.Next(5, 90));
            if (status == BookingStatus.Active)
            {
                pickupDate = now.AddDays(-1);
            }
            var returnDate = pickupDate.AddDays(totalDays);

            decimal vehiclePrice = vehicle.PricePerDay ?? 500m;
            var pricePerDay = vehiclePrice < 1000m ? vehiclePrice * 5m : vehiclePrice;
            var totalPrice = pricePerDay * totalDays;
            if (driverProfile != null) totalPrice += 500m * totalDays;

            decimal commissionPercentage = 10.0m;
            if (vehicle.Category != null && vehicle.Category.IsActive)
            {
                commissionPercentage = vehicle.Category.CommissionPercentage;
            }
            else
            {
                var globalSetting = await context.SystemSettings
                    .FirstOrDefaultAsync(s => s.Key == "GlobalCommissionPercentage");
                if (globalSetting != null && decimal.TryParse(globalSetting.Value, out var globalCommission))
                {
                    commissionPercentage = globalCommission;
                }
            }
            var commissionAmount = Math.Round(totalPrice * (commissionPercentage / 100m), 2);
            var supplierAmount = totalPrice - commissionAmount;

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                BookingNumber = $"BK-OP-{i:D3}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpperInvariant()}",
                UserId = customer.Id,
                VehicleId = vehicle.Id,
                PickupDate = pickupDate,
                ReturnDate = returnDate,
                PickupLocation = bookingLocation,
                DropoffLocation = locations[random.Next(locations.Length)],
                TotalDays = totalDays,
                RequiresDriver = driverProfile != null,
                AssignedDriverProfileId = driverProfile?.Id,
                TotalPrice = totalPrice,
                Status = status,
                CancelledAt = status == BookingStatus.Cancelled ? now : null,
                CancellationReason = status == BookingStatus.Cancelled ? "Customer request" : null,
                AssignedInspectorId = inspector.Id,
                InspectionStatus = status == BookingStatus.Completed || status == BookingStatus.Active ? InspectionStatus.Approved : InspectionStatus.Pending,
                DriverAssignmentStatus = driverProfile != null ? DriverAssignmentStatus.Assigned : DriverAssignmentStatus.NotRequired,
                CommissionPercentage = commissionPercentage,
                CommissionAmount = commissionAmount,
                SupplierAmount = supplierAmount
            };

            await context.Bookings.AddAsync(booking);
            generatedBookings.Add(booking);

            // 6. Create Payments
            if (status == BookingStatus.Completed || status == BookingStatus.Active)
            {
                var payment = new BookingPayment
                {
                    PaymentId = Guid.NewGuid(),
                    BookingId = booking.Id,
                    Amount = totalPrice,
                    PaymentMethod = paymentMethods[random.Next(paymentMethods.Length)],
                    Status = "Captured",
                    TransactionId = Guid.NewGuid(),
                    ProcessedAt = pickupDate.AddHours(-1)
                };
                await context.Payments.AddAsync(payment);
            }

            // 7. Create Vehicle Inspections
            if (status == BookingStatus.Completed || status == BookingStatus.Active)
            {
                var preTrip = new VehicleInspection
                {
                    InspectionId = Guid.NewGuid(),
                    VehicleId = vehicle.Id,
                    BookingId = booking.Id,
                    InspectorId = inspector.Id,
                    InspectionType = "Pickup",
                    InspectionDate = pickupDate,
                    OdometerReading = 20000 + random.Next(1000, 5000),
                    FuelLevel = 1.0m,
                    GeneralCondition = "Excellent",
                    Notes = "All clean",
                    Status = InspectionStatus.Approved,
                    IsSubmitted = true,
                    SubmittedAt = pickupDate
                };
                await context.VehicleInspections.AddAsync(preTrip);
            }

            if (status == BookingStatus.Completed)
            {
                var postTrip = new VehicleInspection
                {
                    InspectionId = Guid.NewGuid(),
                    VehicleId = vehicle.Id,
                    BookingId = booking.Id,
                    InspectorId = inspector.Id,
                    InspectionType = "Return",
                    InspectionDate = returnDate,
                    OdometerReading = 20000 + random.Next(5100, 6000),
                    FuelLevel = (decimal)(random.Next(2, 10) / 10.0),
                    GeneralCondition = random.Next(10) > 8 ? "Minor scratches" : "Good",
                    Notes = "Customer returned safely",
                    Status = InspectionStatus.Approved,
                    IsSubmitted = true,
                    SubmittedAt = returnDate
                };
                await context.VehicleInspections.AddAsync(postTrip);

                // 8. Create Reviews
                var review = new Review
                {
                    Id = Guid.NewGuid(),
                    BookingId = booking.Id,
                    UserId = customer.Id,
                    VehicleId = vehicle.Id,
                    Rating = random.Next(4, 6),
                    Comment = "Great service and very clean car!",
                    CreatedAt = returnDate.AddDays(1)
                };
                await context.Reviews.AddAsync(review);

                if (driverProfile != null)
                {
                    var driverReview = new DriverReview
                    {
                        Id = Guid.NewGuid(),
                        BookingId = booking.Id,
                        DriverProfileId = driverProfile.Id,
                        CustomerId = customer.Id,
                        Rating = random.Next(4, 6),
                        Comment = "Excellent driver!"
                    };
                    await context.DriverReviews.AddAsync(driverReview);
                }
            }

            // 9. Create Notifications
            await context.Notifications.AddAsync(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = customer.Id,
                Title = "Booking Confirmed",
                Message = $"Your booking {booking.BookingNumber} has been confirmed.",
                Type = "Booking",
                IsRead = true,
                CreatedAt = pickupDate.AddDays(-2)
            });
            
            if (status == BookingStatus.Completed)
            {
                await context.Notifications.AddAsync(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = customer.Id,
                    Title = "Trip Completed",
                    Message = $"Your trip {booking.BookingNumber} is complete. Thanks!",
                    Type = "System",
                    IsRead = false,
                    CreatedAt = returnDate
                });
            }
        }

        await context.SaveChangesAsync();

        logger.LogInformation("Operational data seeding completed.");
    }

    private static async Task<ApplicationUser> EnsureUserAsync(
        UserManager<ApplicationUser> userManager,
        string email,
        string firstName,
        string lastName,
        string phone,
        string role,
        bool isVerified)
    {
        var existing = await userManager.FindByEmailAsync(email);
        if (existing != null) return existing;

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            PhoneNumber = phone,
            EmailConfirmed = true,
            PhoneNumberConfirmed = true,
            Status = "Active",
            NationalId = isVerified ? $"2900101{new Random().Next(1000000, 9999999)}" : null,
            NationalIdImage = isVerified ? "uploads/seed/id-front.jpg" : null,
            ProfileImage = "uploads/seed/profile-placeholder.jpg",
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };

        await userManager.CreateAsync(user, "P@ssword123!");
        await userManager.AddToRoleAsync(user, role);

        return user;
    }
}
