using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
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
        public DbSet<DiscountCode> DiscountCodes { get; set; }
        public DbSet<DiscountUsage> DiscountUsages { get; set; }
        public DbSet<DiscountVehicleCategory> DiscountVehicleCategories { get; set; }
        public DbSet<DiscountValidationLog> DiscountValidationLogs { get; set; }
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
        public DbSet<DriverEarning> DriverEarnings { get; set; }
        public DbSet<DriverPayout> DriverPayouts { get; set; }
        public DbSet<DriverPayoutTransaction> DriverPayoutTransactions { get; set; }
        public DbSet<DriverPaymentInfo> DriverPaymentInfo { get; set; }
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
        public DbSet<PrivacySection> PrivacySections { get; set; }

        // Crucial Graduation Project Extras
        public DbSet<VehicleFeature> VehicleFeatures { get; set; }
        public DbSet<BookingCancellation> BookingCancellations { get; set; }
        public DbSet<PaymentMethod> PaymentMethods { get; set; }
        public DbSet<InspectionPhoto> InspectionPhotos { get; set; }
        public DbSet<InspectionImage> InspectionImages { get; set; }
        public DbSet<VehicleAvailability> VehicleAvailabilities { get; set; }
        // Explicit interface implementation for IApplicationDbContext
        IQueryable<Category> IApplicationDbContext.Categories => Categories;
        IQueryable<DiscountCode> IApplicationDbContext.DiscountCodes => DiscountCodes;
        IQueryable<DiscountUsage> IApplicationDbContext.DiscountUsages => DiscountUsages;
        IQueryable<DiscountVehicleCategory> IApplicationDbContext.DiscountVehicleCategories => DiscountVehicleCategories;
        IQueryable<DiscountValidationLog> IApplicationDbContext.DiscountValidationLogs => DiscountValidationLogs;
        IQueryable<Vehicle> IApplicationDbContext.Vehicles => Vehicles;
        IQueryable<VehicleImage> IApplicationDbContext.VehicleImages => VehicleImages;
        IQueryable<Booking> IApplicationDbContext.Bookings => Bookings;
        IQueryable<BookingPayment> IApplicationDbContext.Payments => Payments;
        IQueryable<Review> IApplicationDbContext.Reviews => Reviews;
        IQueryable<Favorite> IApplicationDbContext.Favorites => Favorites;
        IQueryable<VehicleFeature> IApplicationDbContext.VehicleFeatures => VehicleFeatures;
        IQueryable<ApplicationUser> IApplicationDbContext.Users => Users;
        IQueryable<Microsoft.AspNetCore.Identity.IdentityUserRole<Guid>> IApplicationDbContext.UserRoles => UserRoles;
        IQueryable<BookingCancellation> IApplicationDbContext.BookingCancellations => BookingCancellations;
        IQueryable<UserAddress> IApplicationDbContext.UserAddresses => UserAddresses;
        IQueryable<Verification> IApplicationDbContext.Verifications => Verifications;
        IQueryable<Notification> IApplicationDbContext.Notifications => Notifications;
        IQueryable<SystemSetting> IApplicationDbContext.SystemSettings => SystemSettings;
        IQueryable<TermsSection> IApplicationDbContext.TermsSections => TermsSections;
        IQueryable<AboutSection> IApplicationDbContext.AboutSections => AboutSections;
        IQueryable<PrivacySection> IApplicationDbContext.PrivacySections => PrivacySections;
    IQueryable<Driver> IApplicationDbContext.Drivers => Drivers;
    IQueryable<CompanyProfile> IApplicationDbContext.CompanyProfiles => CompanyProfiles;
    // Driver Module (Phase 1+) — additive, see DriverProfile entity.
        DbSet<DriverProfile> IApplicationDbContext.DriverProfiles => DriverProfiles;
        DbSet<DriverWorkArea> IApplicationDbContext.DriverWorkAreas => DriverWorkAreas;
        DbSet<ServiceArea> IApplicationDbContext.ServiceAreas => ServiceAreas;
        DbSet<DriverReview> IApplicationDbContext.DriverReviews => DriverReviews;
        DbSet<DriverEarning> IApplicationDbContext.DriverEarnings => DriverEarnings;
        DbSet<DriverPayout> IApplicationDbContext.DriverPayouts => DriverPayouts;
        DbSet<DriverPayoutTransaction> IApplicationDbContext.DriverPayoutTransactions => DriverPayoutTransactions;
        DbSet<DriverPaymentInfo> IApplicationDbContext.DriverPaymentInfo => DriverPaymentInfo;
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

        public void AddPayment(BookingPayment payment)
        {
            Payments.Add(payment);
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

        public void AddDriverPaymentInfo(DriverPaymentInfo driverPaymentInfo)
        {
            DriverPaymentInfo.Add(driverPaymentInfo);
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

        public void AddDiscountCode(DiscountCode discountCode)
        {
            DiscountCodes.Add(discountCode);
        }

        public void RemoveDiscountCode(DiscountCode discountCode)
        {
            DiscountCodes.Remove(discountCode);
        }

        public void AddDiscountUsage(DiscountUsage discountUsage)
        {
            DiscountUsages.Add(discountUsage);
        }

        public void AddDiscountValidationLog(DiscountValidationLog validationLog)
        {
            DiscountValidationLogs.Add(validationLog);
        }

        public async Task<int> IncrementDiscountUsageCountAsync(Guid discountId, CancellationToken cancellationToken = default)
        {
            return await Database.ExecuteSqlRawAsync(
                "UPDATE DiscountCodes SET CurrentUsageCount = CurrentUsageCount + 1 " +
                "WHERE Id = {0} AND (UsageLimitTotal IS NULL OR CurrentUsageCount < UsageLimitTotal)",
                discountId, cancellationToken);
        }

        public Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
        {
            return Database.BeginTransactionAsync(cancellationToken);
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<DriverPayoutTransaction>(entity =>
            {
                entity.HasKey(e => new { e.DriverPayoutId, e.DriverEarningId });
                entity.HasOne(e => e.DriverEarning)
                    .WithMany()
                    .HasForeignKey(e => e.DriverEarningId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
            builder.Entity<DiscountVehicleCategory>(entity =>
            {
                entity.HasKey(e => new { e.DiscountId, e.CategoryId });
            });
            builder.Entity<DiscountUsage>(entity =>
            {
                entity.HasIndex(e => new { e.BookingId, e.DiscountId }).IsUnique();
                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
            builder.Entity<DiscountCode>(entity =>
            {
                entity.HasIndex(e => e.Code).IsUnique();
                entity.HasIndex(e => new { e.IsActive, e.IsAutomatic, e.ValidFrom, e.ValidTo });
                entity.HasOne(e => e.Supplier)
                    .WithMany()
                    .HasForeignKey(e => e.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.CreatedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.CreatedById)
                    .OnDelete(DeleteBehavior.Restrict);
            });
            builder.Entity<DiscountValidationLog>(entity =>
            {
                entity.HasIndex(e => new { e.DiscountId, e.ValidatedAt });
                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.Vehicle)
                    .WithMany()
                    .HasForeignKey(e => e.VehicleId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
            builder.ApplyConfigurationsFromAssembly(System.Reflection.Assembly.GetExecutingAssembly());
        }
    }
}
