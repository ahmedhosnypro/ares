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
using Backend.Application.DTOs.Common;

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
                .Select(c => new CategoryResponseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    CommissionPercentage = c.CommissionPercentage,
                    IsActive = c.IsActive,
                    VehicleCount = _context.Vehicles.Count(v => v.CategoryId == c.Id)
                })
                .ToListAsync(cancellationToken);

            return Ok(categories);
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
        {
            var totalCategories = await _context.Categories.CountAsync(cancellationToken);
            var totalVehicles = await _context.Vehicles.CountAsync(cancellationToken);
            var categoriesWithOffers = await _context.DiscountVehicleCategories
                .Select(dvc => dvc.CategoryId)
                .Distinct()
                .CountAsync(cancellationToken);

            var averageCommission = totalCategories > 0
                ? await _context.Categories.AverageAsync(c => c.CommissionPercentage, cancellationToken)
                : 0;

            return Ok(new AdminCategoryStatsDto
            {
                TotalCategories = totalCategories,
                TotalVehicles = totalVehicles,
                CategoriesWithOffers = categoriesWithOffers,
                AverageCommission = averageCommission
            });
        }

        [HttpGet("search")]
        public async Task<ActionResult<PagedResult<AdminCategoryListDto>>> Search(
            [FromQuery] string? search,
            [FromQuery] string? status,
            [FromQuery] string? offer,
            [FromQuery] string? sortBy,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Categories
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(c => c.Name.ToLower().Contains(lowerSearch) || (c.Description != null && c.Description.ToLower().Contains(lowerSearch)));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                if (status.Equals("Active", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(c => c.IsActive);
                }
                else if (status.Equals("Inactive", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(c => !c.IsActive);
                }
            }

            var now = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(offer))
            {
                if (offer.Equals("Active Offer", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(c => c.DiscountVehicleCategories.Any(dvc => dvc.Discount!.IsActive && dvc.Discount.ValidTo >= now));
                }
                else if (offer.Equals("No offer", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(c => !c.DiscountVehicleCategories.Any());
                }
                else if (offer.Equals("Expired Offer", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(c => c.DiscountVehicleCategories.Any() && !c.DiscountVehicleCategories.Any(dvc => dvc.Discount!.IsActive && dvc.Discount!.ValidTo >= now));
                }
            }

            var projectedQuery = query.Select(c => new
            {
                Category = c,
                VehicleCount = c.Vehicles.Count(),
                LatestDiscount = c.DiscountVehicleCategories
                    .Where(dvc => dvc.Discount!.IsActive && dvc.Discount.ValidTo >= now)
                    .OrderByDescending(dvc => dvc.Discount!.CreatedAt)
                    .Select(dvc => new { dvc.Discount!.Code, dvc.Discount.DiscountValue, EndDate = dvc.Discount.ValidTo, dvc.Discount.IsActive, dvc.Discount.CreatedAt })
                    .FirstOrDefault()
            });

            projectedQuery = sortBy switch
            {
                "Name Z-A" => projectedQuery.OrderByDescending(x => x.Category.Name),
                "Vehicles Count" => projectedQuery.OrderByDescending(x => x.VehicleCount),
                "Commission" => projectedQuery.OrderByDescending(x => x.Category.CommissionPercentage),
                "Created Date" => projectedQuery.OrderByDescending(x => x.Category.CreatedAt),
                _ => projectedQuery.OrderBy(x => x.Category.Name)
            };

            var totalCount = await projectedQuery.CountAsync(cancellationToken);
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var items = await projectedQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var resultItems = items.Select(x => {
                var latestDiscount = x.LatestDiscount;
                bool isActiveOffer = latestDiscount != null && latestDiscount.IsActive && latestDiscount.EndDate >= now;
                bool isExpiredOffer = latestDiscount != null && (!latestDiscount.IsActive || latestDiscount.EndDate < now);

                return new AdminCategoryListDto
                {
                    Id = x.Category.Id,
                    Name = x.Category.Name,
                    Description = x.Category.Description,
                    CommissionPercentage = x.Category.CommissionPercentage,
                    IsActive = x.Category.IsActive,
                    VehicleCount = x.VehicleCount,
                    OfferStatus = isActiveOffer ? "Active" : (isExpiredOffer ? "Expired" : "None"),
                    OfferName = x.LatestDiscount?.Code,
                    OfferPercentage = x.LatestDiscount?.DiscountValue,
                    OfferEndDate = x.LatestDiscount?.EndDate,
                    ImageUrl = x.Category.ImageUrl,
                    CreatedAt = x.Category.CreatedAt,
                    UpdatedAt = x.Category.UpdatedAt
                };
            }).ToList();

            var result = new PagedResult<AdminCategoryListDto>(resultItems, page, pageSize, totalCount, totalPages);
            return Ok(result);
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

            var response = await GetCategoryResponseAsync(category.Id, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CategoryDto request, CancellationToken cancellationToken)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
            if (category == null) return NotFound();

            category.Name = request.Name;
            category.Description = request.Description;
            category.CommissionPercentage = request.CommissionPercentage;
            category.IsActive = request.IsActive;

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
                    VehicleCount = _context.Vehicles.Count(v => v.CategoryId == c.Id)
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

    public class AdminCategoryStatsDto
    {
        public int TotalCategories { get; set; }
        public int TotalVehicles { get; set; }
        public int CategoriesWithOffers { get; set; }
        public decimal AverageCommission { get; set; }
    }

    public class AdminCategoryListDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal CommissionPercentage { get; set; }
        public bool IsActive { get; set; }
        public int VehicleCount { get; set; }
        public string OfferStatus { get; set; } = "None";
        public string? OfferName { get; set; }
        public decimal? OfferPercentage { get; set; }
        public DateTime? OfferEndDate { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
