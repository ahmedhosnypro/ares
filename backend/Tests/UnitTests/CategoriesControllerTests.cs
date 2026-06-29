using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Api.Controllers;
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

        [Fact]
        public async Task UpdateCategory_ShouldSucceed()
        {
            // Arrange
            var categoryId = Guid.NewGuid();
            var category = new Category
            {
                Id = categoryId,
                Name = "Test Category",
                Description = "Test Description",
                CommissionPercentage = 5.0m,
                IsActive = true
            };
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            var request = new CategoryDto
            {
                Name = "Updated Category",
                Description = "Updated Description",
                CommissionPercentage = 10.0m,
                IsActive = true
            };

            // Act
            var result = await _controller.Update(categoryId, request, CancellationToken.None);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var updatedCategory = Assert.IsType<CategoryResponseDto>(okResult.Value);
            Assert.Equal("Updated Category", updatedCategory.Name);
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
