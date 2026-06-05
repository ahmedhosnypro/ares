using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.Driver
{
    public class AdminApproveDriverRequest
    {
        // Placeholder for any specific approval parameters
    }
    
    public class AdminRejectDriverRequest
    {
        [Required]
        [MaxLength(500)]
        public string RejectionReason { get; set; } = null!;
    }
}
