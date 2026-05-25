using Backend.Domain.Entities;

namespace Backend.Application.Interfaces;

/// <summary>
/// Interface for the application database context
/// </summary>
public interface IApplicationDbContext
{
    IQueryable<Vehicle> Vehicles { get; }
    IQueryable<Booking> Bookings { get; }
    IQueryable<BookingPayment> Payments { get; }
    IQueryable<Review> Reviews { get; }
    IQueryable<Favorite> Favorites { get; }
    IQueryable<VehicleFeature> VehicleFeatures { get; }
    IQueryable<ApplicationUser> Users { get; }
    IQueryable<BookingCancellation> BookingCancellations { get; }
    IQueryable<UserAddress> UserAddresses { get; }
    IQueryable<Verification> Verifications { get; }
    IQueryable<Notification> Notifications { get; }
    IQueryable<SystemSetting> SystemSettings { get; }
    IQueryable<TermsSection> TermsSections { get; }
    IQueryable<Driver> Drivers { get; }
    void AddFavorite(Favorite favorite);
    void AddBookingCancellation(BookingCancellation cancellation);
    void AddUserAddress(UserAddress userAddress);
    void AddVerification(Verification verification);
    void AddDriver(Driver driver);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
