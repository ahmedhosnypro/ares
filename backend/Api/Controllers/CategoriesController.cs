using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Api.Controllers
{
    [ApiController]
    [Route("api/admin/categories")]
    [Authorize(Roles = "Admin")]
    public class CategoriesController : ControllerBase
    {
        private readonly IApplicationDbContext _context;

        public CategoriesController(IApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
        {
            var categories = await _context.Categories
                .OrderBy(c => c.Name)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Description,
                    c.CommissionPercentage,
                    c.IsActive,
                    VehicleCount = _context.Vehicles.Count(v => v.CategoryId == c.Id)
                })
                .ToListAsync(cancellationToken);

            return Ok(categories);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CategoryDto request, CancellationToken cancellationToken)
        {
            var category = new Category
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                CommissionPercentage = request.CommissionPercentage,
                IsActive = request.IsActive
            };

            _context.AddCategory(category);
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(category);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CategoryDto request, CancellationToken cancellationToken)
        {
            var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
            if (category == null) return NotFound();

            category.Name = request.Name;
            category.Description = request.Description;
            category.CommissionPercentage = request.CommissionPercentage;
            category.IsActive = request.IsActive;

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(category);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            var category = await _context.Categories
                .Include(c => c.Vehicles)
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
            
            if (category == null) return NotFound();

            if (category.Vehicles.Any())
            {
                return BadRequest(new { message = "Cannot delete a category that contains vehicles." });
            }

            _context.RemoveCategory(category);
            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        [HttpGet("{id}/details")]
        public async Task<IActionResult> GetDetails(Guid id, CancellationToken cancellationToken)
        {
            var category = await _context.Categories
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Description,
                    c.CommissionPercentage,
                    c.IsActive,
                    Vehicles = _context.Vehicles.Where(v => v.CategoryId == c.Id).Select(v => new { v.Id, v.Make, v.Model, v.LicensePlate }),
                    VehicleCount = _context.Vehicles.Count(v => v.CategoryId == c.Id),
                    BookingCount = _context.Bookings.Count(b => b.Vehicle.CategoryId == c.Id),
                    Revenue = _context.Payments.Where(p => p.Booking.Vehicle.CategoryId == c.Id && p.Status == "Succeeded").Sum(p => (decimal?)p.Amount) ?? 0m
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (category == null) return NotFound();

            return Ok(category);
        }

        [HttpPost("bulk-assign")]
        public async Task<IActionResult> BulkAssign([FromBody] BulkAssignDto request, CancellationToken cancellationToken)
        {
            var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == request.CategoryId, cancellationToken);
            if (category == null) return NotFound(new { message = "Category not found" });

            var vehicles = await _context.Vehicles.Where(v => request.VehicleIds.Contains(v.Id)).ToListAsync(cancellationToken);
            foreach (var vehicle in vehicles)
            {
                vehicle.CategoryId = request.CategoryId;
            }

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new { message = $"Successfully assigned {vehicles.Count} vehicles to {category.Name}." });
        }
    }

    public class CategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal CommissionPercentage { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class BulkAssignDto
    {
        public Guid CategoryId { get; set; }
        public List<Guid> VehicleIds { get; set; } = new List<Guid>();
    }
}
