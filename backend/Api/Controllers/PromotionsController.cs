using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Api.Controllers
{
    [ApiController]
    [Route("api/admin/promotions")]
    [Authorize(Roles = "Admin")]
    public class PromotionsController : ControllerBase
    {
        private readonly IApplicationDbContext _context;

        public PromotionsController(IApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetByCategory(Guid categoryId, CancellationToken cancellationToken)
        {
            var promotions = await _context.Promotions
                .Where(p => p.CategoryId == categoryId)
                .OrderByDescending(p => p.StartDate)
                .Select(p => new
                {
                    p.Id,
                    p.CategoryId,
                    p.Name,
                    p.DiscountPercentage,
                    p.StartDate,
                    p.EndDate,
                    p.Status,
                    p.IsActive
                })
                .ToListAsync(cancellationToken);

            return Ok(promotions);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PromotionDto request, CancellationToken cancellationToken)
        {
            var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == request.CategoryId, cancellationToken);
            if (category == null) return NotFound(new { message = "Category not found" });

            if (request.DiscountPercentage < 0 || request.DiscountPercentage > 100)
            {
                return BadRequest(new { message = "Discount percentage must be between 0 and 100." });
            }

            if (request.StartDate >= request.EndDate)
            {
                return BadRequest(new { message = "End date must be after start date." });
            }

            var promotion = new Promotion
            {
                Id = Guid.NewGuid(),
                CategoryId = request.CategoryId,
                Name = request.Name,
                DiscountPercentage = request.DiscountPercentage,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Status = request.Status
            };

            _context.AddPromotion(promotion);
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(promotion);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] PromotionDto request, CancellationToken cancellationToken)
        {
            var promotion = await _context.Promotions.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
            if (promotion == null) return NotFound();

            if (request.DiscountPercentage < 0 || request.DiscountPercentage > 100)
            {
                return BadRequest(new { message = "Discount percentage must be between 0 and 100." });
            }

            if (request.StartDate >= request.EndDate)
            {
                return BadRequest(new { message = "End date must be after start date." });
            }

            promotion.Name = request.Name;
            promotion.DiscountPercentage = request.DiscountPercentage;
            promotion.StartDate = request.StartDate;
            promotion.EndDate = request.EndDate;
            promotion.Status = request.Status;

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(promotion);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            var promotion = await _context.Promotions.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
            if (promotion == null) return NotFound();

            _context.RemovePromotion(promotion);
            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }
    }

    public class PromotionDto
    {
        public Guid CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal DiscountPercentage { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = "Active";
    }
}
