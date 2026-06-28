using Backend.Application.DTOs.Earnings;
using Backend.Application.Interfaces;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services;

public class DriverEarningsAdminService : IDriverEarningsAdminService
{
    private readonly IApplicationDbContext _context;
    private readonly IPaymobClient _paymobClient;
    private readonly IDriverNotificationService _notificationService;
    private readonly ILogger<DriverEarningsAdminService> _logger;

    public DriverEarningsAdminService(
        IApplicationDbContext context,
        IPaymobClient paymobClient,
        IDriverNotificationService notificationService,
        ILogger<DriverEarningsAdminService> logger)
    {
        _context = context;
        _paymobClient = paymobClient;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<AdminDriverEarningsOverviewDto> GetDriverEarningsOverviewAsync(
        Guid driverProfileId, CancellationToken ct = default)
    {
        _logger.LogInformation("Computing admin earnings overview for driver {DriverProfileId}", driverProfileId);

        var driver = await _context.DriverProfiles
            .AsNoTracking()
            .Where(d => d.Id == driverProfileId)
            .Select(d => new
            {
                d.Id,
                DriverName = d.User != null ? d.User.FirstName + " " + d.User.LastName : string.Empty,
                ProfilePictureUrl = d.User != null ? d.User.ProfileImage : (string?)null,
                HasPaymentInfo = d.PaymentInfo != null,
                IsWalletVerified = d.PaymentInfo != null && d.PaymentInfo.IsVerified
            })
            .FirstOrDefaultAsync(ct);

        if (driver == null)
            throw new InvalidOperationException($"Driver profile {driverProfileId} not found.");

        var earnings = await _context.DriverEarnings
            .AsNoTracking()
            .Where(e => e.DriverProfileId == driverProfileId)
            .ToListAsync(ct);

        var totalEarnings = earnings.Where(e => e.Status != DriverEarningStatus.Reversed).Sum(e => e.NetEarning);
        var availableBalance = earnings.Where(e => e.Status == DriverEarningStatus.Available).Sum(e => e.NetEarning);
        var pendingPayoutAmount = earnings.Where(e => e.Status == DriverEarningStatus.PendingPayout).Sum(e => e.NetEarning);
        var paidOutAmount = earnings.Where(e => e.Status == DriverEarningStatus.Paid).Sum(e => e.NetEarning);
        var completedTripsCount = earnings.Count(e => e.Status != DriverEarningStatus.Reversed);

        return new AdminDriverEarningsOverviewDto(
            DriverProfileId: driverProfileId,
            DriverName: driver.DriverName,
            ProfilePictureUrl: driver.ProfilePictureUrl,
            TotalEarnings: totalEarnings,
            AvailableBalance: availableBalance,
            PendingPayoutAmount: pendingPayoutAmount,
            PaidOutAmount: paidOutAmount,
            CompletedTripsCount: completedTripsCount,
            HasPaymentInfo: driver.HasPaymentInfo,
            IsWalletVerified: driver.IsWalletVerified
        );
    }

    public async Task<IReadOnlyList<AdminDriverPayoutListItemDto>> GetPendingPayoutsAsync(
        CancellationToken ct = default)
    {
        _logger.LogInformation("Fetching pending driver payouts");

        var payouts = await _context.DriverPayouts
            .AsNoTracking()
            .Where(p => p.Status == DriverPayoutStatus.Requested)
            .OrderBy(p => p.RequestedAt)
            .Select(p => new AdminDriverPayoutListItemDto(
                PayoutId: p.Id,
                DriverProfileId: p.DriverProfileId,
                DriverName: p.DriverProfile != null && p.DriverProfile.User != null
                    ? p.DriverProfile.User.FirstName + " " + p.DriverProfile.User.LastName
                    : string.Empty,
                Amount: p.Amount,
                Status: p.Status.ToString(),
                RequestedAt: p.RequestedAt,
                ReviewedAt: p.ReviewedAt,
                ProcessedAt: p.ProcessedAt,
                RejectionReason: p.RejectionReason,
                PaymobTransactionId: p.PaymobTransactionId,
                WalletPhoneNumber: p.DriverProfile != null && p.DriverProfile.PaymentInfo != null
                    ? p.DriverProfile.PaymentInfo.WalletPhoneNumber
                    : null,
                IsWalletVerified: p.DriverProfile != null && p.DriverProfile.PaymentInfo != null
                    && p.DriverProfile.PaymentInfo.IsVerified
            ))
            .ToListAsync(ct);

        return payouts.AsReadOnly();
    }

    public async Task<IReadOnlyList<AdminDriverPayoutListItemDto>> GetPendingVerificationAsync(
        CancellationToken ct = default)
    {
        _logger.LogInformation("Fetching drivers with pending wallet verification");

        var pending = await _context.DriverPaymentInfo
            .AsNoTracking()
            .Where(pi => !pi.IsVerified)
            .OrderBy(pi => pi.CreatedAt)
            .Select(pi => new AdminDriverPayoutListItemDto(
                PayoutId: Guid.Empty,
                DriverProfileId: pi.DriverProfileId,
                DriverName: pi.DriverProfile != null && pi.DriverProfile.User != null
                    ? pi.DriverProfile.User.FirstName + " " + pi.DriverProfile.User.LastName
                    : string.Empty,
                Amount: 0m,
                Status: "PendingVerification",
                RequestedAt: pi.CreatedAt,
                ReviewedAt: (DateTime?)null,
                ProcessedAt: (DateTime?)null,
                RejectionReason: (string?)null,
                PaymobTransactionId: (string?)null,
                WalletPhoneNumber: pi.WalletPhoneNumber,
                IsWalletVerified: false
            ))
            .ToListAsync(ct);

        return pending.AsReadOnly();
    }

    public async Task ApprovePayoutAsync(Guid payoutId, Guid adminUserId, CancellationToken ct = default)
    {
        _logger.LogInformation("Admin {AdminUserId} approving payout {PayoutId}", adminUserId, payoutId);

        var payout = await _context.DriverPayouts
            .Where(p => p.Id == payoutId)
            .FirstOrDefaultAsync(ct);

        if (payout == null)
            throw new InvalidOperationException($"Payout {payoutId} not found.");

        if (payout.Status != DriverPayoutStatus.Requested)
            throw new InvalidOperationException($"Payout {payoutId} is not in Requested status (current: {payout.Status}).");

        var freshPayout = await _context.DriverPayouts
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == payoutId, ct);

        if (freshPayout == null || freshPayout.Status != DriverPayoutStatus.Requested)
        {
            throw new InvalidOperationException($"Payout {payoutId} is no longer in Requested status (current: {freshPayout?.Status}). It may have been approved by another admin.");
        }

        var paymentInfo = await _context.DriverPaymentInfo
            .AsNoTracking()
            .Where(pi => pi.DriverProfileId == payout.DriverProfileId)
            .FirstOrDefaultAsync(ct);

        if (paymentInfo == null || !paymentInfo.IsVerified)
            throw new InvalidOperationException("Driver wallet info is not verified. Verify the wallet before approving.");

        var driverProfile = await _context.DriverProfiles
            .AsNoTracking()
            .Where(d => d.Id == payout.DriverProfileId)
            .Select(d => new { d.UserId })
            .FirstOrDefaultAsync(ct);

        payout.Status = DriverPayoutStatus.Processing;
        payout.ReviewedBy = adminUserId;
        payout.ReviewedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        try
        {
            var amountCents = (long)Math.Round(payout.Amount * 100);
            var authToken = await _paymobClient.GetAuthTokenAsync(ct);
            var result = await _paymobClient.CreateDisbursementAsync(
                authToken, amountCents, paymentInfo.WalletPhoneNumber!, ct);

            if (result.Success)
            {
                payout.Status = DriverPayoutStatus.Completed;
                payout.ProcessedAt = DateTime.UtcNow;
                payout.PaymobTransactionId = result.Id.ToString();
                payout.PaymobPayoutId = result.Id;
                payout.FailureReason = null;

                var linkedEarnings = await _context.DriverEarnings
                    .Where(e => e.PayoutId == payout.Id && e.Status == DriverEarningStatus.PendingPayout)
                    .ToListAsync(ct);

                foreach (var earning in linkedEarnings)
                {
                    earning.Status = DriverEarningStatus.Paid;
                }

                await _context.SaveChangesAsync(ct);

                if (driverProfile != null)
                {
                    await _notificationService.NotifyDriverPayoutCompletedAsync(
                        driverProfile.UserId, payout.Amount, ct);
                }

                _logger.LogInformation("Payout {PayoutId} completed via Paymob (transaction {TransactionId})",
                    payoutId, result.Id);
            }
            else
            {
                payout.Status = DriverPayoutStatus.Failed;
                payout.FailureReason = result.Reason ?? "Paymob disbursement failed";

                var failedEarnings = await _context.DriverEarnings
                    .Where(e => e.PayoutId == payoutId)
                    .ToListAsync(ct);

                foreach (var earning in failedEarnings)
                {
                    earning.Status = DriverEarningStatus.Available;
                    earning.PayoutId = null;
                }

                await _context.SaveChangesAsync(ct);

                _logger.LogWarning("Paymob disbursement failed for payout {PayoutId}: {Reason}",
                    payoutId, result.Reason);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Paymob call failed for payout {PayoutId}", payoutId);
            payout.Status = DriverPayoutStatus.Failed;
            payout.FailureReason = ex.Message;

            var catchEarnings = await _context.DriverEarnings
                .Where(e => e.PayoutId == payoutId)
                .ToListAsync(ct);

            foreach (var earning in catchEarnings)
            {
                earning.Status = DriverEarningStatus.Available;
                earning.PayoutId = null;
            }

            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task RejectPayoutAsync(Guid payoutId, Guid adminUserId, string reason, CancellationToken ct = default)
    {
        _logger.LogInformation("Admin {AdminUserId} rejecting payout {PayoutId}", adminUserId, payoutId);

        var payout = await _context.DriverPayouts
            .Where(p => p.Id == payoutId)
            .FirstOrDefaultAsync(ct);

        if (payout == null)
            throw new InvalidOperationException($"Payout {payoutId} not found.");

        if (payout.Status != DriverPayoutStatus.Requested)
            throw new InvalidOperationException($"Payout {payoutId} is not in Requested status (current: {payout.Status}).");

        var driverProfile = await _context.DriverProfiles
            .AsNoTracking()
            .Where(d => d.Id == payout.DriverProfileId)
            .Select(d => new { d.UserId })
            .FirstOrDefaultAsync(ct);

        payout.Status = DriverPayoutStatus.Rejected;
        payout.ReviewedBy = adminUserId;
        payout.ReviewedAt = DateTime.UtcNow;
        payout.RejectionReason = reason;

        var linkedEarnings = await _context.DriverEarnings
            .Where(e => e.PayoutId == payout.Id && e.Status == DriverEarningStatus.PendingPayout)
            .ToListAsync(ct);

        foreach (var earning in linkedEarnings)
        {
            earning.Status = DriverEarningStatus.Available;
            earning.PayoutId = null;
        }

        await _context.SaveChangesAsync(ct);

        if (driverProfile != null)
        {
            await _notificationService.NotifyDriverPayoutRejectedAsync(
                driverProfile.UserId, payout.Amount, reason, ct);
        }

        _logger.LogInformation("Payout {PayoutId} rejected. {EarningCount} earnings reverted to Available.",
            payoutId, linkedEarnings.Count);
    }

    public async Task RetryFailedPayoutAsync(Guid payoutId, Guid adminUserId, CancellationToken ct = default)
    {
        _logger.LogInformation("Admin {AdminUserId} retrying failed payout {PayoutId}", adminUserId, payoutId);

        var payout = await _context.DriverPayouts
            .Where(p => p.Id == payoutId)
            .FirstOrDefaultAsync(ct);

        if (payout == null)
            throw new InvalidOperationException($"Payout {payoutId} not found.");

        if (payout.Status != DriverPayoutStatus.Failed)
            throw new InvalidOperationException($"Payout {payoutId} is not in Failed status (current: {payout.Status}).");

        var freshPayout = await _context.DriverPayouts
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == payoutId, ct);

        if (freshPayout == null || freshPayout.Status != DriverPayoutStatus.Failed)
        {
            throw new InvalidOperationException($"Payout {payoutId} is no longer in Failed status (current: {freshPayout?.Status}). It may have been retried by another admin.");
        }

        var paymentInfo = await _context.DriverPaymentInfo
            .AsNoTracking()
            .Where(pi => pi.DriverProfileId == payout.DriverProfileId)
            .FirstOrDefaultAsync(ct);

        if (paymentInfo == null || !paymentInfo.IsVerified)
            throw new InvalidOperationException("Driver wallet info is not verified. Verify the wallet before retrying.");

        var driverProfile = await _context.DriverProfiles
            .AsNoTracking()
            .Where(d => d.Id == payout.DriverProfileId)
            .Select(d => new { d.UserId })
            .FirstOrDefaultAsync(ct);

        payout.Status = DriverPayoutStatus.Processing;
        payout.FailureReason = null;
        await _context.SaveChangesAsync(ct);

        try
        {
            var amountCents = (long)Math.Round(payout.Amount * 100);
            var authToken = await _paymobClient.GetAuthTokenAsync(ct);
            var result = await _paymobClient.CreateDisbursementAsync(
                authToken, amountCents, paymentInfo.WalletPhoneNumber!, ct);

            if (result.Success)
            {
                payout.Status = DriverPayoutStatus.Completed;
                payout.ProcessedAt = DateTime.UtcNow;
                payout.PaymobTransactionId = result.Id.ToString();
                payout.PaymobPayoutId = result.Id;
                payout.FailureReason = null;

                var linkedEarnings = await _context.DriverEarnings
                    .Where(e => e.PayoutId == payout.Id && e.Status == DriverEarningStatus.PendingPayout)
                    .ToListAsync(ct);

                foreach (var earning in linkedEarnings)
                {
                    earning.Status = DriverEarningStatus.Paid;
                }

                await _context.SaveChangesAsync(ct);

                if (driverProfile != null)
                {
                    await _notificationService.NotifyDriverPayoutCompletedAsync(
                        driverProfile.UserId, payout.Amount, ct);
                }

                _logger.LogInformation("Retry of payout {PayoutId} completed via Paymob (transaction {TransactionId})",
                    payoutId, result.Id);
            }
            else
            {
                payout.Status = DriverPayoutStatus.Failed;
                payout.FailureReason = result.Reason ?? "Paymob disbursement failed";

                var retryFailedEarnings = await _context.DriverEarnings
                    .Where(e => e.PayoutId == payoutId)
                    .ToListAsync(ct);

                foreach (var earning in retryFailedEarnings)
                {
                    earning.Status = DriverEarningStatus.Available;
                    earning.PayoutId = null;
                }

                await _context.SaveChangesAsync(ct);

                _logger.LogWarning("Paymob disbursement retry failed for payout {PayoutId}: {Reason}",
                    payoutId, result.Reason);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Paymob call failed during retry for payout {PayoutId}", payoutId);
            payout.Status = DriverPayoutStatus.Failed;
            payout.FailureReason = ex.Message;

            var retryCatchEarnings = await _context.DriverEarnings
                .Where(e => e.PayoutId == payoutId)
                .ToListAsync(ct);

            foreach (var earning in retryCatchEarnings)
            {
                earning.Status = DriverEarningStatus.Available;
                earning.PayoutId = null;
            }

            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task VerifyWalletInfoAsync(Guid driverProfileId, CancellationToken ct = default)
    {
        _logger.LogInformation("Verifying wallet info for driver {DriverProfileId}", driverProfileId);

        var paymentInfo = await _context.DriverPaymentInfo
            .Where(pi => pi.DriverProfileId == driverProfileId)
            .FirstOrDefaultAsync(ct);

        if (paymentInfo == null)
            throw new InvalidOperationException($"Payment info not found for driver {driverProfileId}.");

        paymentInfo.IsVerified = true;
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Wallet info verified for driver {DriverProfileId}", driverProfileId);
    }

    public async Task<IReadOnlyList<DriverEarningRowDto>> GetDriverEarningsHistoryAsync(
        Guid driverProfileId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        var earnings = await _context.DriverEarnings
            .AsNoTracking()
            .Where(e => e.DriverProfileId == driverProfileId)
            .OrderByDescending(e => e.EarnedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new DriverEarningRowDto(
                BookingId: e.BookingId,
                BookingNumber: e.Booking != null ? e.Booking.BookingNumber : string.Empty,
                CompletedAt: e.EarnedAt,
                GrossEarning: e.GrossEarning,
                PlatformDeduction: e.PlatformDeduction,
                NetEarning: e.NetEarning,
                Status: e.Status
            ))
            .ToListAsync(ct);

        return earnings.AsReadOnly();
    }

    public async Task<PlatformDriverEarningsSummaryDto> GetPlatformEarningsSummaryAsync(
        CancellationToken ct = default)
    {
        _logger.LogInformation("Computing platform-wide driver earnings summary");

        var earnings = await _context.DriverEarnings
            .AsNoTracking()
            .ToListAsync(ct);

        var totalDriverEarnings = earnings.Where(e => e.Status != DriverEarningStatus.Reversed).Sum(e => e.NetEarning);
        var totalPlatformDeduction = earnings.Where(e => e.Status != DriverEarningStatus.Reversed).Sum(e => e.PlatformDeduction);

        var completedPayouts = await _context.DriverPayouts
            .AsNoTracking()
            .Where(p => p.Status == DriverPayoutStatus.Completed)
            .SumAsync(p => p.Amount, ct);

        var pendingPayouts = await _context.DriverPayouts
            .AsNoTracking()
            .Where(p => p.Status == DriverPayoutStatus.Requested)
            .SumAsync(p => p.Amount, ct);

        var activeDriverCount = await _context.DriverProfiles
            .AsNoTracking()
            .Where(d => d.IsActive && d.Status == DriverProfileStatus.Verified)
            .CountAsync(ct);

        var pendingPayoutRequests = await _context.DriverPayouts
            .AsNoTracking()
            .CountAsync(p => p.Status == DriverPayoutStatus.Requested, ct);

        var pendingWalletVerifications = await _context.DriverPaymentInfo
            .AsNoTracking()
            .CountAsync(pi => !pi.IsVerified, ct);

        return new PlatformDriverEarningsSummaryDto(
            TotalDriverEarnings: totalDriverEarnings,
            TotalPlatformDeduction: totalPlatformDeduction,
            TotalPayoutsCompleted: completedPayouts,
            TotalPendingPayouts: pendingPayouts,
            TotalActiveDrivers: activeDriverCount,
            PendingPayoutRequests: pendingPayoutRequests,
            PendingWalletVerifications: pendingWalletVerifications
        );
    }
}
