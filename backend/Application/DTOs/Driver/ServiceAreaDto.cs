using System;

namespace Backend.Application.DTOs.Driver
{
    public class ServiceAreaDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Governorate { get; set; }
        public bool IsActive { get; set; }
    }
}
