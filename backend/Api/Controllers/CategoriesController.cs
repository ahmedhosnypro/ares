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
                .Include(c => c.Offers)
                .OrderBy(c => c.Name)
                .Select(c => new CategoryResponseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    CommissionPercentage = c.CommissionPercentage,
                    IsActive = c.IsActive,
                    VehicleCount = _context.Vehicles.Count(v => v.CategoryId == c.Id),
                    ActiveOffer = c.Offers.Where(o => o.IsActive && o.EndDate >= DateTime.UtcNow)
                        .OrderByDescending(o => o.CreatedAt)
                        .Select(o => new CategoryOfferDto
                        {
                            OfferName = o.OfferName,
                            DiscountPercentage = o.DiscountPercentage,
                            StartDate = o.StartDate,
                            EndDate = o.EndDate,
                            IsActive = o.IsActive
                        }).FirstOrDefault()
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

            if (request.OfferDiscountPercentage.HasValue && request.OfferDiscountPercentage.Value > 0)
            {
                category.Offers.Add(new CategoryOffer
                {
                    Id = Guid.NewGuid(),
                    CategoryId = category.Id,
                    OfferName = request.OfferName ?? "Special Offer",
                    DiscountPercentage = request.OfferDiscountPercentage.Value,
                    StartDate = request.OfferStartDate ?? DateTime.UtcNow,
                    EndDate = request.OfferEndDate ?? DateTime.UtcNow.AddMonths(1),
                    IsActive = request.OfferIsActive ?? true
                });
            }

            _context.AddCategory(category);
            await _context.SaveChangesAsync(cancellationToken);

            var response = await GetCategoryResponseAsync(category.Id, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CategoryDto request, CancellationToken cancellationToken)
        {
            var category = await _context.Categories
                .Include(c => c.Offers)
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
            if (category == null) return NotFound();

            category.Name = request.Name;
            category.Description = request.Description;
            category.CommissionPercentage = request.CommissionPercentage;
            category.IsActive = request.IsActive;

            // Handle Offer Update
            if (request.OfferDiscountPercentage.HasValue)
            {
                var currentOffer = category.Offers.FirstOrDefault(o => o.IsActive);
                if (currentOffer != null)
                {
                    currentOffer.OfferName = request.OfferName ?? currentOffer.OfferName;
                    currentOffer.DiscountPercentage = request.OfferDiscountPercentage.Value;
                    currentOffer.StartDate = request.OfferStartDate ?? currentOffer.StartDate;
                    currentOffer.EndDate = request.OfferEndDate ?? currentOffer.EndDate;
                    currentOffer.IsActive = request.OfferIsActive ?? currentOffer.IsActive;
                }
                else if (request.OfferDiscountPercentage.Value > 0)
                {
                    var newOffer = new CategoryOffer
                    {
                        Id = Guid.NewGuid(),
                        CategoryId = category.Id,
                        OfferName = request.OfferName ?? "Special Offer",
                        DiscountPercentage = request.OfferDiscountPercentage.Value,
                        StartDate = request.OfferStartDate ?? DateTime.UtcNow,
                        EndDate = request.OfferEndDate ?? DateTime.UtcNow.AddMonths(1),
                        IsActive = request.OfferIsActive ?? true
                    };
                    _context.AddCategoryOffer(newOffer);
                }
            }
            else
            {
                // Deactivate current offer if discount is cleared
                var currentOffer = category.Offers.FirstOrDefault(o => o.IsActive);
                if (currentOffer != null)
                {
                    currentOffer.IsActive = false;
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            var response = await GetCategoryResponseAsync(category.Id, cancellationToken);
            return Ok(response);
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
                    ActiveOffer = c.Offers.Where(o => o.IsActive && o.EndDate >= DateTime.UtcNow).OrderByDescending(o => o.CreatedAt).Select(o => new
                    {
                        o.OfferName,
                        o.DiscountPercentage,
                        o.StartDate,
                        o.EndDate,
                        o.IsActive
                    }).FirstOrDefault(),
                    Vehicles = _context.Vehicles.Where(v => v.CategoryId == c.Id).Select(v => new { v.Id, v.Make, v.Model, v.LicensePlate }),
                    VehicleCount = _context.Vehicles.Count(v => v.CategoryId == c.Id),
                    BookingCount = _context.Bookings.Count(b => b.Vehicle!.CategoryId == c.Id),
                    Revenue = _context.Payments.Where(p => p.Booking!.Vehicle!.CategoryId == c.Id && p.Status == "Captured").Sum(p => (decimal?)p.Amount) ?? 0m
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

        private async Task<CategoryResponseDto?> GetCategoryResponseAsync(Guid id, CancellationToken cancellationToken)
        {
            return await _context.Categories
                .Where(c => c.Id == id)
                .Select(c => new CategoryResponseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    CommissionPercentage = c.CommissionPercentage,
                    IsActive = c.IsActive,
                    VehicleCount = _context.Vehicles.Count(v => v.CategoryId == c.Id),
                    ActiveOffer = c.Offers.Where(o => o.IsActive && o.EndDate >= DateTime.UtcNow)
                        .OrderByDescending(o => o.CreatedAt)
                        .Select(o => new CategoryOfferDto
                        {
                            OfferName = o.OfferName,
                            DiscountPercentage = o.DiscountPercentage,
                            StartDate = o.StartDate,
                            EndDate = o.EndDate,
                            IsActive = o.IsActive
                        }).FirstOrDefault()
                })
                .FirstOrDefaultAsync(cancellationToken);
        }
    }

    public class CategoryResponseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal CommissionPercentage { get; set; }
        public bool IsActive { get; set; }
        public int VehicleCount { get; set; }
        public CategoryOfferDto? ActiveOffer { get; set; }
    }

    public class CategoryOfferDto
    {
        public string OfferName { get; set; } = string.Empty;
        public decimal DiscountPercentage { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
    }

    public class CategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal CommissionPercentage { get; set; }
        public bool IsActive { get; set; } = true;

        // Offer Fields
        public string? OfferName { get; set; }
        public decimal? OfferDiscountPercentage { get; set; }
        public DateTime? OfferStartDate { get; set; }
        public DateTime? OfferEndDate { get; set; }
        public bool? OfferIsActive { get; set; }
    }

    public class BulkAssignDto
    {
        public Guid CategoryId { get; set; }
        public List<Guid> VehicleIds { get; set; } = new List<Guid>();
    }
}
