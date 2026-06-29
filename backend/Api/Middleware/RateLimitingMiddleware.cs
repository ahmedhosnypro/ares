using System.Collections.Concurrent;

namespace Backend.Api.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;

    // Store: IP -> Endpoint -> (RequestCount, WindowStart)
    private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, (int Count, DateTime WindowStart)>> _requestStore = new();

    public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.Request.Path.Value?.ToLower() ?? string.Empty;
        var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        // Define rate limits for specific endpoints
        var rateLimitConfig = GetRateLimitConfig(endpoint);

        if (rateLimitConfig != null)
        {
            var (maxRequests, windowMinutes) = rateLimitConfig.Value;

            if (!IsRequestAllowed(ipAddress, endpoint, maxRequests, windowMinutes))
            {
                _logger.LogWarning("Rate limit exceeded for IP {IpAddress} on endpoint {Endpoint}", ipAddress, endpoint);

                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.Response.ContentType = "application/json";

                await context.Response.WriteAsJsonAsync(new
                {
                    StatusCode = 429,
                    Message = "Too many requests. Please try again later.",
                    RetryAfter = $"{windowMinutes} minutes"
                });

                return;
            }
        }

        await _next(context);
    }

    private static (int MaxRequests, int WindowMinutes)? GetRateLimitConfig(string endpoint)
    {
        // Login: 5 attempts per 15 minutes
        if (endpoint.Contains("/api/auth/login"))
        {
            return (5, 15);
        }

        // Demo login: 10 attempts per 15 minutes
        if (endpoint.Contains("/api/auth/demo-login"))
        {
            return (10, 15);
        }

        // Demo roles: 20 attempts per 15 minutes
        if (endpoint.Contains("/api/auth/demo-roles"))
        {
            return (20, 15);
        }

        // Registration: 5 attempts per 60 minutes (1 hour)
        if (endpoint.Contains("/api/auth/register"))
        {
            return (5, 60);
        }

        // Discount validation: 10 attempts per 1 minute per IP
        if (endpoint.Contains("/api/public/promotions/validate"))
        {
            return (10, 1);
        }

        // Discount apply: 5 attempts per 1 minute per IP
        if (endpoint.Contains("/api/v1/promotions/apply"))
        {
            return (5, 1);
        }

        // No rate limit for other endpoints
        return null;
    }

    private static bool IsRequestAllowed(string ipAddress, string endpoint, int maxRequests, int windowMinutes)
    {
        var now = DateTime.UtcNow;
        var windowDuration = TimeSpan.FromMinutes(windowMinutes);

        // Get or create IP-specific dictionary
        var endpointStore = _requestStore.GetOrAdd(ipAddress, _ => new ConcurrentDictionary<string, (int, DateTime)>());

        // Get or create endpoint-specific counter
        var (count, windowStart) = endpointStore.GetOrAdd(endpoint, _ => (0, now));

        // Check if we're still in the same time window
        if (now - windowStart > windowDuration)
        {
            // Reset the window
            endpointStore[endpoint] = (1, now);
            return true;
        }

        // Check if limit is exceeded
        if (count >= maxRequests)
        {
            return false;
        }

        // Increment counter
        endpointStore[endpoint] = (count + 1, windowStart);
        return true;
    }

    // Cleanup old entries periodically (optional, to prevent memory leaks)
    public static void CleanupOldEntries()
    {
        var now = DateTime.UtcNow;
        var maxAge = TimeSpan.FromHours(2);

        foreach (var ipEntry in _requestStore)
        {
            foreach (var endpointEntry in ipEntry.Value)
            {
                if (now - endpointEntry.Value.WindowStart > maxAge)
                {
                    ipEntry.Value.TryRemove(endpointEntry.Key, out _);
                }
            }

            if (ipEntry.Value.IsEmpty)
            {
                _requestStore.TryRemove(ipEntry.Key, out _);
            }
        }
    }
}
