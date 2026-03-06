using Backend.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Backend.Infrastructure.Data.Interceptors;

namespace Backend.Infrastructure.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, Microsoft.AspNetCore.Identity.IdentityRole<System.Guid>, System.Guid>
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
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<VehicleImage> VehicleImages { get; set; }
        public DbSet<Driver> Drivers { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<BookingPayment> Payments { get; set; }
        public DbSet<DriverApplication> DriverApplications { get; set; }
        public DbSet<Inspector> Inspectors { get; set; }
        public DbSet<InspectorApplication> InspectorApplications { get; set; }
        public DbSet<VehicleInspection> VehicleInspections { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        // Crucial Graduation Project Extras
        public DbSet<VehicleFeature> VehicleFeatures { get; set; }
        public DbSet<BookingCancellation> BookingCancellations { get; set; }
        public DbSet<PaymentMethod> PaymentMethods { get; set; }
        public DbSet<InspectionPhoto> InspectionPhotos { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.ApplyConfigurationsFromAssembly(System.Reflection.Assembly.GetExecutingAssembly());
        }
    }
}
