using System;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Application.Interfaces
{
    public interface IDiscountApplicationService
    {
        Task<BookingDiscountResult> ApplyDiscountToBookingAsync(
            Guid bookingId,
            string code,
            Guid customerId,
            CancellationToken cancellationToken = default);
    }

    public class BookingDiscountResult
    {
        public bool Success { get; set; }
        public Guid BookingId { get; set; }
        public decimal? DiscountApplied { get; set; }
        public decimal? OriginalPrice { get; set; }
        public decimal? FinalPrice { get; set; }
        public string? ErrorMessage { get; set; }

        public static BookingDiscountResult Successful(Guid bookingId, decimal discountApplied, decimal originalPrice, decimal finalPrice)
        {
            return new BookingDiscountResult
            {
                Success = true,
                BookingId = bookingId,
                DiscountApplied = discountApplied,
                OriginalPrice = originalPrice,
                FinalPrice = finalPrice
            };
        }

        public static BookingDiscountResult Error(string message)
        {
            return new BookingDiscountResult
            {
                Success = false,
                ErrorMessage = message
            };
        }
    }
}
