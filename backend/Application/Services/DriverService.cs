using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.UserManagement;
using Backend.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services;

/// <summary>
/// Service implementation for driver management operations (enrichment for admin users list)
/// </summary>
public class DriverService : IDriverService
{
    private readonly IApplicationDbContext _context;

    public DriverService(IApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Enriches driver user records with profile information and aggregate statistics.
    /// Uses batching/projection to avoid N+1 query problem.
    /// </summary>
    public async Task<List<UserManagementDto>> EnrichDriversAsync(
        List<UserManagementDto> users,
        CancellationToken cancellationToken = default)
    {
        if (users == null || users.Count == 0)
        {
            return users ?? new List<UserManagementDto>();
        }

        var userIds = users.Select(u => u.Id).ToList();

        // 1. Batch query Driver Profiles for LicenseNumber, Expiry and Availability
        var profiles = await _context.DriverProfiles
            .Where(dp => userIds.Contains(dp.UserId))
            .Select(dp => new 
            { 
                dp.Id, 
                dp.UserId, 
                dp.LicenseNumber, 
                dp.LicenseExpiryDate,
                dp.Availability 
            })
            .ToDictionaryAsync(dp => dp.UserId, cancellationToken);

        // Extract profile IDs for the next query
        var profileIds = profiles.Values.Select(p => p.Id).ToList();

        // 2. Batch query Driver Reviews for CompletedTrips count (one review per completed trip usually,
        // or we could query Bookings with Completed status. Using DriverReviews as per AdminDriverService pattern)
        var tripCounts = new Dictionary<Guid, int>();
        var assignedCounts = new Dictionary<Guid, int>();
        
        if (profileIds.Any())
        {
            tripCounts = await _context.DriverReviews
                .Where(dr => profileIds.Contains(dr.DriverProfileId))
                .GroupBy(dr => dr.DriverProfileId)
                .Select(g => new { ProfileId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.ProfileId, x => x.Count, cancellationToken);
                
            assignedCounts = await _context.Bookings
                .Where(b => b.AssignedDriverProfileId != null && profileIds.Contains(b.AssignedDriverProfileId.Value))
                .GroupBy(b => b.AssignedDriverProfileId!.Value)
                .Select(g => new { ProfileId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.ProfileId, x => x.Count, cancellationToken);
        }

        // 3. Map to enriched UserManagementDto
        var enrichedUsers = new List<UserManagementDto>();

        foreach (var user in users)
        {
            profiles.TryGetValue(user.Id, out var profile);
            var completedTrips = 0;
            var assignedBookings = 0;

            if (profile != null)
            {
                tripCounts.TryGetValue(profile.Id, out completedTrips);
                assignedCounts.TryGetValue(profile.Id, out assignedBookings);
            }

            var driverDetails = new DriverDetailsDto(
                    LicenseNumber: profile?.LicenseNumber,
                    LicenseExpiryDate: profile?.LicenseExpiryDate?.ToString("yyyy-MM-dd"),
                    Availability: profile?.Availability.ToString() ?? "Unavailable",
                    AssignedBookings: assignedBookings,
                    CompletedTrips: completedTrips
                );

            enrichedUsers.Add(user with { DriverDetails = driverDetails });
        }

        return enrichedUsers;
    }
}
