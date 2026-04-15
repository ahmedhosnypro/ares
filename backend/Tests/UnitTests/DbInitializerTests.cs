using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace Backend.Tests.UnitTests;

public class DbInitializerTests
{
    [Fact]
    public async Task InitializeAsync_WhenDefaultRolesAreMissing_ShouldCreateThem()
    {
        var roleManagerMock = CreateRoleManagerMock();
        roleManagerMock.Setup(x => x.RoleExistsAsync("Customer")).ReturnsAsync(false);
        roleManagerMock.Setup(x => x.RoleExistsAsync("Admin")).ReturnsAsync(false);
        roleManagerMock.Setup(x => x.RoleExistsAsync("Supplier")).ReturnsAsync(false);
        roleManagerMock.Setup(x => x.CreateAsync(It.IsAny<IdentityRole<Guid>>()))
            .ReturnsAsync(IdentityResult.Success);

        var serviceProviderMock = CreateServiceProviderMock(roleManagerMock.Object);

        await DbInitializer.InitializeAsync(serviceProviderMock.Object);

        roleManagerMock.Verify(x => x.CreateAsync(It.Is<IdentityRole<Guid>>(r => r.Name == "Customer")), Times.Once);
        roleManagerMock.Verify(x => x.CreateAsync(It.Is<IdentityRole<Guid>>(r => r.Name == "Admin")), Times.Once);
        roleManagerMock.Verify(x => x.CreateAsync(It.Is<IdentityRole<Guid>>(r => r.Name == "Supplier")), Times.Once);
    }

    [Fact]
    public async Task InitializeAsync_WhenDefaultRolesAlreadyExist_ShouldNotCreateDuplicates()
    {
        var roleManagerMock = CreateRoleManagerMock();
        roleManagerMock.Setup(x => x.RoleExistsAsync(It.IsAny<string>())).ReturnsAsync(true);

        var serviceProviderMock = CreateServiceProviderMock(roleManagerMock.Object);

        await DbInitializer.InitializeAsync(serviceProviderMock.Object);

        roleManagerMock.Verify(x => x.CreateAsync(It.IsAny<IdentityRole<Guid>>()), Times.Never);
    }

    [Fact]
    public async Task InitializeAsync_WithDemoDataEnabled_ShouldSeedCoreDemoRecords()
    {
        var context = CreateContext();
        var roleManagerMock = CreateRoleManagerMock();
        var userManagerMock = CreateUserManagerMock(context);

        roleManagerMock.Setup(x => x.RoleExistsAsync(It.IsAny<string>())).ReturnsAsync(false);
        roleManagerMock.Setup(x => x.CreateAsync(It.IsAny<IdentityRole<Guid>>()))
            .ReturnsAsync(IdentityResult.Success);

        var serviceProviderMock = CreateServiceProviderMock(roleManagerMock.Object, userManagerMock.Object, context);

        await DbInitializer.InitializeAsync(serviceProviderMock.Object, seedDemoData: true);

        Assert.Equal(3, await context.Vehicles.CountAsync());
        Assert.Equal(9, await context.VehicleImages.CountAsync());
        Assert.Equal(5, await context.VehicleFeatures.CountAsync());
        Assert.Equal(3, await context.UserAddresses.CountAsync());
        Assert.Equal(2, await context.Bookings.CountAsync());
        Assert.Equal(2, await context.Reviews.CountAsync());
        Assert.True(await context.CompanyProfiles.AnyAsync());
        Assert.True(await context.Users.AnyAsync(u => u.Email == "supplier.demo@ares.local"));
        Assert.True(await context.Users.AnyAsync(u => u.Email == "customer.demo@ares.local"));
    }

    private static Mock<RoleManager<IdentityRole<Guid>>> CreateRoleManagerMock()
    {
        var store = new Mock<IRoleStore<IdentityRole<Guid>>>();
        return new Mock<RoleManager<IdentityRole<Guid>>>(store.Object, null!, null!, null!, null!);
    }

    private static Mock<IServiceProvider> CreateServiceProviderMock(RoleManager<IdentityRole<Guid>> roleManager)
    {
        var context = CreateContext();
        var userManager = CreateUserManagerMock(context);

        return CreateServiceProviderMock(roleManager, userManager.Object, context);
    }

    private static Mock<UserManager<ApplicationUser>> CreateUserManagerMock(ApplicationDbContext context)
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            store.Object,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!);

        userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((string email) => context.Users.FirstOrDefault(user => user.Email == email));

        userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .Callback<ApplicationUser, string>((user, _) => context.Users.Add(user))
            .ReturnsAsync(IdentityResult.Success);

        userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        return userManagerMock;
    }

    private static Mock<IServiceProvider> CreateServiceProviderMock(
        RoleManager<IdentityRole<Guid>> roleManager,
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context)
    {
        var logger = new Mock<ILogger<ApplicationDbContext>>();
        var serviceProvider = new Mock<IServiceProvider>();

        serviceProvider.Setup(x => x.GetService(typeof(RoleManager<IdentityRole<Guid>>)))
            .Returns(roleManager);
        serviceProvider.Setup(x => x.GetService(typeof(UserManager<ApplicationUser>)))
            .Returns(userManager);
        serviceProvider.Setup(x => x.GetService(typeof(ApplicationDbContext)))
            .Returns(context);
        serviceProvider.Setup(x => x.GetService(typeof(ILogger<ApplicationDbContext>)))
            .Returns(logger.Object);

        return serviceProvider;
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }
}