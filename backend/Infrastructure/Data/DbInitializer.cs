using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PhoneNumbers;
using System.IO;

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

    private static string FormatValidPhone(string phone)
    {
        var util = PhoneNumberUtil.GetInstance();
        var parsed = util.Parse(phone, null);
        if (!util.IsValidNumber(parsed))
            throw new InvalidOperationException($"Seed phone number '{phone}' is not a valid international phone number.");
        return util.Format(parsed, PhoneNumberFormat.E164);
    }

    public static async Task InitializeAsync(IServiceProvider serviceProvider, bool seedDemoData = false, bool force = false)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = serviceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();
        var env = serviceProvider.GetRequiredService<IWebHostEnvironment>();

        try
        {
            await SeedRolesAsync(roleManager, logger);

            if (seedDemoData)
            {
                // Check if already seeded to prevent multiple automatic runs
                var isSeeded = await context.SystemSettings
                    .AnyAsync(s => s.Key == "IsSeeded" && s.Value == "true");

                if (isSeeded && !force)
                {
                    logger.LogInformation("Database already seeded. Skipping automatic demo data seeding.");
                    return;
                }

                await SyncSeederAssetsAsync(env, logger);
                await SeedDemoDataAsync(context, userManager, logger);

                // Mark as seeded
                if (!isSeeded)
                {
                    var setting = await context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "IsSeeded");
                    if (setting == null)
                    {
                        await context.SystemSettings.AddAsync(new SystemSetting { Id = Guid.NewGuid(), Key = "IsSeeded", Value = "true" });
                    }
                    else
                    {
                        setting.Value = "true";
                    }
                    await context.SaveChangesAsync();
                }
            }
            
            await EnsureCategoriesAndCategorizeVehiclesAsync(context, logger);

            // Fix any existing bookings with null or zero commission
            var bookingsToFix = await context.Bookings
                .Where(b => b.CommissionPercentage == null || b.CommissionPercentage == 0m)
                .ToListAsync();

            if (bookingsToFix.Any())
            {
                logger.LogInformation("Fixing {Count} bookings with null/zero commission...", bookingsToFix.Count);
                foreach (var booking in bookingsToFix)
                {
                    var vehicle = await context.Vehicles
                        .Include(v => v.Category)
                        .FirstOrDefaultAsync(v => v.Id == booking.VehicleId);
                    decimal commissionPercentage = 10.0m;
                    if (vehicle?.Category != null && vehicle.Category.IsActive)
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
                    var commissionAmount = Math.Round((booking.TotalPrice ?? 0m) * (commissionPercentage / 100m), 2);
                    var supplierAmount = (booking.TotalPrice ?? 0m) - commissionAmount;

                    booking.CommissionPercentage = commissionPercentage;
                    booking.CommissionAmount = commissionAmount;
                    booking.SupplierAmount = supplierAmount;
                }
                await context.SaveChangesAsync();
                logger.LogInformation("Successfully updated existing bookings' commission details.");
            }

            logger.LogInformation("Database initialization completed successfully");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while initializing the database");
            throw;
        }
    }

    private static async Task SyncSeederAssetsAsync(IWebHostEnvironment env, ILogger logger)
    {
        try
        {
            var contentRoot = env.ContentRootPath;
        var webRoot = env.WebRootPath;

        if (string.IsNullOrEmpty(webRoot))
        {
            webRoot = Path.Combine(contentRoot, "wwwroot");
        }

        var sourcePath = Path.GetFullPath(Path.Combine(contentRoot, "..", "Infrastructure", "Data", "SeedData", "Assets", "seed"));
        var targetRoot = Path.Combine(webRoot, "uploads", "seed");

        if (!Directory.Exists(sourcePath))
        {
            logger.LogWarning("Seeder assets source directory not found: {SourcePath}", sourcePath);
            return;
        }

        logger.LogInformation("Syncing seeder assets from {Source} to {Target}", sourcePath, targetRoot);

        if (!Directory.Exists(targetRoot))
        {
            Directory.CreateDirectory(targetRoot);
        }

        foreach (string dirPath in Directory.GetDirectories(sourcePath, "*", SearchOption.AllDirectories))
        {
            Directory.CreateDirectory(Path.Combine(targetRoot, Path.GetRelativePath(sourcePath, dirPath)));
        }

        foreach (string newPath in Directory.GetFiles(sourcePath, "*.*", SearchOption.AllDirectories))
        {
            var targetPath = Path.Combine(targetRoot, Path.GetRelativePath(sourcePath, newPath));
            if (!File.Exists(targetPath))
            {
                File.Copy(newPath, targetPath, true);
            }
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to sync seeder assets");
    }
}

    private static async Task SeedRolesAsync(
        RoleManager<IdentityRole<Guid>> roleManager,
        ILogger logger)
    {
        // "Driver" added with Phase 1 of the Driver Module. Append-only so
        // historical role IDs are preserved.
        foreach (var role in new[] { "Customer", "Admin", "Supplier", "Inspector", "Driver" })
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
        if (!await context.SystemSettings.AnyAsync(s => s.Key == "IsDemoView"))
        {
            await context.SystemSettings.AddAsync(new SystemSetting { Id = Guid.NewGuid(), Key = "IsDemoView", Value = "true" });
            await context.SaveChangesAsync();
        }
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

        // -- Extended vehicle catalog (Egypt market, 2015-2024) ------------
        await VehicleSeeder.SeedAsync(context, logger);

        await TermsSeeder.SeedAsync(context);
        await AboutSeeder.SeedAsync(context);
        await SeedActivityDataAsync(context, userManager, logger);
        await SeedDriverModuleAsync(context, userManager, logger);

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

        var vehicle = await context.Vehicles
            .Include(v => v.Category)
            .FirstOrDefaultAsync(v => v.Id == vehicleId);
        decimal commissionPercentage = 10.0m;
        if (vehicle?.Category != null && vehicle.Category.IsActive)
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
            if (existing.CommissionPercentage == null || existing.CommissionPercentage == 0m)
            {
                existing.CommissionPercentage = commissionPercentage;
                existing.CommissionAmount = commissionAmount;
                existing.SupplierAmount = supplierAmount;
            }
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
            CancellationReason = null,
            CommissionPercentage = commissionPercentage,
            CommissionAmount = commissionAmount,
            SupplierAmount = supplierAmount
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

    // ΓöÇΓöÇ Activity seed ΓÇö one recent event per dashboard feed type ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    private static async Task SeedActivityDataAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        ILogger logger)
    {
        var now = DateTime.UtcNow;

        // 1. Recent user registration (2 days ago)
        var recentUserId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
        var recentUser = await EnsureUserAsync(
            userManager,
            recentUserId,
            "recent.user@ares.local",
            "Layla",
            "Hassan",
            FormatValidPhone("+201011223344"),
            null,
            "Customer");

        // Backdate CreatedAt so the dashboard shows a realistic timestamp
        var recentUserEntity = await context.Users.FirstOrDefaultAsync(u => u.Id == recentUserId);
        if (recentUserEntity != null && recentUserEntity.CreatedAt > now.AddDays(-3))
        {
            recentUserEntity.CreatedAt = now.AddDays(-2);
            await context.SaveChangesAsync();
        }

        // 2. Recent vehicle added (8 days ago)
        

        // 3. Recent booking - Pending (3 days ago)
        

        // 4. Recent payment - a Confirmed booking updated 3 hours ago
        

        // 5. Recent verification (5 days ago)
        var recentVerificationId = Guid.Parse("a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5");
        var existingVerification = await context.Verifications
            .FirstOrDefaultAsync(v => v.Id == recentVerificationId);

        if (existingVerification == null)
        {
            var verification = new Verification
            {
                Id = recentVerificationId,
                UserId = recentUserId,
                VerificationType = "Identity",
                DocumentType = "NationalId",
                Status = "Pending",
                SubmittedAt = now.AddDays(-5),
                CreatedAt = now.AddDays(-5),
                UpdatedAt = now.AddDays(-5),
            };
            await context.Verifications.AddAsync(verification);
            await context.SaveChangesAsync();
        }
        else
        {
            existingVerification.UserId = recentUserId;
            // Only set to Pending if it's currently null or we are in a clean state,
            // but don't overwrite it if it's already been Approved/Rejected by an admin.
            if (string.IsNullOrEmpty(existingVerification.Status))
            {
                existingVerification.Status = "Pending";
            }
            
            if (existingVerification.CreatedAt > now.AddDays(-4))
            {
                existingVerification.CreatedAt = now.AddDays(-5);
                existingVerification.UpdatedAt = now.AddDays(-5);
                existingVerification.SubmittedAt = now.AddDays(-5);
            }
            await context.SaveChangesAsync();
        }

        logger.LogInformation("Activity seed data created successfully (verification).");
    }

    private static async Task SeedDriverModuleAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        ILogger logger)
    {
        logger.LogInformation("Seeding Driver Module data...");

        // 1. Predefined Service Areas
        var cairoServiceArea = await EnsureServiceAreaAsync(context, Guid.Parse("c0000000-c000-c000-c000-c00000000000"), "Cairo", "Cairo Governorate");
        var gizaServiceArea = await EnsureServiceAreaAsync(context, Guid.Parse("a0000000-0000-0000-0000-000000000002"), "Giza", "Giza Governorate");
        var alexServiceArea = await EnsureServiceAreaAsync(context, Guid.Parse("a0000000-a000-a000-a000-a00000000000"), "Alexandria", "Alexandria Governorate");
        var sharmServiceArea = await EnsureServiceAreaAsync(context, Guid.Parse("b0000000-0000-0000-0000-000000000003"), "Sharm El Sheikh", "South Sinai Governorate");
        var hurghadaServiceArea = await EnsureServiceAreaAsync(context, Guid.Parse("b0000000-0000-0000-0000-000000000004"), "Hurghada", "Red Sea Governorate");

        // 2. Global Driver Daily Rate Setting
        if (!await context.SystemSettings.AnyAsync(s => s.Key == "driver.daily_rate"))
        {
            await context.SystemSettings.AddAsync(new SystemSetting
            {
                Id = Guid.NewGuid(),
                Key = "driver.daily_rate",
                Value = "25.00"
            });
        }
        await context.SaveChangesAsync();

        // 3. Demo Driver Users & Profiles
        // Driver 1: Ahmed (Cairo & Giza)
        var driver1User = await EnsureUserAsync(
            userManager,
            Guid.Parse("d1111111-1111-1111-1111-111111111111"),
            "ahmed.driver@ares.local",
            "Ahmed",
            "Driver",
            FormatValidPhone("+201011111111"),
            null,
            "Driver");

        await EnsureDriverProfileAsync(
            context,
            Guid.Parse("f1111111-1111-1111-1111-111111111111"),
            driver1User.Id,
            "DL-EGY-111111",
            DriverProfileStatus.Verified,
            DriverAvailability.Available,
            "15 Tahrir Square, Cairo",
            "Sayed Driver",
            FormatValidPhone("+201009999991"),
            new[] { cairoServiceArea.Id, gizaServiceArea.Id });

        // Driver 2: Mostafa (Alexandria)
        var driver2User = await EnsureUserAsync(
            userManager,
            Guid.Parse("d2222222-2222-2222-2222-222222222222"),
            "mostafa.driver@ares.local",
            "Mostafa",
            "Driver",
            FormatValidPhone("+201022222222"),
            null,
            "Driver");

        await EnsureDriverProfileAsync(
            context,
            Guid.Parse("f2222222-2222-2222-2222-222222222222"),
            driver2User.Id,
            "DL-EGY-222222",
            DriverProfileStatus.Verified,
            DriverAvailability.Available,
            "20 Corniche Road, Alexandria",
            "Sayed Driver",
            FormatValidPhone("+201009999992"),
            new[] { alexServiceArea.Id });

        // Driver 3: Sayed (Hurghada)
        var driver3User = await EnsureUserAsync(
            userManager,
            Guid.Parse("d3333333-3333-3333-3333-333333333333"),
            "sayed.driver@ares.local",
            "Sayed",
            "Driver",
            FormatValidPhone("+201033333333"),
            null,
            "Driver");

        await EnsureDriverProfileAsync(
            context,
            Guid.Parse("f3333333-3333-3333-3333-333333333333"),
            driver3User.Id,
            "DL-EGY-333333",
            DriverProfileStatus.PendingVerification,
            DriverAvailability.Unavailable,
            "Hurghada Marina, Hurghada",
            "Ahmed Driver",
            FormatValidPhone("+201009999993"),
            new[] { hurghadaServiceArea.Id });

        await context.SaveChangesAsync();
        logger.LogInformation("Driver Module data seeded successfully.");
    }

    private static async Task<ServiceArea> EnsureServiceAreaAsync(
        ApplicationDbContext context,
        Guid id,
        string name,
        string governorate)
    {
        var existing = await context.ServiceAreas.FirstOrDefaultAsync(sa => sa.Id == id || sa.Name == name);
        if (existing != null)
        {
            existing.Name = name;
            existing.Governorate = governorate;
            existing.IsActive = true;
            return existing;
        }

        var sa = new ServiceArea
        {
            Id = id,
            Name = name,
            Governorate = governorate,
            IsActive = true
        };
        await context.ServiceAreas.AddAsync(sa);
        return sa;
    }

    private static async Task EnsureDriverProfileAsync(
        ApplicationDbContext context,
        Guid id,
        Guid userId,
        string licenseNumber,
        DriverProfileStatus status,
        DriverAvailability availability,
        string address,
        string emergencyContactName,
        string emergencyContactPhone,
        Guid[] serviceAreaIds)
    {
        var existing = await context.DriverProfiles.FirstOrDefaultAsync(dp => dp.Id == id || dp.UserId == userId);
        if (existing != null)
        {
            existing.UserId = userId;
            existing.LicenseNumber = licenseNumber;
            existing.LicenseExpiryDate = DateTime.UtcNow.AddYears(5);
            existing.Status = status;
            existing.Availability = availability;
            existing.Address = address;
            existing.EmergencyContactName = emergencyContactName;
            existing.EmergencyContactPhone = emergencyContactPhone;
            existing.IsActive = true;
        }
        else
        {
            existing = new DriverProfile
            {
                Id = id,
                UserId = userId,
                LicenseNumber = licenseNumber,
                LicenseExpiryDate = DateTime.UtcNow.AddYears(5),
                Status = status,
                Availability = availability,
                Address = address,
                EmergencyContactName = emergencyContactName,
                EmergencyContactPhone = emergencyContactPhone,
                IsActive = true
            };
            await context.DriverProfiles.AddAsync(existing);
        }

        // Sync work areas
        foreach (var serviceAreaId in serviceAreaIds)
        {
            var hasWorkArea = await context.DriverWorkAreas.AnyAsync(w => w.DriverProfileId == existing.Id && w.ServiceAreaId == serviceAreaId);
            if (!hasWorkArea)
            {
                await context.DriverWorkAreas.AddAsync(new DriverWorkArea
                {
                    DriverProfileId = existing.Id,
                    ServiceAreaId = serviceAreaId
                });
            }
        }
    }

    private static async Task EnsureCategoriesAndCategorizeVehiclesAsync(ApplicationDbContext context, ILogger logger)
    {
        logger.LogInformation("Ensuring vehicle categories and categorizing vehicles...");

        // 1. Define sensible vehicle categories
        var expectedCategories = new[]
        {
            new { Name = "Economy", Description = "Fuel-efficient, budget-friendly cars perfect for daily commutes and short city trips.", Commission = 10.00m, Discount = 5.00m },
            new { Name = "Standard", Description = "Comfortable, reliable mid-sized vehicles suitable for business or family travel.", Commission = 12.00m, Discount = 5.00m },
            new { Name = "Luxury", Description = "Premium high-end vehicles delivering refined performance and exceptional comfort.", Commission = 15.00m, Discount = 10.00m },
            new { Name = "SUV", Description = "Spacious, versatile sport utility vehicles ideal for family adventures and road trips.", Commission = 14.00m, Discount = 5.00m },
            new { Name = "Van", Description = "High-capacity multi-passenger vans and cargo vehicles for group travel or transport.", Commission = 13.00m, Discount = 5.00m },
            new { Name = "Electric", Description = "Modern, eco-friendly battery electric vehicles with zero emissions.", Commission = 11.00m, Discount = 5.00m },
            new { Name = "Hybrid", Description = "Smart, fuel-efficient vehicles powered by a combination of gasoline and electric systems.", Commission = 11.00m, Discount = 5.00m }
        };

        var categoriesCreated = new List<string>();
        var dbCategories = await context.Categories.ToListAsync();

        foreach (var catDef in expectedCategories)
        {
            var existing = dbCategories.FirstOrDefault(c => c.Name.Equals(catDef.Name, StringComparison.OrdinalIgnoreCase));
            if (existing == null)
            {
                var newCat = new Category
                {
                    Id = Guid.NewGuid(),
                    Name = catDef.Name,
                    Description = catDef.Description,
                    CommissionPercentage = catDef.Commission,
                    DiscountPercentage = catDef.Discount,
                    IsActive = true
                };
                await context.Categories.AddAsync(newCat);
                dbCategories.Add(newCat);
                categoriesCreated.Add(catDef.Name);
            }
        }

        if (categoriesCreated.Count > 0)
        {
            await context.SaveChangesAsync();
            logger.LogInformation("Created new vehicle categories: {Categories}", string.Join(", ", categoriesCreated));
        }

        // Get references to categories in memory
        var economyCategory = dbCategories.First(c => c.Name.Equals("Economy", StringComparison.OrdinalIgnoreCase));
        var standardCategory = dbCategories.First(c => c.Name.Equals("Standard", StringComparison.OrdinalIgnoreCase));
        var luxuryCategory = dbCategories.First(c => c.Name.Equals("Luxury", StringComparison.OrdinalIgnoreCase));
        var suvCategory = dbCategories.First(c => c.Name.Equals("SUV", StringComparison.OrdinalIgnoreCase));
        var vanCategory = dbCategories.First(c => c.Name.Equals("Van", StringComparison.OrdinalIgnoreCase));
        var electricCategory = dbCategories.First(c => c.Name.Equals("Electric", StringComparison.OrdinalIgnoreCase));
        var hybridCategory = dbCategories.First(c => c.Name.Equals("Hybrid", StringComparison.OrdinalIgnoreCase));

        // 2. Query and process all vehicles
        var vehicles = await context.Vehicles.ToListAsync();
        var counts = new Dictionary<string, int>
        {
            { "Economy", 0 },
            { "Standard", 0 },
            { "Luxury", 0 },
            { "SUV", 0 },
            { "Van", 0 },
            { "Electric", 0 },
            { "Hybrid", 0 }
        };
        var uncategorizedVehicles = new List<string>();
        bool modified = false;

        foreach (var vehicle in vehicles)
        {
            var make = vehicle.Make ?? string.Empty;
            var model = vehicle.Model ?? string.Empty;
            var description = vehicle.Description ?? string.Empty;
            var fuelType = vehicle.FuelType ?? string.Empty;
            var seats = vehicle.Seats ?? 0;
            var price = vehicle.PricePerDay ?? 0m;

            // Check if vehicle is completely blank/uncategorizable
            if (string.IsNullOrWhiteSpace(make) && string.IsNullOrWhiteSpace(model) && seats == 0 && price == 0m)
            {
                uncategorizedVehicles.Add($"ID: {vehicle.Id} (Unknown)");
                continue;
            }

            Category targetCategory;

            // 1. Electric
            if (fuelType.Contains("electric", StringComparison.OrdinalIgnoreCase) || 
                model.Contains("electric", StringComparison.OrdinalIgnoreCase) ||
                description.Contains("electric", StringComparison.OrdinalIgnoreCase))
            {
                targetCategory = electricCategory;
            }
            // 2. Hybrid
            else if (fuelType.Contains("hybrid", StringComparison.OrdinalIgnoreCase) ||
                     model.Contains("hybrid", StringComparison.OrdinalIgnoreCase) ||
                     description.Contains("hybrid", StringComparison.OrdinalIgnoreCase))
            {
                targetCategory = hybridCategory;
            }
            // 3. Van
            else if (model.Contains("van", StringComparison.OrdinalIgnoreCase) || 
                     model.Contains("transit", StringComparison.OrdinalIgnoreCase) ||
                     description.Contains("van", StringComparison.OrdinalIgnoreCase) || 
                     description.Contains("transit", StringComparison.OrdinalIgnoreCase) ||
                     seats >= 7)
            {
                targetCategory = vanCategory;
            }
            // 4. SUV
            else if (model.Contains("suv", StringComparison.OrdinalIgnoreCase) || 
                     model.Contains("crossover", StringComparison.OrdinalIgnoreCase) ||
                     description.Contains("suv", StringComparison.OrdinalIgnoreCase) || 
                     description.Contains("crossover", StringComparison.OrdinalIgnoreCase) ||
                     new[] { "rav4", "tucson", "cherokee", "cx-5", "sportage", "santa fe", "qashqai" }.Any(m => model.Contains(m, StringComparison.OrdinalIgnoreCase)))
            {
                targetCategory = suvCategory;
            }
            // 5. Luxury
            else if (price >= 150m || 
                     new[] { "bmw", "mercedes", "audi", "lexus", "porsche", "tesla", "volvo" }.Any(brand => make.Contains(brand, StringComparison.OrdinalIgnoreCase)))
            {
                targetCategory = luxuryCategory;
            }
            // 6. Economy
            else if (seats <= 4 || price < 45m)
            {
                targetCategory = economyCategory;
            }
            // 7. Standard
            else
            {
                targetCategory = standardCategory;
            }

            if (vehicle.CategoryId != targetCategory.Id)
            {
                vehicle.CategoryId = targetCategory.Id;
                modified = true;
            }

            counts[targetCategory.Name]++;
        }

        if (modified)
        {
            await context.SaveChangesAsync();
            logger.LogInformation("Successfully updated and saved categorized vehicles in database.");
        }

        // Output summary to logs
        logger.LogInformation("================ VEHICLE CATEGORIZATION SUMMARY ================");
        logger.LogInformation("Categories Created: {CategoriesCount} ({Categories})", categoriesCreated.Count, string.Join(", ", categoriesCreated));
        foreach (var kvp in counts)
        {
            logger.LogInformation("Category '{CategoryName}': {Count} vehicles assigned", kvp.Key, kvp.Value);
        }
        if (uncategorizedVehicles.Count > 0)
        {
            logger.LogWarning("Uncategorized Vehicles: {Count} - {Details}", uncategorizedVehicles.Count, string.Join(", ", uncategorizedVehicles));
        }
        else
        {
            logger.LogInformation("Uncategorized Vehicles: 0");
        }
        logger.LogInformation("================================================================");
    }
}


