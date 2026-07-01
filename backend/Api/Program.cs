using System.Text;
using Backend.Infrastructure.Data;
using Backend.Domain.Entities;
using Backend.Api.Middleware;
using Backend.Api.Filters;
using Backend.Application.Services;
using Backend.Application.Validators;
using Backend.Application.Interfaces;
using Backend.Infrastructure.Repositories;
using Backend.Infrastructure.Data.Repositories;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(new ConfigurationBuilder()
        .AddJsonFile("appsettings.json")
        .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
        .Build())
    .CreateLogger();

try
{
    Log.Information("Starting web application");

    var builder = WebApplication.CreateBuilder(args);

    // Add Serilog
    builder.Host.UseSerilog();

    // Add services to the container.
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException(
            "ConnectionStrings:DefaultConnection is not set. " +
            "Add it to backend/.env as: ConnectionStrings__DefaultConnection=<your-connection-string>");

    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(connectionString));

    // Register IApplicationDbContext
    builder.Services.AddScoped<IApplicationDbContext>(provider =>
        provider.GetRequiredService<ApplicationDbContext>());

    builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options => options.SignIn.RequireConfirmedAccount = true)
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

    // Configure JWT Authentication
    var jwtSecretKey = builder.Configuration["Jwt:SecretKey"]
        ?? throw new InvalidOperationException("JWT SecretKey is not configured");
    var jwtIssuer = builder.Configuration["Jwt:Issuer"]
        ?? throw new InvalidOperationException("JWT Issuer is not configured");
    var jwtAudience = builder.Configuration["Jwt:Audience"]
        ?? throw new InvalidOperationException("JWT Audience is not configured");

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.SaveToken = true;
        options.RequireHttpsMetadata = false; // Set to true in production
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

    // Register JWT Token Service
    builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();


    // Register Generic Repositories
    builder.Services.AddScoped(typeof(Backend.Application.Interfaces.IRepository<>), typeof(Backend.Infrastructure.Repositories.Repository<>));
    builder.Services.AddScoped(typeof(Backend.Application.Interfaces.IPaginatedRepository<>), typeof(Backend.Infrastructure.Repositories.PaginatedRepository<>));

    // Register Specific Repositories
    builder.Services.AddScoped<ILocationRepository, LocationRepository>();
    builder.Services.AddScoped<IVehicleRepository, VehicleRepository>();
    builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
    builder.Services.AddScoped<IBookingRepository, BookingRepository>();
    builder.Services.AddScoped<IUserRepository, UserRepository>();
    builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
    builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
    builder.Services.AddScoped<ISupplierRepository, SupplierRepository>();




    // Register Application Services
    //builder.Services.AddScoped<IEmailService, DevelopmentEmailService>();
    // Add Email Service
    builder.Services.AddScoped<IEmailService, Backend.Infrastructure.Services.SmtpEmailService>();

    // Register MediatR
    builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(IEmailService).Assembly));

    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IGoogleAuthService, GoogleAuthService>();
    builder.Services.AddScoped<ILocationService, LocationService>();
    builder.Services.AddScoped<IVehicleService, VehicleService>();
    builder.Services.AddScoped<IPricingService, PricingService>();
    builder.Services.AddScoped<IBookingService, BookingService>();
    builder.Services.AddScoped<ICheckoutService, CheckoutService>();
    builder.Services.AddScoped<IUserProfileService, UserProfileService>();
    builder.Services.AddScoped<IVerificationService, VerificationService>();
    builder.Services.AddScoped<IDriverLicenseService, DriverLicenseService>();
    builder.Services.AddScoped<IUserManagementService, UserManagementService>();
    builder.Services.AddScoped<IUserDeletionService, Backend.Infrastructure.Services.UserDeletionService>();
    builder.Services.AddScoped<ISupplierService, SupplierService>();
    builder.Services.AddScoped<ISupplierRestrictionService, SupplierRestrictionService>();
    builder.Services.AddScoped<IPaymentService, PaymentService>();
    builder.Services.AddScoped<IReviewService, ReviewService>();
    builder.Services.AddScoped<INotificationService, NotificationService>();
    builder.Services.AddScoped<IPublicDestinationService, PublicDestinationService>();
    builder.Services.AddScoped<IDashboardService, DashboardService>();
    builder.Services.AddScoped<ISupplierDashboardService, SupplierDashboardService>();
    builder.Services.AddScoped<ISupplierVehicleService, SupplierVehicleService>();
    builder.Services.AddScoped<ISupplierBookingService, SupplierBookingService>();
    builder.Services.AddScoped<ISupplierEarningsService, SupplierEarningsService>();
    builder.Services.AddScoped<ICommissionService, CommissionService>();
    builder.Services.AddScoped<ISupplierNotificationService, SupplierNotificationService>();
    builder.Services.AddScoped<ISupplierReviewService, SupplierReviewService>();
    // ─── Inspector / Inspection workflow ──────────────────────────────────
    builder.Services.AddScoped<IInspectorManagementService, InspectorManagementService>();
    builder.Services.AddScoped<IInspectionService, InspectionService>();

    // ─── Driver Module ──────────────────────────────────────────────────
    builder.Services.AddScoped<IDriverProfileRepository, DriverProfileRepository>();
    builder.Services.AddScoped<IDriverReviewRepository, DriverReviewRepository>();
    builder.Services.AddScoped<IServiceAreaRepository, ServiceAreaRepository>();

    builder.Services.AddScoped<IDriverProfileService, DriverProfileService>();
    builder.Services.AddScoped<IDriverAssignmentService, DriverAssignmentService>();
    builder.Services.AddScoped<IDriverReviewService, DriverReviewService>();
    builder.Services.AddScoped<IDriverDashboardService, DriverDashboardService>();
    builder.Services.AddScoped<IAdminDriverService, AdminDriverService>();
    builder.Services.AddScoped<IServiceAreaService, ServiceAreaService>();
        builder.Services.AddScoped<IDriverNotificationService, DriverNotificationService>();
        builder.Services.AddScoped<IDriverPricingService, DriverPricingService>();
        builder.Services.AddScoped<Backend.Application.Services.ISettingsService, Backend.Infrastructure.Services.SettingsService>();
        builder.Services.AddScoped<IDriverEarningsService, DriverEarningsService>();
        builder.Services.AddScoped<IDriverPayoutRepository, DriverPayoutRepository>();
    builder.Services.AddScoped<IDriverEarningsAdminService, DriverEarningsAdminService>();
    builder.Services.AddScoped<Backend.Application.Services.ITermsService, Backend.Application.Services.TermsService>();
    builder.Services.AddScoped<Backend.Application.Services.IAboutService, Backend.Application.Services.AboutService>();
    builder.Services.AddScoped<Backend.Application.Services.IPrivacyService, Backend.Application.Services.PrivacyService>();
    builder.Services.AddScoped<IDiscountValidationService, DiscountValidationService>();
    builder.Services.AddScoped<IDiscountApplicationService, DiscountApplicationService>();
    builder.Services.AddScoped<IAutomaticDiscountService, AutomaticDiscountService>();
    builder.Services.AddScoped<IDiscountAnalyticsService, DiscountAnalyticsService>();
    builder.Services.AddHostedService<Backend.Infrastructure.Services.BookingStatusUpdateService>();
    builder.Services.AddHostedService<Backend.Infrastructure.BackgroundServices.VehicleInspectionAutoAssignmentBackgroundService>();

    // Paymob
    builder.Services.Configure<Backend.Application.Settings.PaymobSettings>(builder.Configuration.GetSection("Paymob"));
    builder.Services.AddHttpClient<Backend.Application.Interfaces.IPaymobClient, Backend.Infrastructure.Services.PaymobClient>();
    builder.Services.AddSingleton<Backend.Application.Interfaces.IRefundCalculator, Backend.Application.Services.RefundCalculator>();

    // Add HttpContextAccessor
    builder.Services.AddHttpContextAccessor();

    // Register FluentValidation
    builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

    // Register AutoMapper
    builder.Services.AddAutoMapper(cfg => { }, typeof(Backend.Application.Mappings.AuthMappingProfile));

    // Configure CORS
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? new[] { "http://localhost:3000" };

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    // Configure Swagger/OpenAPI
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "Ares Car Rental API",
            Version = "v1",
            Description = @"
## Ares Car Rental Backend API

A comprehensive RESTful API for car rental application built with ASP.NET Core 8.0 and Clean Architecture.

### Features
- **Authentication**: JWT-based authentication with role-based authorization
- **Vehicle Management**: Search, filter, and manage vehicle inventory
- **Booking System**: Create, manage, and cancel vehicle bookings
- **Payment Processing**: Handle payments and generate receipts
- **User Management**: Profile management and user administration
- **Review System**: Customer reviews and ratings
- **Notification System**: Real-time notifications

### Authentication
Most endpoints require authentication. Use the `/api/auth/login` endpoint to obtain a JWT token, then include it in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Rate Limiting
The API implements rate limiting to prevent abuse:
- **Authentication endpoints**: 5 attempts per 15 minutes for login, 5 attempts per hour for registration
- **General endpoints**: Standard rate limiting applies

### Error Handling
All endpoints return standardized error responses with appropriate HTTP status codes:
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Pagination
List endpoints support pagination with the following query parameters:
- `page`: Page number (default: 1)
- `limit` or `size`: Items per page (default varies by endpoint)

### Filtering and Sorting
Many endpoints support filtering and sorting. Check individual endpoint documentation for available options.
",
            Contact = new OpenApiContact
            {
                Name = "Ares Car Rental API Support",
                Email = "support@arescarrental.com"
            },
            License = new OpenApiLicense
            {
                Name = "MIT License",
                Url = new Uri("https://opensource.org/licenses/MIT")
            }
        });

        // Add JWT authentication to Swagger
        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = @"JWT Authorization header using the Bearer scheme. 

Enter 'Bearer' [space] and then your token in the text input below.

Example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer",
            BearerFormat = "JWT"
        });

        options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
        });

        // Include XML comments from all assemblies
        var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(xmlPath))
        {
            options.IncludeXmlComments(xmlPath);
        }

        // Include XML comments from Application layer if available
        var applicationXmlFile = "Application.xml";
        var applicationXmlPath = Path.Combine(AppContext.BaseDirectory, applicationXmlFile);
        if (File.Exists(applicationXmlPath))
        {
            options.IncludeXmlComments(applicationXmlPath);
        }

        // Configure Swagger UI options
        options.DescribeAllParametersInCamelCase();
        options.UseInlineDefinitionsForEnums();

        // Add custom operation filters for better documentation
        options.OperationFilter<AuthenticationRequirementOperationFilter>();
        options.OperationFilter<RateLimitOperationFilter>();
    });

    builder.Services.AddControllers(options =>
    {
        options.Filters.Add<Backend.Api.Filters.RestrictedSupplierActionFilter>();
    }).AddJsonOptions(options =>
    {
        // Ensure all DateTime values serialize with timezone info (Z suffix for UTC).
        // Without this, System.Text.Json omits "Z" for DateTimeKind.Unspecified values,
        // causing the frontend to interpret them as local time.
        options.JsonSerializerOptions.Converters.Add(new Backend.Api.Converters.UtcDateTimeConverter());
        options.JsonSerializerOptions.Converters.Add(new Backend.Api.Converters.UtcNullableDateTimeConverter());
    });

    var app = builder.Build();

    // Configure the HTTP request pipeline.

    // Enable Swagger in all environments for development
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Ares Car Rental API v1");
        options.RoutePrefix = "swagger";
    });

    // Add Serilog request logging (must be before exception handler so it
    // captures the status code set by GlobalExceptionHandlerMiddleware, not
    // the default 500 that ASP.NET Core assigns before re-throwing).
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
            diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
            diagnosticContext.Set("RemoteIpAddress", httpContext.Connection.RemoteIpAddress);
        };
    });

    // Add global exception handling middleware (must be before auth/CORS)
    app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

    // Add rate limiting middleware (before authentication)
    app.UseMiddleware<RateLimitingMiddleware>();

    // Enable CORS
    app.UseCors("AllowFrontend");

    app.UseStaticFiles();

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.MapGet("/", () => "Ares Car Rental API - Visit /swagger for API documentation");

    var seedOnly = args.Any(arg => string.Equals(arg, "--seed-only", StringComparison.OrdinalIgnoreCase));
    var seedDemoData = string.Equals(Environment.GetEnvironmentVariable("SEED_DEMO_DATA"), "true", StringComparison.OrdinalIgnoreCase);

    // Initialize database and seed roles if requested OR if auto-seed is enabled
    if (seedOnly || seedDemoData)
    {
        using (var scope = app.Services.CreateScope())
        {
            var services = scope.ServiceProvider;
            try
            {
                // Apply any pending migrations (creates the DB if it doesn't exist)
                var db = services.GetRequiredService<ApplicationDbContext>();
                await db.Database.MigrateAsync();

                // DbInitializer handles the 'IsSeeded' check internally to prevent 
                // re-seeding demo data on every start.
                await DbInitializer.InitializeAsync(services, seedDemoData, seedOnly);
            }
            catch (Exception ex)
            {
                var logger = services.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "An error occurred while initializing the database");
            }
        }

        if (seedOnly)
        {
            Log.Information("Seed-only mode completed successfully.");
            return;
        }
    }

    app.Run();
}
catch (Microsoft.Extensions.Hosting.HostAbortedException)
{
    // Expected during EF Core design-time operations (e.g., `dotnet ef ...`).
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
