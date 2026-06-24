namespace Backend.Application.DTOs.Booking;

public class BookingStatusAnalyticsDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class AdminBookingAnalyticsDto
{
    public List<BookingStatusAnalyticsDto> StatusDistribution { get; set; } = new();
    public int ActiveBookings { get; set; }
    public int PickupQueue { get; set; }
    public int ReturnQueue { get; set; }
    public int UpcomingPickups { get; set; }
}
