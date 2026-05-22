using Backend.Application.DTOs.Common;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Backend.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests.UnitTests;

public class RepositoryPaginationDebugTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IBookingRepository _bookingRepository;

    public RepositoryPaginationDebugTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _bookingRepository = new BookingRepository(_context);
        _context.Database.EnsureCreated();
    }

    [Fact]
    public async Task EmptyResultSet_WithPage1PageSize1_ShouldReturnCorrectMetadata()
    {
        // Arrange - ensure empty database
        var page = 1;
        var pageSize = 1;

        // Act
        var result = await _bookingRepository.GetPagedAsync(page, pageSize);

        // Debug output
        System.Console.WriteLine($"TotalCount: {result.TotalCount}");
        System.Console.WriteLine($"Page: {result.Page}");
        System.Console.WriteLine($"PageSize: {result.PageSize}");
        System.Console.WriteLine($"TotalPages: {result.TotalPages}");
        System.Console.WriteLine($"HasPreviousPage: {result.HasPreviousPage}");
        System.Console.WriteLine($"HasNextPage: {result.HasNextPage}");
        System.Console.WriteLine($"Data.Count: {result.Data.Count}");

        // Assert - Debug what we're getting
        Assert.Equal(0, result.TotalCount);
        Assert.Equal(1, result.Page);
        Assert.Equal(1, result.PageSize);
        Assert.Empty(result.Data);

        // Debug the failing assertion
        var expectedTotalPages = 0;
        var actualTotalPages = result.TotalPages;

        Assert.Equal(expectedTotalPages, actualTotalPages);
        Assert.False(result.HasPreviousPage);
        Assert.False(result.HasNextPage);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}