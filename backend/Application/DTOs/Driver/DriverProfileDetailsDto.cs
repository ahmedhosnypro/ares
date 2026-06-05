using System;
using System.Collections.Generic;
using Backend.Domain.Entities.Enums;

namespace Backend.Application.DTOs.Driver
{
    public class DriverProfileDetailsDto
    {
        public Guid UserId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ProfilePictureUrl { get; set; }
        
        public string? LicenseNumber { get; set; }
        public DateTime? LicenseExpiryDate { get; set; }
        public string? LicenseImage { get; set; }
        
        public string? NationalIdFrontImage { get; set; }
        public string? NationalIdBackImage { get; set; }
        
        public string? Address { get; set; }
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
        
        public DriverProfileStatus Status { get; set; }
        public DriverAvailability Availability { get; set; }
        public bool IsActive { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime? LockedUntil { get; set; }
        
        public List<ServiceAreaDto> WorkAreas { get; set; } = new List<ServiceAreaDto>();
    }
}
