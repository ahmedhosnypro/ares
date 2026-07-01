using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Api.Controllers;
using Backend.Application.DTOs.Common;
using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests.UnitTests
{
    public class CategoriesControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly CategoriesController _controller;

        public CategoriesControllerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _context.Database.EnsureCreated();
            _controller = new CategoriesController(_context);
        }

        // ─── GetAll ────────────────────────────────────────────────────────────

        [Fact]
        public async Task GetAll_WhenEmpty_ReturnsEmptyList()
        {
            var result = await _controller.GetAll(CancellationToken.None);

            var ok = Assert.IsType<OkObjectResult>(result);
            var list = Assert.IsAssignableFrom<IEnumerable<CategoryResponseDto>>(ok.Value);
            Assert.Empty(list);
        }

        [Fact]
        public async Task GetAll_WhenCategoriesExist_ReturnsAllOrderedByName()
        {
            _context.Categories.AddRange(
                new Category { Id = Guid.NewGuid(), Name = "Zebra", CommissionPercentage = 10, IsActive = true },
                new Category { Id = Guid.NewGuid(), Name = "Alpha", CommissionPercentage = 5, IsActive = true }
            );
            await _context.SaveChangesAsync();

            var result = await _controller.GetAll(CancellationToken.None);

            var ok = Assert.IsType<OkObjectResult>(result);
            var list = Assert.IsAssignableFrom<IEnumerable<CategoryResponseDto>>(ok.Value).ToList();
            Assert.Equal(2, list.Count);
            Assert.Equal("Alpha", list[0].Name);
            Assert.Equal("Zebra", list[1].Name);
        }

        // ─── Create ────────────────────────────────────────────────────────────

        [Fact]
        public async Task Create_WithValidData_ReturnsOkWithCategory()
        {
            var request = new CategoryDto
            {
                Name = "Economy",
                Description = "Budget-friendly vehicles",
                CommissionPercentage = 8.5m,
                IsActive = true
            };

            var result = await _controller.Create(request, CancellationToken.None);

            var ok = Assert.IsType<OkObjectResult>(result);
            var created = Assert.IsType<CategoryResponseDto>(ok.Value);
            Assert.Equal("Economy", created.Name);
            Assert.Equal(8.5m, created.CommissionPercentage);
            Assert.True(created.IsActive);
            Assert.NotEqual(Guid.Empty, created.Id);
        }

        [Fact]
        public async Task Create_PersistsToDatabase()
        {
            var request = new CategoryDto { Name = "Luxury", CommissionPercentage = 15m, IsActive = true };

            await _controller.Create(request, CancellationToken.None);

            var dbCategory = await _context.Categories.FirstOrDefaultAsync(c => c.Name == "Luxury");
            Assert.NotNull(dbCategory);
            Assert.Equal(15m, dbCategory.CommissionPercentage);
        }

        // ─── Update ────────────────────────────────────────────────────────────

        [Fact]
        public async Task Update_WithExistingId_ShouldSucceed()
        {
            var categoryId = Guid.NewGuid();
            _context.Categories.Add(new Category
            {
                Id = categoryId,
                Name = "Test Category",
                Description = "Test Description",
                CommissionPercentage = 5.0m,
                IsActive = true
            });
            await _context.SaveChangesAsync();

            var request = new CategoryDto
            {
                Name = "Updated Category",
                Description = "Updated Description",
                CommissionPercentage = 10.0m,
                IsActive = true
            };

            var result = await _controller.Update(categoryId, request, CancellationToken.None);

            var ok = Assert.IsType<OkObjectResult>(result);
            var updated = Assert.IsType<CategoryResponseDto>(ok.Value);
            Assert.Equal("Updated Category", updated.Name);
            Assert.Equal(10.0m, updated.CommissionPercentage);
        }

        [Fact]
        public async Task Update_WithNonExistingId_ReturnsNotFound()
        {
            var request = new CategoryDto { Name = "Ghost", CommissionPercentage = 10m, IsActive = true };

            var result = await _controller.Update(Guid.NewGuid(), request, CancellationToken.None);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Update_CanDeactivateCategory()
        {
            var categoryId = Guid.NewGuid();
            _context.Categories.Add(new Category
            {
                Id = categoryId,
                Name = "Active Category",
                CommissionPercentage = 5.0m,
                IsActive = true
            });
            await _context.SaveChangesAsync();

            var request = new CategoryDto { Name = "Active Category", CommissionPercentage = 5.0m, IsActive = false };
            var result = await _controller.Update(categoryId, request, CancellationToken.None);

            var ok = Assert.IsType<OkObjectResult>(result);
            var updated = Assert.IsType<CategoryResponseDto>(ok.Value);
            Assert.False(updated.IsActive);
        }

        // ─── Delete ────────────────────────────────────────────────────────────

        [Fact]
        public async Task Delete_EmptyCategory_ReturnsNoContent()
        {
            var categoryId = Guid.NewGuid();
            _context.Categories.Add(new Category { Id = categoryId, Name = "Empty", CommissionPercentage = 5m, IsActive = true });
            await _context.SaveChangesAsync();

            var result = await _controller.Delete(categoryId, CancellationToken.None);

            Assert.IsType<NoContentResult>(result);
            Assert.False(await _context.Categories.AnyAsync(c => c.Id == categoryId));
        }

        [Fact]
        public async Task Delete_NonExistingCategory_ReturnsNotFound()
        {
            var result = await _controller.Delete(Guid.NewGuid(), CancellationToken.None);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Delete_CategoryWithVehicles_ReturnsBadRequest()
        {
            var userId = Guid.NewGuid();
            _context.Users.Add(new ApplicationUser
            {
                Id = userId,
                Email = $"owner-{userId}@test.com",
                UserName = $"owner-{userId}@test.com",
                FirstName = "Owner",
                LastName = "Test"
            });

            var categoryId = Guid.NewGuid();
            _context.Categories.Add(new Category { Id = categoryId, Name = "In Use", CommissionPercentage = 5m, IsActive = true });

            _context.Vehicles.Add(new Vehicle
            {
                Id = Guid.NewGuid(),
                CategoryId = categoryId,
                UserId = userId,
                Make = "Toyota",
                Model = "Camry",
                Year = 2022,
                Color = "White",
                LicensePlate = "ABC-123",
                Transmission = "Automatic",
                FuelType = "Gasoline",
                Seats = 5,
                PricePerDay = 50m,
                Status = "available",
                AvailabilityStatus = "Available",
                IsActive = true
            });
            await _context.SaveChangesAsync();

            var result = await _controller.Delete(categoryId, CancellationToken.None);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ─── GetDetails ─────────────────────────────────────────────────────────

        [Fact]
        public async Task GetDetails_WithExistingId_ReturnsCategory()
        {
            var categoryId = Guid.NewGuid();
            _context.Categories.Add(new Category
            {
                Id = categoryId,
                Name = "Premium",
                Description = "Premium vehicles",
                CommissionPercentage = 12m,
                IsActive = true
            });
            await _context.SaveChangesAsync();

            var result = await _controller.GetDetails(categoryId, CancellationToken.None);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(ok.Value);
        }

        [Fact]
        public async Task GetDetails_WithNonExistingId_ReturnsNotFound()
        {
            var result = await _controller.GetDetails(Guid.NewGuid(), CancellationToken.None);

            Assert.IsType<NotFoundResult>(result);
        }

        // ─── GetSummary ─────────────────────────────────────────────────────────

        [Fact]
        public async Task GetSummary_WhenEmpty_ReturnsZeroStats()
        {
            var result = await _controller.GetSummary(CancellationToken.None);

            var ok = Assert.IsType<OkObjectResult>(result);
            var stats = Assert.IsType<AdminCategoryStatsDto>(ok.Value);
            Assert.Equal(0, stats.TotalCategories);
            Assert.Equal(0, stats.TotalVehicles);
            Assert.Equal(0, stats.CategoriesWithOffers);
        }

        [Fact]
        public async Task GetSummary_WithCategories_ReturnsCorrectCount()
        {
            _context.Categories.AddRange(
                new Category { Id = Guid.NewGuid(), Name = "Cat1", CommissionPercentage = 10m, IsActive = true },
                new Category { Id = Guid.NewGuid(), Name = "Cat2", CommissionPercentage = 20m, IsActive = true }
            );
            await _context.SaveChangesAsync();

            var result = await _controller.GetSummary(CancellationToken.None);

            var ok = Assert.IsType<OkObjectResult>(result);
            var stats = Assert.IsType<AdminCategoryStatsDto>(ok.Value);
            Assert.Equal(2, stats.TotalCategories);
            Assert.Equal(15m, stats.AverageCommission);
        }

        // ─── Search ─────────────────────────────────────────────────────────────

        [Fact]
        public async Task Search_ByName_ReturnsMatchingCategories()
        {
            _context.Categories.AddRange(
                new Category { Id = Guid.NewGuid(), Name = "Economy Class", CommissionPercentage = 5m, IsActive = true },
                new Category { Id = Guid.NewGuid(), Name = "Business Class", CommissionPercentage = 12m, IsActive = true },
                new Category { Id = Guid.NewGuid(), Name = "First Class", CommissionPercentage = 20m, IsActive = true }
            );
            await _context.SaveChangesAsync();

            var result = await _controller.Search("economy", null, null, null, 1, 10, CancellationToken.None);

            var ok = result.Result as OkObjectResult;
            Assert.NotNull(ok);
        }

        [Fact]
        public async Task Search_ActiveStatusFilter_ReturnsOnlyActiveCategories()
        {
            _context.Categories.AddRange(
                new Category { Id = Guid.NewGuid(), Name = "Active Cat", CommissionPercentage = 5m, IsActive = true },
                new Category { Id = Guid.NewGuid(), Name = "Inactive Cat", CommissionPercentage = 5m, IsActive = false }
            );
            await _context.SaveChangesAsync();

            var result = await _controller.Search(null, "Active", null, null, 1, 10, CancellationToken.None);

            var ok = result.Result as OkObjectResult;
            Assert.NotNull(ok);
            var paged = ok.Value as PagedResult<AdminCategoryListDto>;
            Assert.NotNull(paged);
            Assert.All(paged.Data, c => Assert.True(c.IsActive));
        }

        [Fact]
        public async Task Search_InactiveStatusFilter_ReturnsOnlyInactiveCategories()
        {
            _context.Categories.AddRange(
                new Category { Id = Guid.NewGuid(), Name = "Active Cat", CommissionPercentage = 5m, IsActive = true },
                new Category { Id = Guid.NewGuid(), Name = "Inactive Cat 1", CommissionPercentage = 5m, IsActive = false },
                new Category { Id = Guid.NewGuid(), Name = "Inactive Cat 2", CommissionPercentage = 5m, IsActive = false }
            );
            await _context.SaveChangesAsync();

            var result = await _controller.Search(null, "Inactive", null, null, 1, 10, CancellationToken.None);

            var ok = result.Result as OkObjectResult;
            Assert.NotNull(ok);
            var paged = ok.Value as PagedResult<AdminCategoryListDto>;
            Assert.NotNull(paged);
            Assert.Equal(2, paged.TotalCount);
            Assert.All(paged.Data, c => Assert.False(c.IsActive));
        }

        [Fact]
        public async Task Search_Pagination_RespectsPageSize()
        {
            for (int i = 0; i < 15; i++)
            {
                _context.Categories.Add(new Category
                {
                    Id = Guid.NewGuid(),
                    Name = $"Category {i:D2}",
                    CommissionPercentage = 5m,
                    IsActive = true
                });
            }
            await _context.SaveChangesAsync();

            var result = await _controller.Search(null, null, null, null, 1, 5, CancellationToken.None);

            var ok = result.Result as OkObjectResult;
            Assert.NotNull(ok);
            var paged = ok.Value as PagedResult<AdminCategoryListDto>;
            Assert.NotNull(paged);
            Assert.Equal(5, paged.Data.Count);
            Assert.Equal(15, paged.TotalCount);
            Assert.Equal(3, paged.TotalPages);
        }

        // ─── BulkAssign ─────────────────────────────────────────────────────────

        [Fact]
        public async Task BulkAssign_WithValidCategoryAndVehicles_ReturnsOk()
        {
            var userId = Guid.NewGuid();
            _context.Users.Add(new ApplicationUser
            {
                Id = userId,
                Email = $"user-{userId}@test.com",
                UserName = $"user-{userId}@test.com",
                FirstName = "Test",
                LastName = "User"
            });

            var categoryId = Guid.NewGuid();
            _context.Categories.Add(new Category { Id = categoryId, Name = "Target", CommissionPercentage = 5m, IsActive = true });

            var vehicleId = Guid.NewGuid();
            _context.Vehicles.Add(new Vehicle
            {
                Id = vehicleId,
                UserId = userId,
                Make = "Honda",
                Model = "Civic",
                Year = 2023,
                Color = "Blue",
                LicensePlate = "XYZ-999",
                Transmission = "Automatic",
                FuelType = "Gasoline",
                Seats = 5,
                PricePerDay = 40m,
                Status = "available",
                AvailabilityStatus = "Available",
                IsActive = true
            });
            await _context.SaveChangesAsync();

            var request = new BulkAssignDto { CategoryId = categoryId, VehicleIds = [vehicleId] };
            var result = await _controller.BulkAssign(request, CancellationToken.None);

            Assert.IsType<OkObjectResult>(result);
            var vehicle = await _context.Vehicles.FindAsync(vehicleId);
            Assert.Equal(categoryId, vehicle!.CategoryId);
        }

        [Fact]
        public async Task BulkAssign_WithNonExistingCategory_ReturnsNotFound()
        {
            var request = new BulkAssignDto { CategoryId = Guid.NewGuid(), VehicleIds = [Guid.NewGuid()] };

            var result = await _controller.BulkAssign(request, CancellationToken.None);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
