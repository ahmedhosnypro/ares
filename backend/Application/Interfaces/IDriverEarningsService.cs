using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Earnings;
using Backend.Domain.Entities;

namespace Backend.Application.Interfaces
{
    /// <summary>
    /// Service for driver earnings management.
    /// Mirrors the supplier earnings pattern.
    /// </summary>
    public interface IDriverEarningsService
    {
        /// <summary>
        /// Gets summary statistics for the driver dashboard.
        /// </summary>
        Task<DriverEarningsStatsDto> GetStatsAsync(Guid driverProfileId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets monthly earnings data for the chart.
        /// </summary>
        Task<IReadOnlyList<DriverMonthlyEarningPointDto>> GetMonthlyChartAsync(Guid driverProfileId, int year, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets top 5 highest-earning bookings.
        /// </summary>
        Task<IReadOnlyList<DriverTopBookingDto>> GetTopBookingsAsync(Guid driverProfileId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets paginated earnings history.
        /// </summary>
        Task<IReadOnlyList<DriverEarningRowDto>> GetEarningsHistoryAsync(Guid driverProfileId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets total number of earnings entries for pagination.
        /// </summary>
        Task<int> GetEarningsCountAsync(Guid driverProfileId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Requests a payout of available balance.
        /// </summary>
        Task<DriverPayoutDto> RequestPayoutAsync(Guid driverProfileId, DriverPayoutRequestDto request, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets payout history for the driver.
        /// </summary>
        Task<IReadOnlyList<DriverPayoutDto>> GetPautHistoryAsync(Guid driverProfileId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Creates an earning record for a completed booking.
        /// </summary>
        Task CreateEarningForBookingAsync(Booking booking, CancellationToken cancellationToken = default);

        /// <summary>
        /// Reverses an earning if the booking is cancelled/refunded.
        /// </summary>
        Task ReverseEarningForBookingAsync(Guid bookingId, CancellationToken cancellationToken = default);
    }
}
