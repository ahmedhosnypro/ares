using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Promotions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/v1/promotions")]
[Authorize(Roles = "Admin,Supplier")]
public class PromotionsAdminController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IDiscountAnalyticsService _analyticsService;
    private readonly ILogger<PromotionsAdminController> _logger;

    public PromotionsAdminController(
        IApplicationDbContext context,
        IDiscountAnalyticsService analyticsService,
        ILogger<PromotionsAdminController> logger)
    {
        _context = context;
        _analyticsService = analyticsService;
        _logger = logger;
    }

    [HttpGet("discounts")]
    [ProducesResponseType(typeof(PagedResult<DiscountCodeResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<DiscountCodeResponse>>> GetDiscounts(
        [FromQuery] string? status, [FromQuery] Guid? supplierId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        var query = _context.DiscountCodes.AsQueryable();

        if (!User.IsInRole("Admin"))
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var createdById = userId != null && Guid.TryParse(userId, out var uid) ? uid : Guid.Empty;
            query = query.Where(dc => dc.CreatedById == createdById);
        }

        if (status == "active")
            query = query.Where(dc => dc.IsActive && dc.ValidFrom <= now && dc.ValidTo >= now);
        else if (status == "expired")
            query = query.Where(dc => dc.ValidTo < now);

        if (supplierId.HasValue)
            query = query.Where(dc => dc.SupplierId == supplierId.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var discountCodes = await query
            .OrderByDescending(dc => dc.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var discountIds = discountCodes.Select(dc => dc.Id).ToList();

        var vehicleCategories = await _context.DiscountVehicleCategories
            .Where(dvc => discountIds.Contains(dvc.DiscountId))
            .ToListAsync(cancellationToken);

        var dvcByDiscount = vehicleCategories.GroupBy(dvc => dvc.DiscountId)
            .ToDictionary(g => g.Key, g => g.Select(dvc => dvc.CategoryId).ToList());

        var responses = discountCodes.Select(dc =>
        {
            var segments = string.IsNullOrEmpty(dc.CustomerSegments)
                ? new List<string> { "all" }
                : JsonSerializer.Deserialize<List<string>>(dc.CustomerSegments) ?? new List<string> { "all" };

            var remainingUses = dc.UsageLimitTotal.HasValue
                ? dc.UsageLimitTotal.Value - dc.CurrentUsageCount
                : (int?)null;

            var categoryIds = dvcByDiscount.TryGetValue(dc.Id, out var catIds) ? catIds : new List<Guid>();

            return new DiscountCodeResponse(
                dc.Id,
                dc.Code,
                dc.Description,
                dc.DiscountType,
                dc.DiscountValue,
                dc.ValidFrom,
                dc.ValidTo,
                dc.UsageLimitTotal,
                dc.UsageLimitPerCustomer,
                dc.CurrentUsageCount,
                remainingUses,
                segments,
                categoryIds,
                dc.MinimumDuration,
                dc.MinimumValue,
                dc.AllowStacking,
                dc.IsAutomatic,
                dc.Priority,
                dc.IsActive,
                dc.SupplierId,
                dc.CreatedById,
                dc.CreatedAt,
                dc.UpdatedAt
            );
        }).ToList();

        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var result = new PagedResult<DiscountCodeResponse>(responses, page, pageSize, totalCount, totalPages);

        return Ok(result);
    }

    [HttpPost("discounts")]
    [ProducesResponseType(typeof(DiscountCodeResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<DiscountCodeResponse>> CreateDiscount(
        [FromBody] DiscountCodeCreateRequest request, CancellationToken cancellationToken)
    {
        if (request.DiscountType != "percentage" && request.DiscountType != "fixed")
            return BadRequest(new { message = "DiscountType must be 'percentage' or 'fixed'." });

        if (request.DiscountType == "percentage" && (request.DiscountValue < 0 || request.DiscountValue > 100))
            return BadRequest(new { message = "Percentage discount value must be between 0 and 100." });

        if (request.ValidFrom >= request.ValidTo)
            return BadRequest(new { message = "ValidTo must be after ValidFrom." });

        var existing = await _context.DiscountCodes
            .AnyAsync(dc => dc.Code == request.Code, cancellationToken);
        if (existing)
            return BadRequest(new { message = "A discount code with this code already exists." });

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var createdById = userId != null && Guid.TryParse(userId, out var uid) ? uid : Guid.Empty;

        var discountCode = new DiscountCode
        {
            Code = request.Code,
            Description = request.Description,
            DiscountType = request.DiscountType,
            DiscountValue = request.DiscountValue,
            ValidFrom = request.ValidFrom,
            ValidTo = request.ValidTo,
            UsageLimitTotal = request.UsageLimitTotal,
            UsageLimitPerCustomer = request.UsageLimitPerCustomer,
            CustomerSegments = JsonSerializer.Serialize(request.CustomerSegments),
            MinimumDuration = request.MinimumDuration,
            MinimumValue = request.MinimumValue,
            AllowStacking = request.AllowStacking,
            IsAutomatic = request.IsAutomatic,
            Priority = request.Priority,
            SupplierId = request.SupplierId,
            IsActive = true,
            CreatedById = createdById
        };

        _context.AddDiscountCode(discountCode);

        if (!User.IsInRole("Admin"))
        {
            var userCompanyId = await _context.CompanyProfiles
                .Where(cp => cp.UserId == createdById)
                .Select(cp => cp.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (userCompanyId != Guid.Empty)
            {
                discountCode.SupplierId = userCompanyId;
            }
        }

        if (request.VehicleCategoryIds is { Count: > 0 })
        {
            foreach (var categoryId in request.VehicleCategoryIds)
            {
                discountCode.VehicleCategories.Add(new DiscountVehicleCategory
                {
                    DiscountId = discountCode.Id,
                    CategoryId = categoryId
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        var segments = JsonSerializer.Deserialize<List<string>>(discountCode.CustomerSegments) ?? new List<string> { "all" };

        var response = new DiscountCodeResponse(
            discountCode.Id,
            discountCode.Code,
            discountCode.Description,
            discountCode.DiscountType,
            discountCode.DiscountValue,
            discountCode.ValidFrom,
            discountCode.ValidTo,
            discountCode.UsageLimitTotal,
            discountCode.UsageLimitPerCustomer,
            discountCode.CurrentUsageCount,
            discountCode.UsageLimitTotal.HasValue ? discountCode.UsageLimitTotal.Value - discountCode.CurrentUsageCount : null,
            segments,
            request.VehicleCategoryIds ?? new List<Guid>(),
            discountCode.MinimumDuration,
            discountCode.MinimumValue,
            discountCode.AllowStacking,
            discountCode.IsAutomatic,
            discountCode.Priority,
            discountCode.IsActive,
            discountCode.SupplierId,
            discountCode.CreatedById,
            discountCode.CreatedAt,
            discountCode.UpdatedAt
        );

        return CreatedAtAction(nameof(GetDiscounts), new { discountId = discountCode.Id }, response);
    }

    [HttpPut("discounts/{discountId:guid}")]
    [ProducesResponseType(typeof(DiscountCodeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DiscountCodeResponse>> UpdateDiscount(
        Guid discountId, [FromBody] DiscountCodeUpdateRequest request,
        CancellationToken cancellationToken)
    {
        var discountCode = await _context.DiscountCodes
            .FirstOrDefaultAsync(dc => dc.Id == discountId, cancellationToken);
        if (discountCode == null)
            return NotFound(new { message = $"Discount code with ID {discountId} not found." });

        if (!User.IsInRole("Admin"))
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var createdById = userId != null && Guid.TryParse(userId, out var uid) ? uid : Guid.Empty;
            if (discountCode.CreatedById != createdById)
                return Forbid();
        }

        if (request.Description is not null)
            discountCode.Description = request.Description;
        if (request.ValidTo.HasValue)
        {
            if (request.ValidTo.Value <= discountCode.ValidFrom)
                return BadRequest(new { message = "ValidTo must be after ValidFrom." });
            discountCode.ValidTo = request.ValidTo.Value;
        }
        if (request.UsageLimitTotal.HasValue)
            discountCode.UsageLimitTotal = request.UsageLimitTotal;
        if (request.IsActive.HasValue)
            discountCode.IsActive = request.IsActive.Value;

        discountCode.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var segments = JsonSerializer.Deserialize<List<string>>(discountCode.CustomerSegments) ?? new List<string> { "all" };

        var vehicleCategories = await _context.DiscountVehicleCategories
            .Where(dvc => dvc.DiscountId == discountCode.Id)
            .Select(dvc => dvc.CategoryId)
            .ToListAsync(cancellationToken);

        var response = new DiscountCodeResponse(
            discountCode.Id,
            discountCode.Code,
            discountCode.Description,
            discountCode.DiscountType,
            discountCode.DiscountValue,
            discountCode.ValidFrom,
            discountCode.ValidTo,
            discountCode.UsageLimitTotal,
            discountCode.UsageLimitPerCustomer,
            discountCode.CurrentUsageCount,
            discountCode.UsageLimitTotal.HasValue ? discountCode.UsageLimitTotal.Value - discountCode.CurrentUsageCount : null,
            segments,
            vehicleCategories,
            discountCode.MinimumDuration,
            discountCode.MinimumValue,
            discountCode.AllowStacking,
            discountCode.IsAutomatic,
            discountCode.Priority,
            discountCode.IsActive,
            discountCode.SupplierId,
            discountCode.CreatedById,
            discountCode.CreatedAt,
            discountCode.UpdatedAt
        );

        return Ok(response);
    }

    [HttpDelete("discounts/{discountId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteDiscount(
        Guid discountId, [FromQuery] bool permanent = false,
        CancellationToken cancellationToken = default)
    {
        var discountCode = await _context.DiscountCodes
            .FirstOrDefaultAsync(dc => dc.Id == discountId, cancellationToken);
        if (discountCode == null)
            return NotFound(new { message = $"Discount code with ID {discountId} not found." });

        if (!User.IsInRole("Admin"))
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var createdById = userId != null && Guid.TryParse(userId, out var uid) ? uid : Guid.Empty;
            if (discountCode.CreatedById != createdById)
                return Forbid();
        }

        if (permanent)
        {
            _context.RemoveDiscountCode(discountCode);
        }
        else
        {
            discountCode.IsActive = false;
            discountCode.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok();
    }

    [HttpGet("analytics/{discountId:guid}")]
    [ProducesResponseType(typeof(DiscountAnalyticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DiscountAnalyticsDto>> GetAnalytics(
        Guid discountId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate,
        CancellationToken cancellationToken)
    {
        if (!User.IsInRole("Admin"))
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var createdById = userId != null && Guid.TryParse(userId, out var uid) ? uid : Guid.Empty;
            var discount = await _context.DiscountCodes
                .FirstOrDefaultAsync(dc => dc.Id == discountId, cancellationToken);
            if (discount == null)
                return NotFound(new { message = $"Discount code with ID {discountId} not found." });
            if (discount.CreatedById != createdById)
                return Forbid();
        }

        var result = await _analyticsService.GetDiscountAnalyticsAsync(discountId, startDate, endDate, cancellationToken);
        return Ok(result);
    }
}
