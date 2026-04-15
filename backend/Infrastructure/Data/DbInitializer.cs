using Backend.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Data;

public static class DbInitializer
{
    private const string CustomerEmail = "customer.demo@ares.local";
    private const string SupplierEmail = "supplier.demo@ares.local";
    private const string DemoPassword = "P@ssword123!";

    private static readonly Guid CustomerId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid SupplierId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid SupplierCompanyProfileId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private static readonly Guid CairoAddressId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid AlexandriaAddressId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    private static readonly Guid GizaAddressId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

    private static readonly Guid SedanVehicleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid SuvVehicleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid CompactVehicleId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    public static async Task InitializeAsync(IServiceProvider serviceProvider, bool seedDemoData = false)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = serviceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();

        try
        {
            await SeedRolesAsync(roleManager, logger);

            if (seedDemoData)
            {
                await SeedDemoDataAsync(context, userManager, logger);
            }

            logger.LogInformation("Database initialization completed successfully");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while initializing the database");
            throw;
        }
    }

    private static async Task SeedRolesAsync(
        RoleManager<IdentityRole<Guid>> roleManager,
        ILogger logger)
    {
        foreach (var role in new[] { "Customer", "Admin", "Supplier" })
        {
            if (await roleManager.RoleExistsAsync(role))
            {
                continue;
            }

            var result = await roleManager.CreateAsync(new IdentityRole<Guid>(role));
            if (result.Succeeded)
            {
                logger.LogInformation("Role {Role} created successfully", role);
                continue;
            }

            logger.LogError(
                "Failed to create role {Role}: {Errors}",
                role,
                string.Join(", ", result.Errors.Select(e => e.Description)));
        }
    }

    private static async Task SeedDemoDataAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        ILogger logger)
    {
        if (await context.Vehicles.AnyAsync())
        {
            logger.LogInformation("Demo data already exists. Skipping demo seeding.");
            return;
        }

        var supplier = await EnsureUserAsync(
            userManager,
            SupplierId,
            SupplierEmail,
            "Ares",
            "Supplier",
            "+20 100 000 0001",
            "uploads/seed/suppliers/supplier-logo.png",
            "Supplier");

        var customer = await EnsureUserAsync(
            userManager,
            CustomerId,
            CustomerEmail,
            "Demo",
            "Customer",
            "+20 100 000 0002",
            null,
            "Customer");

        await EnsureCompanyProfileAsync(context, supplier.Id);

        await EnsureLocationAsync(context, CairoAddressId, supplier.Id, "12 Tahrir Square", "Cairo", "Cairo Governorate", "Egypt", "11511", 30.0444m, 31.2357m, true);
        await EnsureLocationAsync(context, AlexandriaAddressId, supplier.Id, "Corniche Road", "Alexandria", "Alexandria Governorate", "Egypt", "21563", 31.2001m, 29.9187m, false);
        await EnsureLocationAsync(context, GizaAddressId, customer.Id, "Pyramids Road", "Giza", "Giza Governorate", "Egypt", "12511", 29.9773m, 31.1325m, false);

        var sedanVehicle = await EnsureVehicleAsync(
            context,
            SedanVehicleId,
            supplier.Id,
            "Toyota",
            "Camry",
            2024,
            "White",
            "SED-2024",
            "Automatic",
            "Hybrid",
            5,
            95m,
            "Cairo",
            "Comfortable sedan for business trips and city rides.",
            "Sedan",
            "Available",
            "uploads/seed/vehicles/mini.png");

        var suvVehicle = await EnsureVehicleAsync(
            context,
            SuvVehicleId,
            supplier.Id,
            "Nissan",
            "X-Trail",
            2024,
            "Black",
            "SUV-2024",
            "Automatic",
            "Petrol",
            7,
            140m,
            "Alexandria",
            "Spacious SUV ready for family travel and road trips.",
            "SUV",
            "Available",
            "uploads/seed/vehicles/midi.png");

        var compactVehicle = await EnsureVehicleAsync(
            context,
            CompactVehicleId,
            supplier.Id,
            "Hyundai",
            "i20",
            2023,
            "Blue",
            "CMP-2023",
            "Manual",
            "Petrol",
            4,
            70m,
            "Giza",
            "Compact and economical for short city commutes.",
            "Compact",
            "Available",
            "uploads/seed/vehicles/maxi.png");

        await EnsureVehicleImageAsync(context, Guid.Parse("44444444-4444-4444-4444-444444444441"), sedanVehicle.Id, "uploads/seed/vehicles/mini.png", "uploads/seed/vehicles/mini.png", true, 1);
        await EnsureVehicleImageAsync(context, Guid.Parse("44444444-4444-4444-4444-444444444442"), sedanVehicle.Id, "uploads/seed/vehicles/midi.png", "uploads/seed/vehicles/midi.png", false, 2);
        await EnsureVehicleImageAsync(context, Guid.Parse("55555555-5555-5555-5555-555555555551"), suvVehicle.Id, "uploads/seed/vehicles/midi.png", "uploads/seed/vehicles/midi.png", true, 1);
        await EnsureVehicleImageAsync(context, Guid.Parse("55555555-5555-5555-5555-555555555552"), suvVehicle.Id, "uploads/seed/vehicles/maxi.png", "uploads/seed/vehicles/maxi.png", false, 2);
        await EnsureVehicleImageAsync(context, Guid.Parse("66666666-6666-6666-6666-666666666661"), compactVehicle.Id, "uploads/seed/vehicles/maxi.png", "uploads/seed/vehicles/maxi.png", true, 1);
        await EnsureVehicleImageAsync(context, Guid.Parse("66666666-6666-6666-6666-666666666662"), compactVehicle.Id, "uploads/seed/vehicles/mini.png", "uploads/seed/vehicles/mini.png", false, 2);

        await EnsureVehicleFeatureAsync(context, Guid.Parse("77777777-7777-7777-7777-777777777771"), sedanVehicle.Id, "Comfort", "Air Conditioning", "Dual-zone automatic climate control");
        await EnsureVehicleFeatureAsync(context, Guid.Parse("77777777-7777-7777-7777-777777777772"), sedanVehicle.Id, "Safety", "Rear Camera", "Parking camera with sensors");
        await EnsureVehicleFeatureAsync(context, Guid.Parse("77777777-7777-7777-7777-777777777773"), suvVehicle.Id, "Comfort", "3rd Row", "Seats up to seven passengers");
        await EnsureVehicleFeatureAsync(context, Guid.Parse("77777777-7777-7777-7777-777777777774"), suvVehicle.Id, "Technology", "Bluetooth", "Hands-free calling and audio streaming");
        await EnsureVehicleFeatureAsync(context, Guid.Parse("77777777-7777-7777-7777-777777777775"), compactVehicle.Id, "Efficiency", "Fuel Saver", "Low consumption for city driving");

        var sedanBooking = await EnsureBookingAsync(
            context,
            Guid.Parse("88888888-8888-8888-8888-888888888881"),
            customer.Id,
            sedanVehicle.Id,
            DateTime.UtcNow.AddDays(-14),
            DateTime.UtcNow.AddDays(-11),
            "Cairo Downtown",
            "Cairo Airport",
            3,
            285m,
            "Completed");

        var suvBooking = await EnsureBookingAsync(
            context,
            Guid.Parse("88888888-8888-8888-8888-888888888882"),
            customer.Id,
            suvVehicle.Id,
            DateTime.UtcNow.AddDays(-10),
            DateTime.UtcNow.AddDays(-7),
            "Alexandria Corniche",
            "Alexandria Station",
            3,
            420m,
            "Completed");

        await EnsureReviewAsync(context, Guid.Parse("99999999-9999-9999-9999-999999999991"), sedanBooking.Id, customer.Id, sedanVehicle.Id, 5, "Smooth pickup, clean car, and easy drop-off.");
        await EnsureReviewAsync(context, Guid.Parse("99999999-9999-9999-9999-999999999992"), suvBooking.Id, customer.Id, suvVehicle.Id, 4, "Great for family travel and comfortable on the highway.");

        await context.SaveChangesAsync();

        logger.LogInformation("Demo seed data created successfully.");
    }

    private static async Task<ApplicationUser> EnsureUserAsync(
        UserManager<ApplicationUser> userManager,
        Guid userId,
        string email,
        string firstName,
        string lastName,
        string phoneNumber,
        string? profileImage,
        string role)
    {
        var existing = await userManager.FindByEmailAsync(email);
        if (existing != null)
        {
            if (!await userManager.IsInRoleAsync(existing, role))
            {
                var existingRoleResult = await userManager.AddToRoleAsync(existing, role);
                if (!existingRoleResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Unable to assign role {role} to existing demo user {email}: {string.Join(", ", existingRoleResult.Errors.Select(e => e.Description))}");
                }
            }

            return existing;
        }

        var user = new ApplicationUser
        {
            Id = userId,
            UserName = email,
            NormalizedUserName = email.ToUpperInvariant(),
            Email = email,
            NormalizedEmail = email.ToUpperInvariant(),
            EmailConfirmed = true,
            PhoneNumber = phoneNumber,
            PhoneNumberConfirmed = true,
            FirstName = firstName,
            LastName = lastName,
            ProfileImage = profileImage,
            Status = "Active"
        };

        var createResult = await userManager.CreateAsync(user, DemoPassword);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Unable to create demo user {email}: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
        }

        var roleResult = await userManager.AddToRoleAsync(user, role);
        if (!roleResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Unable to assign role {role} to demo user {email}: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
        }

        return user;
    }

    private static async Task EnsureCompanyProfileAsync(ApplicationDbContext context, Guid supplierUserId)
    {
        var existing = await context.CompanyProfiles.FirstOrDefaultAsync(cp => cp.UserId == supplierUserId);
        if (existing != null)
        {
            return;
        }

        await context.CompanyProfiles.AddAsync(new CompanyProfile
        {
            Id = SupplierCompanyProfileId,
            UserId = supplierUserId,
            CompanyName = "Ares Demo Rentals",
            CommercialRegistrationNumber = "CR-ARES-001",
            TaxId = "TAX-ARES-001"
        });
    }

    private static async Task EnsureLocationAsync(
        ApplicationDbContext context,
        Guid id,
        Guid userId,
        string addressLine,
        string city,
        string governorate,
        string country,
        string postalCode,
        decimal latitude,
        decimal longitude,
        bool isPrimary)
    {
        if (await context.UserAddresses.AnyAsync(x => x.Id == id))
        {
            return;
        }

        await context.UserAddresses.AddAsync(new UserAddress
        {
            Id = id,
            UserId = userId,
            AddressLine = addressLine,
            City = city,
            Governorate = governorate,
            Country = country,
            PostalCode = postalCode,
            Latitude = latitude,
            Longitude = longitude,
            IsPrimary = isPrimary
        });
    }

    private static async Task<Vehicle> EnsureVehicleAsync(
        ApplicationDbContext context,
        Guid id,
        Guid supplierUserId,
        string make,
        string model,
        int year,
        string color,
        string licensePlate,
        string transmission,
        string fuelType,
        int seats,
        decimal pricePerDay,
        string locationCity,
        string description,
        string category,
        string availabilityStatus,
        string primaryImage)
    {
        var existing = await context.Vehicles.Include(v => v.Images).FirstOrDefaultAsync(v => v.Id == id);
        if (existing != null)
        {
            return existing;
        }

        var vehicle = new Vehicle
        {
            Id = id,
            UserId = supplierUserId,
            Make = make,
            Model = model,
            Year = year,
            Color = color,
            LicensePlate = licensePlate,
            Transmission = transmission,
            FuelType = fuelType,
            Seats = seats,
            PricePerDay = pricePerDay,
            LocationCity = locationCity,
            Description = description,
            Status = category,
            AvailabilityStatus = availabilityStatus,
            IsActive = true,
            ApprovedAt = DateTime.UtcNow.AddDays(-30)
        };

        await context.Vehicles.AddAsync(vehicle);
        await context.VehicleImages.AddAsync(new VehicleImage
        {
            Id = Guid.NewGuid(),
            VehicleId = id,
            ImageUrl = primaryImage,
            ThumbnailUrl = primaryImage,
            IsPrimary = true,
            DisplayOrder = 1
        });

        return vehicle;
    }

    private static async Task EnsureVehicleImageAsync(
        ApplicationDbContext context,
        Guid id,
        Guid vehicleId,
        string imageUrl,
        string thumbnailUrl,
        bool isPrimary,
        int displayOrder)
    {
        if (await context.VehicleImages.AnyAsync(x => x.Id == id))
        {
            return;
        }

        await context.VehicleImages.AddAsync(new VehicleImage
        {
            Id = id,
            VehicleId = vehicleId,
            ImageUrl = imageUrl,
            ThumbnailUrl = thumbnailUrl,
            IsPrimary = isPrimary,
            DisplayOrder = displayOrder
        });
    }

    private static async Task EnsureVehicleFeatureAsync(
        ApplicationDbContext context,
        Guid id,
        Guid vehicleId,
        string category,
        string name,
        string? description)
    {
        if (await context.VehicleFeatures.AnyAsync(x => x.Id == id))
        {
            return;
        }

        await context.VehicleFeatures.AddAsync(new VehicleFeature
        {
            Id = id,
            VehicleId = vehicleId,
            FeatureCategory = category,
            FeatureName = name,
            FeatureDescription = description
        });
    }

    private static async Task<Booking> EnsureBookingAsync(
        ApplicationDbContext context,
        Guid id,
        Guid userId,
        Guid vehicleId,
        DateTime pickupDate,
        DateTime returnDate,
        string pickupLocation,
        string dropoffLocation,
        int totalDays,
        decimal totalPrice,
        string status)
    {
        var existing = await context.Bookings.FirstOrDefaultAsync(x => x.Id == id);
        if (existing != null)
        {
            return existing;
        }

        var booking = new Booking
        {
            Id = id,
            BookingNumber = $"BK-{id.ToString()[..8].ToUpperInvariant()}",
            UserId = userId,
            VehicleId = vehicleId,
            PickupDate = pickupDate,
            ReturnDate = returnDate,
            PickupLocation = pickupLocation,
            DropoffLocation = dropoffLocation,
            TotalDays = totalDays,
            RequiresDriver = false,
            TotalPrice = totalPrice,
            Status = status,
            CancelledAt = null,
            CancellationReason = null
        };

        await context.Bookings.AddAsync(booking);
        return booking;
    }

    private static async Task EnsureReviewAsync(
        ApplicationDbContext context,
        Guid id,
        Guid bookingId,
        Guid userId,
        Guid vehicleId,
        int rating,
        string comment)
    {
        if (await context.Reviews.AnyAsync(x => x.Id == id))
        {
            return;
        }

        await context.Reviews.AddAsync(new Review
        {
            Id = id,
            BookingId = bookingId,
            UserId = userId,
            VehicleId = vehicleId,
            Rating = rating,
            Comment = comment,
            AdminResponse = null
        });
    }
}
