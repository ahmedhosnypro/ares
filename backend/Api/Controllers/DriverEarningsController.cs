using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Earnings;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers
{
    /// <summary>
    /// Controller for driver earnings endpoints.
    /// </summary>
    [Authorize(Roles = "Driver")]
    [Route("api/driver/earnings")]
    [ApiController]
    public class DriverEarningsController : ControllerBase
    {
        private readonly IDriverEarningsService _earningsService;

        public DriverEarningsController(IDriverEarningsService earningsService)
        {
            _earningsService = earningsService;
        }

        /// <summary>
        /// Gets earnings statistics for the driver dashboard.
        /// </summary>
        [HttpGet("stats")]
        public async Task<ActionResult<DriverEarningsStatsDto>> GetStats(CancellationToken cancellationToken)
        {
            var driverProfileId = Guid.Parse(User.FindFirst("profileId")?.Value ?? Guid.Empty.ToString());
            return Ok(await _earningsService.GetStatsAsync(driverProfileId, cancellationToken));
        }

        /// <summary>
        /// Gets monthly earnings data for the chart.
        /// </summary>
        [HttpGet("chart")]
        public async Task<ActionResult<IReadOnlyList<DriverMonthlyEarningPointDto>>> GetMonthlyChart([FromQuery] int year, CancellationToken cancellationToken)
        {
            var driverProfileId = Guid.Parse(User.FindFirst("profileId")?.Value ?? Guid.Empty.ToString());
            return Ok(await _earningsService.GetMonthlyChartAsync(driverProfileId, year, cancellationToken));
        }

        /// <summary>
        /// Gets top 5 highest-earning bookings.
        /// </summary>
        [HttpGet("top-bookings")]
        public async Task<ActionResult<IReadOnlyList<DriverTopBookingDto>>> GetTopBookings(CancellationToken cancellationToken)
        {
            var driverProfileId = Guid.Parse(User.FindFirst("profileId")?.Value ?? Guid.Empty.ToString());
            return Ok(await _earningsService.GetTopBookingsAsync(driverProfileId, cancellationToken));
        }

        /// <summary>
        /// Gets paginated earnings history.
        /// </summary>
        [HttpGet("history")]
        public async Task<ActionResult<IReadOnlyList<DriverEarningRowDto>>> GetEarningsHistory([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
        {
            var driverProfileId = Guid.Parse(User.FindFirst("profileId")?.Value ?? Guid.Empty.ToString());
            return Ok(await _earningsService.GetEarningsHistoryAsync(driverProfileId, pageNumber, pageSize, cancellationToken));
        }

        /// <summary>
        /// Requests a payout of available balance.
        /// </summary>
        [HttpPost("payout")]
        public async Task<ActionResult<DriverPayoutDto>> RequestPayout([FromBody] DriverPayoutRequestDto request, CancellationToken cancellationToken)
        {
            var driverProfileId = Guid.Parse(User.FindFirst("profileId")?.Value ?? Guid.Empty.ToString());
            return Ok(await _earningsService.RequestPayoutAsync(driverProfileId, request, cancellationToken));
        }

        /// <summary>
        /// Gets payout history for the driver.
        /// </summary>
        [HttpGet("payouts")]
        public async Task<ActionResult<IReadOnlyList<DriverPayoutDto>>> GetPayoutHistory(CancellationToken cancellationToken)
        {
            var driverProfileId = Guid.Parse(User.FindFirst("profileId")?.Value ?? Guid.Empty.ToString());
            return Ok(await _earningsService.GetPayoutHistoryAsync(driverProfileId, cancellationToken));
        }
    }
}