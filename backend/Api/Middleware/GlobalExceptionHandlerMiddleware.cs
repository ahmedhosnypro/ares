using System.Net;
using System.Text.Json;
using Backend.Application.Exceptions;
using Backend.Application.DTOs;

namespace Backend.Api.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        ErrorResponse response;

        switch (exception)
        {
            case Application.Exceptions.ValidationException validationException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                var validationErrors = validationException.Errors
                    .SelectMany(e => e.Value.Select(v => new ValidationError(e.Key, v)))
                    .ToList();
                response = new ErrorResponse(
                    (int)HttpStatusCode.BadRequest,
                    "Validation failed",
                    validationErrors);
                _logger.LogWarning(exception, "Validation error occurred");
                break;

            case BadRequestException badRequestException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response = new ErrorResponse(
                    (int)HttpStatusCode.BadRequest,
                    badRequestException.Message);
                _logger.LogWarning(exception, "Bad request");
                break;

            case NotFoundException notFoundException:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                response = new ErrorResponse(
                    (int)HttpStatusCode.NotFound,
                    notFoundException.Message);
                _logger.LogWarning(exception, "Resource not found");
                break;

            case UnauthorizedException unauthorizedException:
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response = new ErrorResponse(
                    (int)HttpStatusCode.Unauthorized,
                    unauthorizedException.Message);
                _logger.LogWarning(exception, "Unauthorized access attempt");
                break;

            case ForbiddenException forbiddenException:
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                response = new ErrorResponse(
                    (int)HttpStatusCode.Forbidden,
                    forbiddenException.Message);
                _logger.LogWarning(exception, "Forbidden access attempt");
                break;

            case ConflictException conflictException:
                context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                response = new ErrorResponse(
                    (int)HttpStatusCode.Conflict,
                    conflictException.Message);
                _logger.LogWarning(exception, "Conflict occurred");
                break;

            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response = new ErrorResponse(
                    (int)HttpStatusCode.InternalServerError,
                    "An internal server error occurred. Please try again later.");
                _logger.LogError(exception, "Unhandled exception occurred");
                break;
        }

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}
