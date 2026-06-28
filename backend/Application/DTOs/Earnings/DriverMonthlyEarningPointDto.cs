namespace Backend.Application.DTOs.Earnings
{
    /// <summary>
    /// Monthly earnings datapoint for the chart.
    /// </summary>
    public record DriverMonthlyEarningPointDto(
        string Month,
        int MonthNumber,
        int Year,
        decimal Earnings
    );
}