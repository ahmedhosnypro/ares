using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Backend.Infrastructure.Data.Interceptors;

namespace Backend.Infrastructure.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, Microsoft.AspNetCore.Identity.IdentityRole<System.Guid>, System.Guid>, IApplicationDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.AddInterceptors(new AuditableEntityInterceptor());
            base.OnConfiguring(optionsBuilder);
        }

        // Core Entities
        public DbSet<UserAddress> UserAddresses { get; set; }
        public DbSet<Verification> Verifications { get; set; }
        public DbSet<CompanyProfile> CompanyProfiles { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Promotion> Promotions { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<VehicleImage> VehicleImages { get; set; }
        public DbSet<Driver> Drivers { get; set; }
        // ── Driver Module (Phase 1+) ──────────────────────────────────────
        // DriverProfile is the new entity used by the Driver Module. It is
        // separate from the legacy <see cref="Driver"/> entity above, which
        // continues to store the customer's *driving license* submission.
        public DbSet<DriverProfile> DriverProfiles { get; set; }
        public DbSet<DriverWorkArea> DriverWorkAreas { get; set; }
        public DbSet<ServiceArea> ServiceAreas { get; set; }
        public DbSet<DriverReview> DriverReviews { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<BookingPayment> Payments { get; set; }
        public DbSet<Inspector> Inspectors { get; set; }
        public DbSet<VehicleInspection> VehicleInspections { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Favorite> Favorites { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<SystemSetting> SystemSettings { get; set; }
        public DbSet<TermsSection> TermsSections { get; set; }
        public DbSet<AboutSection> AboutSections { get; set; }

        // Crucial Graduation Project Extras
        public DbSet<VehicleFeature> VehicleFeatures { get; set; }
        public DbSet<BookingCancellation> BookingCancellations { get; set; }
        public DbSet<PaymentMethod> PaymentMethods { get; set; }
        public DbSet<InspectionPhoto> InspectionPhotos { get; set; }
        public DbSet<InspectionImage> InspectionImages { get; set; }
        public DbSet<VehicleAvailability> VehicleAvailabilities { get; set; }
        // Explicit interface implementation for IApplicationDbContext
        IQueryable<Category> IApplicationDbContext.Categories => Categories;
        IQueryable<Promotion> IApplicationDbContext.Promotions => Promotions;
        IQueryable<Vehicle> IApplicationDbContext.Vehicles => Vehicles;
        IQueryable<VehicleImage> IApplicationDbContext.VehicleImages => VehicleImages;
        IQueryable<Booking> IApplicationDbContext.Bookings => Bookings;
        IQueryable<BookingPayment> IApplicationDbContext.Payments => Payments;
        IQueryable<Review> IApplicationDbContext.Reviews => Reviews;
        IQueryable<Favorite> IApplicationDbContext.Favorites => Favorites;
        IQueryable<VehicleFeature> IApplicationDbContext.VehicleFeatures => VehicleFeatures;
        IQueryable<ApplicationUser> IApplicationDbContext.Users => Users;
        IQueryable<BookingCancellation> IApplicationDbContext.BookingCancellations => BookingCancellations;
        IQueryable<UserAddress> IApplicationDbContext.UserAddresses => UserAddresses;
        IQueryable<Verification> IApplicationDbContext.Verifications => Verifications;
        IQueryable<Notification> IApplicationDbContext.Notifications => Notifications;
        IQueryable<SystemSetting> IApplicationDbContext.SystemSettings => SystemSettings;
        IQueryable<TermsSection> IApplicationDbContext.TermsSections => TermsSections;
        IQueryable<AboutSection> IApplicationDbContext.AboutSections => AboutSections;
        IQueryable<Driver> IApplicationDbContext.Drivers => Drivers;
        IQueryable<DriverProfile> IApplicationDbContext.DriverProfiles => DriverProfiles;
        IQueryable<DriverWorkArea> IApplicationDbContext.DriverWorkAreas => DriverWorkAreas;
        IQueryable<ServiceArea> IApplicationDbContext.ServiceAreas => ServiceAreas;
        IQueryable<DriverReview> IApplicationDbContext.DriverReviews => DriverReviews;
        IQueryable<VehicleInspection> IApplicationDbContext.VehicleInspections => VehicleInspections;
        IQueryable<InspectionImage> IApplicationDbContext.InspectionImages => InspectionImages;
        IQueryable<Inspector> IApplicationDbContext.Inspectors => Inspectors;

        public void AddFavorite(Favorite favorite)
        {
            Favorites.Add(favorite);
        }

        public void AddVehicleInspection(VehicleInspection inspection)
        {
            VehicleInspections.Add(inspection);
        }

        public void AddBookingCancellation(BookingCancellation cancellation)
        {
            BookingCancellations.Add(cancellation);
        }

        public void AddUserAddress(UserAddress userAddress)
        {
            UserAddresses.Add(userAddress);
        }

        public void AddVerification(Verification verification)
        {
            Verifications.Add(verification);
        }

        public void AddDriver(Driver driver)
        {
            Drivers.Add(driver);
        }

        // Driver Module — additive helper for creating a brand-new driver
        // profile during registration (Phase 1). Keeps the AuthService
        // free of direct DbSet access, matching the existing AddDriver /
        // AddVerification / AddUserAddress pattern.
        public void AddDriverProfile(DriverProfile driverProfile)
        {
            DriverProfiles.Add(driverProfile);
        }

        public void AddVehicleImage(VehicleImage image)
        {
            VehicleImages.Add(image);
        }

        public void RemoveVehicleImages(IEnumerable<VehicleImage> images)
        {
            VehicleImages.RemoveRange(images);
        }

        public void RemoveVehicleFeatures(IEnumerable<VehicleFeature> features)
        {
            VehicleFeatures.RemoveRange(features);
        }

        public void AddVehicleFeatures(IEnumerable<VehicleFeature> features)
        {
            VehicleFeatures.AddRange(features);
        }

        public void AddSystemSetting(SystemSetting setting)
        {
            SystemSettings.Add(setting);
        }

        public void AddCategory(Category category)
        {
            Categories.Add(category);
        }

        public void RemoveCategory(Category category)
        {
            Categories.Remove(category);
        }

        public void AddPromotion(Promotion promotion)
        {
            Promotions.Add(promotion);
        }

        public void RemovePromotion(Promotion promotion)
        {
            Promotions.Remove(promotion);
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.ApplyConfigurationsFromAssembly(System.Reflection.Assembly.GetExecutingAssembly());
        }
    }
}
