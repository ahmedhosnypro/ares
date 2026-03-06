using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Domain.Entities.Enums;

namespace Backend.Domain.Entities
{
    public class PaymentMethod : AuditableEntity
    {

        [Required]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public ApplicationUser? User { get; set; }

        public PaymentType PaymentType { get; set; }

        [Required]
        [MaxLength(500)]
        public string TokenizedData { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string DisplayName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string MaskedDetails { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? CardBrand { get; set; }

        public byte? ExpirationMonth { get; set; }

        public short? ExpirationYear { get; set; }

        public Guid? BillingAddressId { get; set; }[ForeignKey(nameof(BillingAddressId))]
        public UserAddress? BillingAddress { get; set; }

        public bool IsDefault { get; set; } = false;

        public bool IsExpired { get; set; } = false;

        public bool IsVerified { get; set; } = false;



        public DateTime? DeletedAt { get; set; }
    }
}
