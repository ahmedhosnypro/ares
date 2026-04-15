using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Public;
using Backend.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/public/suppliers")]
public class PublicSuppliersController : ControllerBase
{
    private readonly ISupplierService _supplierService;
    private readonly ILogger<PublicSuppliersController> _logger;

    public PublicSuppliersController(
        ISupplierService supplierService,
        ILogger<PublicSuppliersController> logger)
    {
        _supplierService = supplierService;
        _logger = logger;
    }

    [HttpGet("{page:int}/{size:int}")]
    [ProducesResponseType(typeof(PagedResult<PublicSupplierDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<PublicSupplierDto>>> GetSuppliers(
        int page,
        int size,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Public supplier list requested - Page: {Page}, Size: {Size}", page, size);

        var result = await _supplierService.GetPublicSuppliersAsync(page, size, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PublicSupplierDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PublicSupplierDto>> GetSupplier(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var supplier = await _supplierService.GetPublicSupplierByIdAsync(id, cancellationToken);
        if (supplier == null)
        {
            return NotFound(new { Message = $"Supplier with ID {id} not found" });
        }

        return Ok(supplier);
    }
}
