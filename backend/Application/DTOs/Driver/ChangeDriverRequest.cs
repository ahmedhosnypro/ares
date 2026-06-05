using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.Driver
{
    public class ChangeDriverRequest
    {
        [Required]
        public string Reason { get; set; } = null!;
    }
}
