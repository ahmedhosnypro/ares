using Backend.Application.DTOs.Driver;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers
{
    /// <summary>
    /// Service areas (reference cities) used for driver work-area matching.
    /// Public GET; Admin create/update/soft-disable (Plan §7, Phase 5).
    /// </summary>
    [ApiController]
    [Route("api/service-areas")]
    public class ServiceAreasController : ControllerBase
    {
        private readonly IServiceAreaService _service;

        public ServiceAreasController(IServiceAreaService service)
        {
            _service = service;
        }

        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(IEnumerable<ServiceAreaDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(CancellationToken ct)
            => Ok(await _service.GetAllAsync(ct));

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] ServiceAreaDto request, CancellationToken ct)
            => Ok(await _service.CreateAsync(request, ct));

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ServiceAreaDto request, CancellationToken ct)
            => Ok(await _service.UpdateAsync(id, request, ct));

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            await _service.DeleteAsync(id, ct);
            return NoContent();
        }
    }
}
