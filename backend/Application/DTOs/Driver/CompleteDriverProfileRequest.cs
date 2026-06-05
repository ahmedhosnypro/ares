using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Backend.Application.DTOs.Driver
{
    public class CompleteDriverProfileRequest
    {
        [Required]
        [MaxLength(50)]
        public string LicenseNumber { get; set; } = null!;

        [Required]
        public DateTime LicenseExpiryDate { get; set; }

        public IFormFile? LicenseImage { get; set; }
        public IFormFile? NationalIdFrontImage { get; set; }
        public IFormFile? NationalIdBackImage { get; set; }

        [Required]
        [MaxLength(500)]
        public string Address { get; set; } = null!;

        [Required]
        [MaxLength(150)]
        public string EmergencyContactName { get; set; } = null!;

        [Required]
        [MaxLength(30)]
        public string EmergencyContactPhone { get; set; } = null!;

        [Required]
        public List<Guid> ServiceAreaIds { get; set; } = new List<Guid>();
    }
}
