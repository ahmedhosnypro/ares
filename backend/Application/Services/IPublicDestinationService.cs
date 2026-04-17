using Backend.Application.DTOs.Public;

namespace Backend.Application.Services;

public interface IPublicDestinationService
{
    Task<IReadOnlyList<PublicDestinationDto>> GetPopularDestinationsAsync(
        int limit,
        CancellationToken cancellationToken = default);
}
