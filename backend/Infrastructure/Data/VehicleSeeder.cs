using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Data;

/// <summary>
/// Seeds a wide range of vehicles targeting the Egyptian rental market.
/// Year range: 2015–2024 — reflecting the realistic mix of older and newer
/// models commonly found in Egyptian car rental fleets.
///
/// Images are sourced from Unsplash (free, open license).
/// Car data is based on real makes/models verified against NHTSA vPIC API.
///
/// Called from DbInitializer.SeedDemoDataAsync — do not run standalone.
/// </summary>
public static class VehicleSeeder
{
    // Distribute vehicles across the four demo suppliers
    private static readonly Guid SupplierId      = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid SupplierTwoId   = Guid.Parse("abababab-abab-abab-abab-abababababab");
    private static readonly Guid SupplierThreeId = Guid.Parse("cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd");
    private static readonly Guid SupplierFourId  = Guid.Parse("efefefef-efef-efef-efef-efefefefefef");

    // Images are stored locally under wwwroot/uploads/seed/vehicles/<make>-<model>-<year>/img-N.jpg
    // Downloaded by: backend/Infrastructure/Data/SeedData/download-car-images.ts
    // Served as: /uploads/seed/vehicles/<make>-<model>-<year>/img-N.jpg

    // ── Features by category ───────────────────────────────────────────────
    private static readonly Dictionary<string, (string Category, string Name, string Description)[]> FeaturesByCategory = new()
    {
        ["Compact"] =
        [
            ("Comfort",    "Air Conditioning", "Manual climate control"),
            ("Safety",     "Airbags",          "Front and side airbags"),
            ("Technology", "Bluetooth",         "Hands-free calling"),
        ],
        ["Standard"] =
        [
            ("Comfort",    "Air Conditioning", "Automatic climate control"),
            ("Safety",     "Rear Camera",      "Parking camera with sensors"),
            ("Technology", "Bluetooth",         "Hands-free calling and audio streaming"),
            ("Safety",     "Cruise Control",   "Adaptive cruise control"),
        ],
        ["Premium"] =
        [
            ("Comfort",    "Leather Seats",     "Premium leather upholstery"),
            ("Comfort",    "Heated Seats",      "Front and rear heated seats"),
            ("Technology", "Navigation",         "Built-in GPS navigation system"),
            ("Technology", "Premium Audio",      "High-end sound system"),
            ("Safety",     "Blind Spot Monitor","Lane change assist"),
            ("Safety",     "Parking Assist",    "Automated parking system"),
        ],
    };

    // ── Vehicle definitions ────────────────────────────────────────────────
    // Each record: (Make, Model, Year, Category, Color, Transmission, FuelType, Seats, PricePerDay, City)
    // ONLY includes cars with downloaded images in wwwroot/uploads/seed/vehicles/
    // Categories map to frontend display:
    //   - "Compact" → Compact & Mini (4 seats, budget)
    //   - "Standard" → Mid-Size & Standard (5 seats, mid-range)
    //   - "Premium" → SUVs & Maxi (5+ seats, premium/large)
    private static readonly (string Make, string Model, int Year, string Category, string Color,
        string Transmission, string FuelType, int Seats, decimal PricePerDay, string City)[] VehicleDefinitions =
    [
        // ── Compact & Mini (4-5 seats, budget: $25-40/day) ───────────────
        ("Chevrolet",  "Spark",   2018, "Compact", "Red",    "Manual",    "Gasoline", 4, 26m,  "Cairo"),
        ("Hyundai",    "Accent",  2016, "Compact", "Silver", "Manual",    "Gasoline", 5, 27m,  "Alexandria"),
        ("Kia",        "Rio",     2017, "Compact", "Blue",   "Manual",    "Gasoline", 5, 29m,  "Giza"),
        ("Toyota",     "Yaris",   2020, "Compact", "White",  "Automatic", "Gasoline", 5, 35m,  "Sharm El Sheikh"),
        ("Hyundai",    "Accent",  2021, "Compact", "Black",  "Automatic", "Gasoline", 5, 38m,  "Hurghada"),

        // ── Mid-Size & Standard (5 seats, mid-range: $55-70/day) ─────────
        ("Toyota",  "RAV4",        2015, "Standard", "White",  "Automatic", "Gasoline", 5, 55m,  "Cairo"),
        ("Volkswagen", "Jetta",   2019, "Standard", "White",  "Automatic", "Gasoline", 5, 55m,  "Sharm El Sheikh"),
        ("Nissan",     "Altima",  2019, "Standard", "Gray",   "Automatic", "Gasoline", 5, 58m,  "Cairo"),
        ("Hyundai", "Tucson",      2017, "Standard", "Gray",   "Automatic", "Gasoline", 5, 60m,  "Giza"),
        ("Jeep",    "Cherokee",    2019, "Standard", "Red",    "Automatic", "Gasoline", 5, 70m,  "Sharm El Sheikh"),

        // ── SUVs & Maxi (5+ seats, premium/large: $90-150/day) ───────────
        ("Mazda",   "CX-5",        2022, "Premium", "Gray",   "Automatic", "Gasoline", 5, 90m,  "Alexandria"),
        ("Kia",          "Carnival", 2018, "Premium", "Gray",   "Automatic", "Gasoline", 8,  90m,  "Giza"),
        ("BMW",          "3 Series", 2016, "Premium", "Black",  "Automatic", "Gasoline", 5, 95m,  "Cairo"),
        ("Mercedes-Benz","C-Class",  2017, "Premium", "Silver", "Automatic", "Gasoline", 5, 100m, "Alexandria"),
        ("Audi",         "A4",       2018, "Premium", "White",  "Automatic", "Gasoline", 5, 105m, "Cairo"),
        ("Ford",         "Transit",  2021, "Premium", "Silver", "Automatic", "Diesel",   15, 130m, "Cairo"),
        ("Volvo",        "S60",      2023, "Premium", "Blue",   "Automatic", "Gasoline", 5, 148m, "Cairo"),
    ];

    // Cycle suppliers across vehicles for variety
    private static readonly Guid[] SupplierIds =
    [
        SupplierId,
        SupplierTwoId,
        SupplierThreeId,
        SupplierFourId,
    ];

    public static async Task SeedAsync(ApplicationDbContext context, ILogger logger)
    {
        logger.LogInformation("Seeding extended vehicle catalog...");

        var approvedBase = DateTime.UtcNow.AddDays(-60);

        for (var i = 0; i < VehicleDefinitions.Length; i++)
        {
            var def = VehicleDefinitions[i];
            var supplierId = SupplierIds[i % SupplierIds.Length];

            // Deterministic GUID based on make+model+year so re-runs are idempotent
            var vehicleId = DeterministicGuid($"vehicle:{def.Make}:{def.Model}:{def.Year}:{i}");

            var existing = await context.Vehicles
                .Include(v => v.Images)
                .FirstOrDefaultAsync(v => v.Id == vehicleId);

            Vehicle vehicle;
            if (existing != null)
            {
                // Update in place
                existing.UserId           = supplierId;
                existing.Make             = def.Make;
                existing.Model            = def.Model;
                existing.Year             = def.Year;
                existing.Color            = def.Color;
                existing.LicensePlate     = GeneratePlate(def.Make, def.Year, i);
                existing.Transmission     = def.Transmission;
                existing.FuelType         = def.FuelType;
                existing.Seats            = def.Seats;
                existing.PricePerDay      = def.PricePerDay;
                existing.LocationCity     = def.City;
                existing.Description      = BuildDescription(def.Make, def.Model, def.Year, def.Category);
                existing.Status           = def.Category;
                existing.AvailabilityStatus = "Available";
                existing.IsActive         = true;
                vehicle = existing;
            }
            else
            {
                vehicle = new Vehicle
                {
                    Id                  = vehicleId,
                    UserId              = supplierId,
                    Make                = def.Make,
                    Model               = def.Model,
                    Year                = def.Year,
                    Color               = def.Color,
                    LicensePlate        = GeneratePlate(def.Make, def.Year, i),
                    Transmission        = def.Transmission,
                    FuelType            = def.FuelType,
                    Seats               = def.Seats,
                    PricePerDay         = def.PricePerDay,
                    LocationCity        = def.City,
                    Description         = BuildDescription(def.Make, def.Model, def.Year, def.Category),
                    Status              = def.Category,
                    AvailabilityStatus  = "Available",
                    IsActive            = true,
                    ApprovedAt          = approvedBase.AddDays(i),
                };
                await context.Vehicles.AddAsync(vehicle);
            }

            await context.SaveChangesAsync();

            // ── Images ────────────────────────────────────────────────────
            await SeedVehicleImagesAsync(context, vehicle.Id, def.Category, i);

            // ── Features ──────────────────────────────────────────────────
            await SeedVehicleFeaturesAsync(context, vehicle.Id, def.Category);
        }

        await context.SaveChangesAsync();
        logger.LogInformation("Extended vehicle catalog seeded: {Count} vehicles.", VehicleDefinitions.Length);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private static async Task SeedVehicleImagesAsync(
        ApplicationDbContext context,
        Guid vehicleId,
        string category,
        int vehicleIndex)
    {
        // Build the local path slug for this vehicle
        var def = VehicleDefinitions[vehicleIndex];
        var slug = $"{Slugify(def.Make)}-{Slugify(def.Model)}-{def.Year}";

        // 3 images per vehicle: img-1.jpg (primary), img-2.jpg, img-3.jpg
        for (var slot = 0; slot < 3; slot++)
        {
            var fileName  = $"img-{slot + 1}.jpg";
            var imageUrl  = $"uploads/seed/vehicles/{slug}/{fileName}";
            var thumbUrl  = imageUrl; // same file; frontend can resize as needed
            var isPrimary = slot == 0;
            var order     = slot + 1;

            var imageId = DeterministicGuid($"image:{vehicleId}:{slot}");

            var existing = await context.VehicleImages.FirstOrDefaultAsync(x =>
                x.Id == imageId || (x.VehicleId == vehicleId && x.DisplayOrder == order));

            if (existing != null)
            {
                existing.ImageUrl     = imageUrl;
                existing.ThumbnailUrl = thumbUrl;
                existing.IsPrimary    = isPrimary;
                existing.DisplayOrder = order;
            }
            else
            {
                await context.VehicleImages.AddAsync(new VehicleImage
                {
                    Id           = imageId,
                    VehicleId    = vehicleId,
                    ImageUrl     = imageUrl,
                    ThumbnailUrl = thumbUrl,
                    IsPrimary    = isPrimary,
                    DisplayOrder = order,
                });
            }
        }
    }

    private static async Task SeedVehicleFeaturesAsync(
        ApplicationDbContext context,
        Guid vehicleId,
        string category)
    {
        if (!FeaturesByCategory.TryGetValue(category, out var features))
            return;

        for (var fi = 0; fi < features.Length; fi++)
        {
            var (featureCat, name, desc) = features[fi];
            var featureId = DeterministicGuid($"feature:{vehicleId}:{fi}");

            var existing = await context.VehicleFeatures.FirstOrDefaultAsync(x =>
                x.Id == featureId ||
                (x.VehicleId == vehicleId && x.FeatureCategory == featureCat && x.FeatureName == name));

            if (existing != null)
            {
                existing.FeatureCategory   = featureCat;
                existing.FeatureName       = name;
                existing.FeatureDescription = desc;
            }
            else
            {
                await context.VehicleFeatures.AddAsync(new VehicleFeature
                {
                    Id                 = featureId,
                    VehicleId          = vehicleId,
                    FeatureCategory    = featureCat,
                    FeatureName        = name,
                    FeatureDescription = desc,
                });
            }
        }
    }

    private static string Slugify(string s) =>
        s.ToLowerInvariant().Replace(' ', '-').Replace(".", "");

    /// <summary>
    /// Generates a deterministic GUID from a string key so re-runs produce
    /// the same IDs and the seeder stays idempotent.
    /// </summary>
    private static Guid DeterministicGuid(string key)
    {
        var hash = System.Security.Cryptography.MD5.HashData(System.Text.Encoding.UTF8.GetBytes(key));
        // Force version 3 (name-based MD5) bits
        hash[6] = (byte)((hash[6] & 0x0F) | 0x30);
        hash[8] = (byte)((hash[8] & 0x3F) | 0x80);
        return new Guid(hash);
    }

    private static string GeneratePlate(string make, int year, int index)
    {
        var prefix = make.Length >= 3 ? make[..3].ToUpperInvariant() : make.ToUpperInvariant();
        return $"{prefix}-{year % 100:D2}-{index + 1:D3}";
    }

    private static string BuildDescription(string make, string model, int year, string category)
    {
        var age = 2025 - year;
        var ageNote = age >= 7 ? "A well-maintained, proven model"
                    : age >= 4 ? "A reliable mid-generation model"
                    : "A modern, up-to-date model";

        return category switch
        {
            "Compact"  => $"{ageNote} — perfect for budget-conscious travelers. The {year} {make} {model} offers excellent fuel economy and easy city parking.",
            "Standard" => $"{ageNote} — a solid choice for business or leisure. The {year} {make} {model} combines comfort with everyday practicality.",
            "Premium"  => $"{ageNote} — delivering premium comfort and refined performance. The {year} {make} {model} is an exceptional driving experience.",
            _          => $"The {year} {make} {model} is an excellent choice for your rental needs.",
        };
    }
}
