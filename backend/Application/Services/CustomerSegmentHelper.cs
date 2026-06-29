using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services;

internal static class CustomerSegmentHelper
{
    public static async Task<string> DetermineSegmentAsync(
        IApplicationDbContext context,
        Guid customerId,
        CancellationToken cancellationToken)
    {
        var cutoff = DateTime.UtcNow.AddMonths(-12);
        var completedBookings = await context.Bookings
            .CountAsync(b => b.UserId == customerId &&
                (b.Status == BookingStatus.Completed ||
                 b.Status == BookingStatus.Confirmed ||
                 b.Status == BookingStatus.Active) &&
                b.CreatedAt >= cutoff, cancellationToken);

        return completedBookings == 0 ? "new" : "returning";
    }

    public static List<string> ParseSegments(string segmentsJson)
    {
        try
        {
            var segments = JsonSerializer.Deserialize<List<string>>(segmentsJson);
            return segments ?? new List<string> { "all" };
        }
        catch
        {
            return new List<string> { "all" };
        }
    }
}
