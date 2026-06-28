using Backend.Domain.Entities;

namespace Backend.Application.Interfaces;

/// <summary>
/// Interface for the application database context
/// </summary>
public interface IApplicationDbContext
{
    IQueryable<Category> Categories { get; }
    IQueryable<CategoryOffer> CategoryOffers { get; }
    IQueryable<Promotion> Promotions { get; }
    IQueryable<Vehicle> Vehicles { get; }
    IQueryable<VehicleImage> VehicleImages { get; }
    IQueryable<Booking> Bookings { get; }
    IQueryable<BookingPayment> Payments { get; }
    IQueryable<Review> Reviews { get; }
    IQueryable<Favorite> Favorites { get; }
    IQueryable<VehicleFeature> VehicleFeatures { get; }
    IQueryable<ApplicationUser> Users { get; }
    IQueryable<Microsoft.AspNetCore.Identity.IdentityUserRole<Guid>> UserRoles { get; }
    IQueryable<BookingCancellation> BookingCancellations { get; }
    IQueryable<UserAddress> UserAddresses { get; }
    IQueryable<Verification> Verifications { get; }
    IQueryable<Notification> Notifications { get; }
    IQueryable<SystemSetting> SystemSettings { get; }
    IQueryable<TermsSection> TermsSections { get; }
    IQueryable<AboutSection> AboutSections { get; }
    IQueryable<PrivacySection> PrivacySections { get; }
    IQueryable<Driver> Drivers { get; }
    // Driver Module (Phase 1+) — additive, see DriverProfile entity.
    IQueryable<DriverProfile> DriverProfiles { get; }
    IQueryable<DriverWorkArea> DriverWorkAreas { get; }
    IQueryable<ServiceArea> ServiceAreas { get; }
    IQueryable<DriverReview> DriverReviews { get; }
    IQueryable<VehicleInspection> VehicleInspections { get; }
    IQueryable<InspectionImage> InspectionImages { get; }
    IQueryable<Inspector> Inspectors { get; }
    void AddFavorite(Favorite favorite);
    void AddBookingCancellation(BookingCancellation cancellation);
    void AddPayment(BookingPayment payment);
    void AddUserAddress(UserAddress userAddress);
    void AddVerification(Verification verification);
    void AddDriver(Driver driver);
    void AddDriverProfile(DriverProfile driverProfile);
    void AddVehicleImage(VehicleImage image);
    void RemoveVehicleImages(IEnumerable<VehicleImage> images);
    void RemoveVehicleFeatures(IEnumerable<VehicleFeature> features);
    void AddVehicleFeatures(IEnumerable<VehicleFeature> features);
    void AddSystemSetting(SystemSetting setting);
    void AddVehicleInspection(VehicleInspection inspection);
    void AddCategory(Category category);
    void RemoveCategory(Category category);
    void AddPromotion(Promotion promotion);
    void RemovePromotion(Promotion promotion);
    void AddCategoryOffer(CategoryOffer offer);
    void RemoveCategoryOffer(CategoryOffer offer);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
