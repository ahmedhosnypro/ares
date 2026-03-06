using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using Backend.Domain.Entities.Enums;
using System;
using System.ComponentModel.DataAnnotations.Schema;

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

        public Guid? RoleId { get; set; }

        [MaxLength(50)]
        public string? Status { get; set; }

        public string? ProfileImage { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
