using Microsoft.AspNetCore.Mvc;
using System.Reflection;

namespace Backend.Api.Controllers;

/// <summary>
/// Health check controller for monitoring application status
/// </summary>
/// <remarks>
/// This controller provides health check endpoints for monitoring and load balancing.
/// No authentication is required for these endpoints.
/// </remarks>
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ILogger<HealthController> _logger;

    public HealthController(ILogger<HealthController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Basic health check endpoint
    /// </summary>
    /// <returns>Health status information</returns>
    /// <response code="200">Service is healthy and operational</response>
    /// <remarks>
    /// Returns basic health status information including:
    /// - Status: "healthy"
    /// - Timestamp: Current UTC time
    /// - Version: Application version from assembly
    /// 
    /// This endpoint is designed for:
    /// - Load balancer health checks
    /// - Monitoring systems
    /// - Automated testing
    /// - Service discovery
    /// 
    /// **Sample Response**:
    /// ```json
    /// {
    ///   "status": "healthy",
    ///   "timestamp": "2026-04-16T12:00:00.000Z",
    ///   "version": "1.0.0"
    /// }
    /// ```
    /// </remarks>
    [HttpGet]
    [ProducesResponseType(typeof(HealthResponse), StatusCodes.Status200OK)]
    public ActionResult<HealthResponse> GetHealth()
    {
        var version = Assembly.GetExecutingAssembly()
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
            ?.InformationalVersion ?? "1.0.0";

        var response = new HealthResponse
        {
            Status = "healthy",
            Timestamp = DateTime.UtcNow,
            Version = version
        };

        _logger.LogDebug("Health check requested - Status: {Status}", response.Status);

        return Ok(response);
    }

    /// <summary>
    /// Detailed health check with component status
    /// </summary>
    /// <returns>Detailed health status information</returns>
    /// <response code="200">Service is healthy with component details</response>
    /// <response code="503">Service is unhealthy or degraded</response>
    /// <remarks>
    /// Returns detailed health status including:
    /// - Overall status
    /// - Individual component status (API, Database, etc.)
    /// - Timestamp and version
    /// 
    /// **Sample Response**:
    /// ```json
    /// {
    ///   "status": "healthy",
    ///   "timestamp": "2026-04-16T12:00:00.000Z",
    ///   "version": "1.0.0",
    ///   "components": {
    ///     "api": "healthy",
    ///     "database": "healthy"
    ///   }
    /// }
    /// ```
    /// </remarks>
    [HttpGet("detailed")]
    [ProducesResponseType(typeof(DetailedHealthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DetailedHealthResponse), StatusCodes.Status503ServiceUnavailable)]
    public ActionResult<DetailedHealthResponse> GetDetailedHealth()
    {
        var version = Assembly.GetExecutingAssembly()
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
            ?.InformationalVersion ?? "1.0.0";

        // In a production environment, you would check actual component health here
        // For now, we'll return a simple healthy status
        var response = new DetailedHealthResponse
        {
            Status = "healthy",
            Timestamp = DateTime.UtcNow,
            Version = version,
            Components = new Dictionary<string, string>
            {
                { "api", "healthy" },
                { "database", "healthy" }
            }
        };

        _logger.LogDebug("Detailed health check requested - Status: {Status}", response.Status);

        return Ok(response);
    }
}

/// <summary>
/// Basic health check response
/// </summary>
public class HealthResponse
{
    /// <summary>
    /// Health status (e.g., "healthy", "unhealthy", "degraded")
    /// </summary>
    public required string Status { get; set; }

    /// <summary>
    /// Timestamp of the health check (UTC)
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Application version
    /// </summary>
    public required string Version { get; set; }
}

/// <summary>
/// Detailed health check response with component status
/// </summary>
public class DetailedHealthResponse : HealthResponse
{
    /// <summary>
    /// Status of individual components
    /// </summary>
    public Dictionary<string, string> Components { get; set; } = new();
}
