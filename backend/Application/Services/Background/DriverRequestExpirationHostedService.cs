using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Backend.Application.Interfaces;

namespace Backend.Application.Services.Background
{
    public class DriverRequestExpirationHostedService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DriverRequestExpirationHostedService> _logger;

        public DriverRequestExpirationHostedService(IServiceProvider serviceProvider, ILogger<DriverRequestExpirationHostedService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DriverRequestExpirationHostedService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var driverRequestService = scope.ServiceProvider.GetRequiredService<IDriverRequestService>();
                        await driverRequestService.ProcessExpirationsAsync(stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing driver request expirations.");
                }

                // Wait 60 seconds
                await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
            }
        }
    }
}
