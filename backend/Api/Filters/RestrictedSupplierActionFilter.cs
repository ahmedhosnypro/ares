using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Backend.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Api.Filters;

/// <summary>
/// Intercepts requests to prevent restricted suppliers from performing modifying actions.
/// </summary>
public class RestrictedSupplierActionFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var httpContext = context.HttpContext;
        var user = httpContext.User;

        // Only check authenticated users with the "Supplier" role
        if (user.Identity?.IsAuthenticated == true && user.IsInRole("Supplier"))
        {
            var method = httpContext.Request.Method;

            // Restrict mutating methods (POST, PUT, PATCH, DELETE)
            // Allow GET (Read Only) and allow auth/logout endpoint which might be POST
            var path = httpContext.Request.Path.Value ?? string.Empty;
            var isLogoutEndpoint = path.Contains("/api/auth/logout", StringComparison.OrdinalIgnoreCase);

            if (!isLogoutEndpoint && (method == "POST" || method == "PUT" || method == "PATCH" || method == "DELETE"))
            {
                var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (Guid.TryParse(userIdClaim, out var userId))
                {
                    var userManager = httpContext.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();
                    var applicationUser = await userManager.FindByIdAsync(userId.ToString());

                    if (applicationUser != null && (applicationUser.Status == "Restricted" || applicationUser.Status == "RESTRICTED"))
                    {
                        var response = new
                        {
                            Success = false,
                            Message = "Your account is restricted. You are not allowed to perform this action.",
                            ErrorCode = "ACCOUNT_RESTRICTED"
                        };

                        context.Result = new ObjectResult(response)
                        {
                            StatusCode = 403
                        };
                        return;
                    }
                }
            }
        }

        await next();
    }
}
