using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Domain.Entities
{
    public class CompanyProfile : AuditableEntity
    {
        public Guid UserId { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string CompanyName { get; set; } = string.Empty;
        
        [MaxLength(100)]
        public string? CommercialRegistrationNumber { get; set; }
        
        [MaxLength(100)]
        public string? TaxId { get; set; }
    }
}
