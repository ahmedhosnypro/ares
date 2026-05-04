using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PhoneNumbers;

namespace Backend.Infrastructure.Data;

public static class DbInitializer
{
    private const string AdminEmail = "admin@ares.local";
    private const string CustomerEmail = "customer.demo@ares.local";
    private const string SupplierEmail = "supplier.demo@ares.local";
    private const string SupplierTwoEmail = "supplier.two@ares.local";
    private const string SupplierThreeEmail = "supplier.three@ares.local";
    private const string SupplierFourEmail = "supplier.four@ares.local";
    private const string DemoPassword = "P@ssword123!";

    private static readonly Guid AdminId = Guid.Parse("99999999-aaaa-bbbb-cccc-999999999999");
    private static readonly Guid CustomerId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid SupplierId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid SupplierTwoId = Guid.Parse("abababab-abab-abab-abab-abababababab");
    private static readonly Guid SupplierThreeId = Guid.Parse("cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd");
    private static readonly Guid SupplierFourId = Guid.Parse("efefefef-efef-efef-efef-efefefefefef");
    private static readonly Guid SupplierCompanyProfileId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid SupplierTwoCompanyProfileId = Guid.Parse("dadadada-dada-dada-dada-dadadadadada");
    private static readonly Guid SupplierThreeCompanyProfileId = Guid.Parse("edededed-eded-eded-eded-edededededed");
    private static readonly Guid SupplierFourCompanyProfileId = Guid.Parse("fafafafa-fafa-fafa-fafa-fafafafafafa");

    private static readonly Guid CairoAddressId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid AlexandriaAddressId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    private static readonly Guid GizaAddressId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
    private static readonly Guid SharmAddressId = Guid.Parse("aaaabbbb-cccc-dddd-eeee-111111111111");
    private static readonly Guid HurghadaAddressId = Guid.Parse("aaaabbbb-cccc-dddd-eeee-222222222222");
    private static readonly Guid CustomerAddressId = Guid.Parse("aaaabbbb-cccc-dddd-eeee-333333333333");
    private static readonly Guid SedanVehicleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid SuvVehicleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid CompactVehicleId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    private static string FormatValidPhone(string phone)
    {
        var util = PhoneNumberUtil.GetInstance();
        var parsed = util.Parse(phone, null);
        if (!util.IsValidNumber(parsed))
            throw new InvalidOperationException($"Seed phone number '{phone}' is not a valid international phone number.");
        return util.Format(parsed, PhoneNumberFormat.E164);
    }

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
        var admin = await EnsureUserAsync(
            userManager,
            AdminId,
            AdminEmail,
            "System",
            "Admin",
            FormatValidPhone("+201000000000"),
            null,
            "Admin");

        var supplier = await EnsureUserAsync(
            userManager,
            SupplierId,
            SupplierEmail,
            "Ares",
            "Supplier",
            FormatValidPhone("+201000000001"),
            "uploads/seed/suppliers/supplier-logo.png",
            "Supplier");

        var customer = await EnsureUserAsync(
            userManager,
            CustomerId,
            CustomerEmail,
            "Demo",
            "Customer",
            FormatValidPhone("+201000000002"),
            null,
            "Customer",
            dateOfBirth: new DateTime(1990, 6, 15, 0, 0, 0, DateTimeKind.Utc),
            emergencyContactName: "Jane Customer",
            emergencyContactPhone: FormatValidPhone("+201000000099"),
            emergencyContactRelationship: "Spouse");

        var supplierTwo = await EnsureUserAsync(
            userManager,
            SupplierTwoId,
            SupplierTwoEmail,
            "Nile",
            "Mobility",
            FormatValidPhone("+201000000003"),
            "uploads/seed/suppliers/nile-mobility-logo.png",
            "Supplier");

        var supplierThree = await EnsureUserAsync(
            userManager,
            SupplierThreeId,
            SupplierThreeEmail,
            "Delta",
            "Drive",
            FormatValidPhone("+201000000004"),
            "uploads/seed/suppliers/delta-drive-logo.png",
            "Supplier");

        var supplierFour = await EnsureUserAsync(
            userManager,
            SupplierFourId,
            SupplierFourEmail,
            "Red Sea",
            "Rides",
            FormatValidPhone("+201000000005"),
            "uploads/seed/suppliers/red-sea-rides-logo.png",
            "Supplier");

        await EnsureCompanyProfileAsync(
            context,
            SupplierCompanyProfileId,
            supplier.Id,
            "Ares Demo Rentals",
            "CR-ARES-001",
            "TAX-ARES-001");
        await EnsureCompanyProfileAsync(
            context,
            SupplierTwoCompanyProfileId,
            supplierTwo.Id,
            "Nile Mobility Group",
            "CR-ARES-002",
            "TAX-ARES-002");
        await EnsureCompanyProfileAsync(
            context,
            SupplierThreeCompanyProfileId,
            supplierThree.Id,
            "Delta Drive Fleet",
            "CR-ARES-003",
            "TAX-ARES-003");
        await EnsureCompanyProfileAsync(
            context,
            SupplierFourCompanyProfileId,
            supplierFour.Id,
            "Red Sea Rides",
            "CR-ARES-004",
            "TAX-ARES-004");

        await EnsureLocationAsync(context, CairoAddressId, supplier.Id, "12 Tahrir Square", "Cairo", "Cairo Governorate", "Egypt", "11511", 30.0444m, 31.2357m, true, "uploads/seed/locations/cairo.jpg");
        await EnsureLocationAsync(context, AlexandriaAddressId, supplier.Id, "Corniche Road", "Alexandria", "Alexandria Governorate", "Egypt", "21563", 31.2001m, 29.9187m, false, "uploads/seed/locations/alexandria.jpg");
        await EnsureLocationAsync(context, GizaAddressId, customer.Id, "Pyramids Road", "Giza", "Giza Governorate", "Egypt", "12511", 29.9773m, 31.1325m, false, null);
        await EnsureLocationAsync(context, SharmAddressId, supplier.Id, "Naama Bay", "Sharm El Sheikh", "South Sinai Governorate", "Egypt", "46619", 27.9158m, 34.3300m, false, "uploads/seed/locations/sharm.jpg");
        await EnsureLocationAsync(context, HurghadaAddressId, supplier.Id, "Marina Boulevard", "Hurghada", "Red Sea Governorate", "Egypt", "84511", 27.2579m, 33.8116m, false, "uploads/seed/locations/hurghada.jpg");

        // Customer primary address
        await EnsureCustomerAddressAsync(context, CustomerAddressId, customer.Id);

        await context.SaveChangesAsync();
        logger.LogInformation("Locations and company profiles seeded successfully.");

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
        await EnsureVehicleImageAsync(context, Guid.Parse("44444444-4444-4444-4444-444444444443"), sedanVehicle.Id, "uploads/seed/vehicles/maxi.png", "uploads/seed/vehicles/maxi.png", false, 3);
        
        await EnsureVehicleImageAsync(context, Guid.Parse("55555555-5555-5555-5555-555555555551"), suvVehicle.Id, "uploads/seed/vehicles/midi.png", "uploads/seed/vehicles/midi.png", true, 1);
        await EnsureVehicleImageAsync(context, Guid.Parse("55555555-5555-5555-5555-555555555552"), suvVehicle.Id, "uploads/seed/vehicles/maxi.png", "uploads/seed/vehicles/maxi.png", false, 2);
        await EnsureVehicleImageAsync(context, Guid.Parse("55555555-5555-5555-5555-555555555553"), suvVehicle.Id, "uploads/seed/vehicles/mini.png", "uploads/seed/vehicles/mini.png", false, 3);
        
        await EnsureVehicleImageAsync(context, Guid.Parse("66666666-6666-6666-6666-666666666661"), compactVehicle.Id, "uploads/seed/vehicles/maxi.png", "uploads/seed/vehicles/maxi.png", true, 1);
        await EnsureVehicleImageAsync(context, Guid.Parse("66666666-6666-6666-6666-666666666662"), compactVehicle.Id, "uploads/seed/vehicles/mini.png", "uploads/seed/vehicles/mini.png", false, 2);
        await EnsureVehicleImageAsync(context, Guid.Parse("66666666-6666-6666-6666-666666666663"), compactVehicle.Id, "uploads/seed/vehicles/midi.png", "uploads/seed/vehicles/midi.png", false, 3);

        await EnsureVehicleFeatureAsync(context, Guid.Parse("77777777-7777-7777-7777-777777777771"), sedanVehicle.Id, "Comfort", "Air Conditioning", "Dual-zone automatic climate control");
        await EnsureVehicleFeatureAsync(context, Guid.Parse("77777777-7777-7777-7777-777777777772"), sedanVehicle.Id, "Safety", "Rear Camera", "Parking camera with sensors");
        await EnsureVehicleFeatureAsync(context, Guid.Parse("77777777-7777-7777-7777-777777777773"), suvVehicle.Id, "Comfort", "3rd Row", "Seats up to seven passengers");
        await EnsureVehicleFeatureAsync(context, Guid.Parse("77777777-7777-7777-7777-777777777774"), suvVehicle.Id, "Technology", "Bluetooth", "Hands-free calling and audio streaming");
        await EnsureVehicleFeatureAsync(context, Guid.Parse("77777777-7777-7777-7777-777777777775"), compactVehicle.Id, "Efficiency", "Fuel Saver", "Low consumption for city driving");

        await context.SaveChangesAsync();
        logger.LogInformation("Vehicles and features seeded successfully.");

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
        logger.LogInformation("Bookings and reviews seeded successfully.");

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
        string role,
        DateTime? dateOfBirth = null,
        string? emergencyContactName = null,
        string? emergencyContactPhone = null,
        string? emergencyContactRelationship = null)
    {
        var existing = await userManager.FindByEmailAsync(email);
        if (existing != null)
        {
            // Ensure role is assigned
            if (!await userManager.IsInRoleAsync(existing, role))
            {
                var existingRoleResult = await userManager.AddToRoleAsync(existing, role);
                if (!existingRoleResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Unable to assign role {role} to existing demo user {email}: {string.Join(", ", existingRoleResult.Errors.Select(e => e.Description))}");
                }
            }

            // Patch fields that may be missing or empty from earlier seeds
            bool needsUpdate = false;

            if (!string.Equals(existing.FirstName, firstName, StringComparison.Ordinal))
            {
                existing.FirstName = firstName;
                needsUpdate = true;
            }

            if (!string.Equals(existing.LastName, lastName, StringComparison.Ordinal))
            {
                existing.LastName = lastName;
                needsUpdate = true;
            }

            if (!string.Equals(existing.PhoneNumber, phoneNumber, StringComparison.Ordinal))
            {
                existing.PhoneNumber = phoneNumber;
                existing.PhoneNumberConfirmed = true;
                needsUpdate = true;
            }

            if (!string.Equals(existing.ProfileImage, profileImage, StringComparison.Ordinal))
            {
                existing.ProfileImage = profileImage;
                needsUpdate = true;
            }

            if (!string.Equals(existing.Status, "Active", StringComparison.Ordinal))
            {
                existing.Status = "Active";
                needsUpdate = true;
            }

            if (!existing.EmailConfirmed)
            {
                existing.EmailConfirmed = true;
                needsUpdate = true;
            }

            if (string.IsNullOrWhiteSpace(existing.LanguagePreference))
            {
                existing.LanguagePreference = "en";
                needsUpdate = true;
            }

            if (string.IsNullOrWhiteSpace(existing.CurrencyPreference))
            {
                existing.CurrencyPreference = "USD";
                needsUpdate = true;
            }

            if (dateOfBirth.HasValue && existing.DateOfBirth == null)
            {
                existing.DateOfBirth = dateOfBirth;
                needsUpdate = true;
            }

            if (emergencyContactName != null && string.IsNullOrWhiteSpace(existing.EmergencyContactName))
            {
                existing.EmergencyContactName = emergencyContactName;
                existing.EmergencyContactPhone = emergencyContactPhone;
                existing.EmergencyContactRelationship = emergencyContactRelationship;
                needsUpdate = true;
            }

            if (needsUpdate)
            {
                var updateResult = await userManager.UpdateAsync(existing);
                if (!updateResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Unable to update existing demo user {email}: {string.Join(", ", updateResult.Errors.Select(e => e.Description))}");
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
            Status = "Active",
            LanguagePreference = "en",
            CurrencyPreference = "USD",
            DateOfBirth = dateOfBirth,
            EmergencyContactName = emergencyContactName,
            EmergencyContactPhone = emergencyContactPhone,
            EmergencyContactRelationship = emergencyContactRelationship
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

    private static async Task EnsureCustomerAddressAsync(ApplicationDbContext context, Guid id, Guid customerId)
    {
        var existing = await context.UserAddresses.FirstOrDefaultAsync(x =>
            x.Id == id || (x.UserId == customerId && x.IsPrimary));

        if (existing != null)
        {
            existing.UserId = customerId;
            existing.AddressLine = "45 Nasr City Street";
            existing.City = "Cairo";
            existing.Governorate = "Cairo Governorate";
            existing.Country = "Egypt";
            existing.PostalCode = "11762";
            existing.IsPrimary = true;
            existing.Latitude = 30.062600m;
            existing.Longitude = 31.249700m;
            return;
        }

        await context.UserAddresses.AddAsync(new UserAddress
        {
            Id = id,
            UserId = customerId,
            AddressLine = "45 Nasr City Street",
            City = "Cairo",
            Governorate = "Cairo Governorate",
            Country = "Egypt",
            PostalCode = "11762",
            IsPrimary = true,
            Latitude = 30.062600m,
            Longitude = 31.249700m
        });
    }

    private static async Task EnsureCompanyProfileAsync(
        ApplicationDbContext context,
        Guid id,
        Guid supplierUserId,
        string companyName,
        string commercialRegistrationNumber,
        string taxId)
    {
        var existing = await context.CompanyProfiles.FirstOrDefaultAsync(cp =>
            cp.Id == id ||
            cp.UserId == supplierUserId ||
            (!string.IsNullOrWhiteSpace(cp.CommercialRegistrationNumber) &&
             cp.CommercialRegistrationNumber == commercialRegistrationNumber));

        if (existing != null)
        {
            existing.UserId = supplierUserId;
            existing.CompanyName = companyName;
            existing.CommercialRegistrationNumber = commercialRegistrationNumber;
            existing.TaxId = taxId;
            return;
        }

        await context.CompanyProfiles.AddAsync(new CompanyProfile
        {
            Id = id,
            UserId = supplierUserId,
            CompanyName = companyName,
            CommercialRegistrationNumber = commercialRegistrationNumber,
            TaxId = taxId
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
        bool isPrimary,
        string? imageUrl = null)
    {
        var existing = await context.UserAddresses.FirstOrDefaultAsync(x =>
            x.Id == id ||
            (x.UserId == userId &&
             x.AddressLine == addressLine &&
             x.City == city &&
             x.PostalCode == postalCode));

        if (existing != null)
        {
            existing.UserId = userId;
            existing.AddressLine = addressLine;
            existing.City = city;
            existing.Governorate = governorate;
            existing.Country = country;
            existing.PostalCode = postalCode;
            existing.Latitude = latitude;
            existing.Longitude = longitude;
            existing.IsPrimary = isPrimary;
            existing.ImageUrl = imageUrl;
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
            IsPrimary = isPrimary,
            ImageUrl = imageUrl
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
        string _primaryImage)
    {
        var existing = await context.Vehicles.Include(v => v.Images).FirstOrDefaultAsync(v =>
            v.Id == id || v.LicensePlate == licensePlate);
        if (existing != null)
        {
            existing.UserId = supplierUserId;
            existing.Make = make;
            existing.Model = model;
            existing.Year = year;
            existing.Color = color;
            existing.LicensePlate = licensePlate;
            existing.Transmission = transmission;
            existing.FuelType = fuelType;
            existing.Seats = seats;
            existing.PricePerDay = pricePerDay;
            existing.LocationCity = locationCity;
            existing.Description = description;
            existing.Status = category;
            existing.AvailabilityStatus = availabilityStatus;
            existing.IsActive = true;
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
        var existing = await context.VehicleImages.FirstOrDefaultAsync(x =>
            x.Id == id ||
            (x.VehicleId == vehicleId && x.DisplayOrder == displayOrder) ||
            (x.VehicleId == vehicleId && x.ImageUrl == imageUrl));

        if (existing != null)
        {
            existing.VehicleId = vehicleId;
            existing.ImageUrl = imageUrl;
            existing.ThumbnailUrl = thumbnailUrl;
            existing.IsPrimary = isPrimary;
            existing.DisplayOrder = displayOrder;
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
        var existing = await context.VehicleFeatures.FirstOrDefaultAsync(x =>
            x.Id == id ||
            (x.VehicleId == vehicleId && x.FeatureCategory == category && x.FeatureName == name));

        if (existing != null)
        {
            existing.VehicleId = vehicleId;
            existing.FeatureCategory = category;
            existing.FeatureName = name;
            existing.FeatureDescription = description;
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
        var bookingNumber = $"BK-{id.ToString().Split('-')[^1].ToUpperInvariant()}";
        var existing = await context.Bookings.FirstOrDefaultAsync(x =>
            x.Id == id ||
            x.BookingNumber == bookingNumber ||
            (x.UserId == userId &&
             x.VehicleId == vehicleId &&
             x.PickupDate == pickupDate &&
             x.ReturnDate == returnDate));

        if (existing != null)
        {
            existing.BookingNumber = bookingNumber;
            existing.UserId = userId;
            existing.VehicleId = vehicleId;
            existing.PickupDate = pickupDate;
            existing.ReturnDate = returnDate;
            existing.PickupLocation = pickupLocation;
            existing.DropoffLocation = dropoffLocation;
            existing.TotalDays = totalDays;
            existing.RequiresDriver = false;
            existing.TotalPrice = totalPrice;
            existing.Status = Enum.Parse<BookingStatus>(status);
            existing.CancelledAt = null;
            existing.CancellationReason = null;
            return existing;
        }

        var booking = new Booking
        {
            Id = id,
            BookingNumber = bookingNumber,
            UserId = userId,
            VehicleId = vehicleId,
            PickupDate = pickupDate,
            ReturnDate = returnDate,
            PickupLocation = pickupLocation,
            DropoffLocation = dropoffLocation,
            TotalDays = totalDays,
            RequiresDriver = false,
            TotalPrice = totalPrice,
            Status = Enum.Parse<BookingStatus>(status),
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
        var existing = await context.Reviews.FirstOrDefaultAsync(x => x.Id == id || x.BookingId == bookingId);
        if (existing != null)
        {
            existing.BookingId = bookingId;
            existing.UserId = userId;
            existing.VehicleId = vehicleId;
            existing.Rating = rating;
            existing.Comment = comment;
            existing.AdminResponse = null;
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
