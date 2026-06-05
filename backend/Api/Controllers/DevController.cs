using System.Threading.Tasks;
using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Backend.Infrastructure.Data.SeedData;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DevController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<DevController> _logger;

    public DevController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        ILogger<DevController> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    [HttpPost("seed-operational")]
    public async Task<IActionResult> SeedOperational()
    {
        await OperationalDataSeeder.SeedAsync(_context, _userManager, _logger);
        return Ok(new { message = "Operational data seeded successfully" });
    }
}
