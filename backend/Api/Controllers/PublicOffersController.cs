using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Promotions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/public/offers")]
public class PublicOffersController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<PublicOffersController> _logger;

    public PublicOffersController(
        IApplicationDbContext context,
        ILogger<PublicOffersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("{page:int}/{size:int}")]
    [ProducesResponseType(typeof(PagedResult<PublicOfferDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<PublicOfferDto>>> GetOffers(
        int page, int size, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Public offers requested - Page: {Page}, Size: {Size}", page, size);

        var now = DateTime.UtcNow;

        var query = _context.DiscountCodes
            .Where(dc => dc.IsActive && dc.ValidFrom <= now && dc.ValidTo >= now);

        var totalCount = await query.CountAsync(cancellationToken);

        var discountCodes = await query
            .OrderByDescending(dc => dc.Priority)
            .ThenByDescending(dc => dc.DiscountValue)
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync(cancellationToken);

        var discountIds = discountCodes.Select(dc => dc.Id).ToList();

        var vehicleCategories = await _context.DiscountVehicleCategories
            .Where(dvc => discountIds.Contains(dvc.DiscountId))
            .ToListAsync(cancellationToken);

        var categoryIds = vehicleCategories.Select(dvc => dvc.CategoryId).Distinct().ToList();

        var categories = await _context.Categories
            .Where(c => categoryIds.Contains(c.Id))
            .ToListAsync(cancellationToken);

        var categoryLookup = categories.ToDictionary(c => c.Id, c => c.Name);
        var dvcByDiscount = vehicleCategories.GroupBy(dvc => dvc.DiscountId)
            .ToDictionary(g => g.Key, g => g.Select(dvc => dvc.CategoryId).ToList());

        var offers = discountCodes.Select(dc =>
        {
            var displayCode = dc.IsAutomatic ? "AUTO" : dc.Code;
            var discountDisplay = dc.DiscountType == "percentage"
                ? $"{dc.DiscountValue}% off"
                : $"${dc.DiscountValue} off";

            var catNames = dvcByDiscount.TryGetValue(dc.Id, out var catIds)
                ? catIds.Where(id => categoryLookup.ContainsKey(id)).Select(id => categoryLookup[id]).ToList()
                : null;

            if (catNames is { Count: 0 })
                catNames = null;

            return new PublicOfferDto(
                dc.Id,
                displayCode,
                dc.Description,
                dc.DiscountType,
                dc.DiscountValue,
                discountDisplay,
                dc.ValidFrom,
                dc.ValidTo,
                catNames,
                dc.IsAutomatic,
                dc.MinimumDuration,
                dc.MinimumValue
            );
        }).ToList();

        var totalPages = (int)Math.Ceiling((double)totalCount / size);

        var result = new PagedResult<PublicOfferDto>(offers, page, size, totalCount, totalPages);

        return Ok(result);
    }
}
