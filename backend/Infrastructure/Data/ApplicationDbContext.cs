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
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<VehicleImage> VehicleImages { get; set; }
        public DbSet<Driver> Drivers { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<BookingPayment> Payments { get; set; }
        public DbSet<Inspector> Inspectors { get; set; }
        public DbSet<VehicleInspection> VehicleInspections { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Favorite> Favorites { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }

        // Crucial Graduation Project Extras
        public DbSet<VehicleFeature> VehicleFeatures { get; set; }
        public DbSet<BookingCancellation> BookingCancellations { get; set; }
        public DbSet<PaymentMethod> PaymentMethods { get; set; }
        public DbSet<InspectionPhoto> InspectionPhotos { get; set; }
        public DbSet<VehicleAvailability> VehicleAvailabilities { get; set; }
        // Explicit interface implementation for IApplicationDbContext
        IQueryable<Vehicle> IApplicationDbContext.Vehicles => Vehicles;
        IQueryable<Booking> IApplicationDbContext.Bookings => Bookings;
        IQueryable<Review> IApplicationDbContext.Reviews => Reviews;
        IQueryable<Favorite> IApplicationDbContext.Favorites => Favorites;
        IQueryable<VehicleFeature> IApplicationDbContext.VehicleFeatures => VehicleFeatures;
        IQueryable<ApplicationUser> IApplicationDbContext.Users => Users;
        IQueryable<BookingCancellation> IApplicationDbContext.BookingCancellations => BookingCancellations;
        IQueryable<UserAddress> IApplicationDbContext.UserAddresses => UserAddresses;
        IQueryable<Verification> IApplicationDbContext.Verifications => Verifications;
        IQueryable<Notification> IApplicationDbContext.Notifications => Notifications;

        public void AddFavorite(Favorite favorite)
        {
            Favorites.Add(favorite);
        }

        public void AddBookingCancellation(BookingCancellation cancellation)
        {
            BookingCancellations.Add(cancellation);
        }

        public void AddUserAddress(UserAddress userAddress)
        {
            UserAddresses.Add(userAddress);
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.ApplyConfigurationsFromAssembly(System.Reflection.Assembly.GetExecutingAssembly());
        }
    }
}
