using System;
using System.Collections.Generic;

namespace Backend.Application.DTOs.Dashboard
{
    public record FinancialReportDto(
        decimal TotalRevenue,
        decimal TotalRevenueChange,
        decimal PaidAmount,
        decimal PaidAmountChange,
        decimal PendingAmount,
        decimal PendingAmountChange,
        decimal RefundedAmount,
        decimal RefundedAmountChange,
        IReadOnlyList<BookingSummaryItemDto> BookingSummary,
        IReadOnlyList<MonthlyRevenuePointDto> MonthlyRevenue,
        IReadOnlyList<PaymentMethodSummaryDto> PaymentMethods,
        IReadOnlyList<RecentPaymentDto> RecentPayments,
        IReadOnlyList<FinancialTopVehicleDto> TopVehicles,
        IReadOnlyList<SupplierEarningItemDto> SupplierEarnings
    );

    public record BookingSummaryItemDto(
        string Status,
        int Bookings,
        decimal Amount,
        decimal Percentage
    );

    public record MonthlyRevenuePointDto(
        string Month,
        decimal Revenue
    );

    public record PaymentMethodSummaryDto(
        string Method,
        int Count,
        decimal PaidAmount,
        decimal Amount,
        decimal Percentage
    );

    public record RecentPaymentDto(
        string BookingNumber,
        string CustomerName,
        string VehicleName,
        decimal Amount,
        string Method,
        string Status,
        DateTime Date
    );

    public record FinancialTopVehicleDto(
        int Rank,
        string VehicleName,
        int CompletedBookings,
        decimal Revenue,
        string? ImageUrl
    );

    public record SupplierEarningItemDto(
        string SupplierName,
        int TotalVehicles,
        int CompletedBookings,
        decimal Revenue,
        decimal Commission,
        decimal NetAmount
    );
}
