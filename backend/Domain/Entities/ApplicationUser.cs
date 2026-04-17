using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using Backend.Domain.Entities.Enums;
using System;

namespace Backend.Domain.Entities
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        // PhoneNumber is inherited from IdentityUser

        [MaxLength(50)]
        public string? NationalId { get; set; }

        public string? NationalIdImage { get; set; }

        [MaxLength(50)]
        public string? Status { get; set; }

        public string? ProfileImage { get; set; }

        public DateTime? DateOfBirth { get; set; }

        [MaxLength(10)]
        public string LanguagePreference { get; set; } = "en";

        [MaxLength(10)]
        public string CurrencyPreference { get; set; } = "USD";

        // Emergency contact — stored as owned type (same table)
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
        public string? EmergencyContactRelationship { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual CompanyProfile? CompanyProfile { get; set; }
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public virtual List<RefreshToken> RefreshTokens { get; set; } = new();
    }
}
