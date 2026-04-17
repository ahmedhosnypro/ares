using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Location;

namespace Backend.Application.Services;

public interface ILocationService
{
    Task<IEnumerable<LocationSuggestionDto>> AutocompleteAsync(
        string query,
        string? type,
        CancellationToken cancellationToken = default);

    Task<PagedResult<LocationDto>> GetLocationsAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<object> GetLocationsForFrontendAsync(
        int page,
        int pageSize,
        string keyword,
        CancellationToken cancellationToken = default);

    Task<LocationDto> CreateLocationAsync(
        CreateLocationRequest request,
        CancellationToken cancellationToken = default);

    Task<LocationDto> UpdateLocationAsync(
        Guid locationId,
        UpdateLocationRequest request,
        CancellationToken cancellationToken = default);
}
