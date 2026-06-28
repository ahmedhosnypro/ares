using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Api.Controllers
{
    [ApiController]
    [Route("api/admin/commission")]
    [Authorize(Roles = "Admin")]
    public class AdminCommissionController : ControllerBase
    {
        private readonly IApplicationDbContext _context;

        public AdminCommissionController(IApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("global")]
        public async Task<IActionResult> GetGlobalCommission(CancellationToken cancellationToken)
        {
            var setting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.Key == "GlobalCommissionPercentage", cancellationToken);

            decimal percentage = 10.0m; // Default
            if (setting != null && decimal.TryParse(setting.Value, out var parsed))
            {
                percentage = parsed;
            }

            return Ok(new { GlobalCommissionPercentage = percentage });
        }

        [HttpPut("global")]
        public async Task<IActionResult> UpdateGlobalCommission([FromBody] UpdateGlobalCommissionRequest request, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var setting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.Key == "GlobalCommissionPercentage", cancellationToken);

            if (setting == null)
            {
                setting = new SystemSetting
                {
                    Key = "GlobalCommissionPercentage",
                    Value = request.Percentage.ToString()
                };
                _context.AddSystemSetting(setting);
            }
            else
            {
                setting.Value = request.Percentage.ToString();
            }

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new { GlobalCommissionPercentage = request.Percentage });
        }
        [HttpGet("driver-global")]
        public async Task<IActionResult> GetDriverGlobalCommission(CancellationToken cancellationToken)
        {
            var setting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.Key == "driver.commission_percentage", cancellationToken);

            decimal percentage = 0.0m;
            if (setting != null && decimal.TryParse(setting.Value, out var parsed))
            {
                percentage = parsed;
            }

            return Ok(new { DriverCommissionPercentage = percentage });
        }

        [HttpPut("driver-global")]
        public async Task<IActionResult> UpdateDriverGlobalCommission([FromBody] UpdateDriverCommissionRequest request, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var setting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.Key == "driver.commission_percentage", cancellationToken);

            if (setting == null)
            {
                setting = new SystemSetting
                {
                    Key = "driver.commission_percentage",
                    Value = request.Percentage.ToString()
                };
                _context.AddSystemSetting(setting);
            }
            else
            {
                setting.Value = request.Percentage.ToString();
            }

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new { DriverCommissionPercentage = request.Percentage });
        }
    }

    public class UpdateGlobalCommissionRequest
    {
        [Required]
        [Range(0, 100)]
        public decimal Percentage { get; set; }
    }

    public class UpdateDriverCommissionRequest
    {
        [Required]
        [Range(0, 100)]
        public decimal Percentage { get; set; }
    }
}
