using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Location;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Moq;
using Xunit;

namespace Backend.Tests.UnitTests;

/// <summary>
/// Unit tests for LocationService functionality.
/// Tests autocomplete functionality, minimum character requirements, and case-insensitive matching.
/// </summary>
public class LocationServiceTests
{
    private readonly Mock<ILocationRepository> _locationRepositoryMock;
    private readonly LocationService _locationService;

    public LocationServiceTests()
    {
        _locationRepositoryMock = new Mock<ILocationRepository>();
        _locationService = new LocationService(_locationRepositoryMock.Object);
    }

    #region AutocompleteAsync Tests

    [Fact]
    public async Task AutocompleteAsync_WithValidQuery_ShouldReturnMatchingSuggestions()
    {
        // Arrange
        var query = "New York";
        var userId = Guid.NewGuid();
        var locations = new List<UserAddress>
        {
            new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AddressLine = "123 Main St",
                City = "New York",
                Governorate = "NY",
                Country = "USA",
                PostalCode = "10001",
                IsPrimary = true
            },
            new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AddressLine = "456 Broadway",
                City = "New York",
                Governorate = "NY",
                Country = "USA",
                PostalCode = "10002",
                IsPrimary = false
            }
        };

        _locationRepositoryMock.Setup(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(locations);

        // Act
        var result = await _locationService.AutocompleteAsync(query, null);
        var suggestions = result.ToList();

        // Assert
        Assert.NotNull(suggestions);
        Assert.Equal(2, suggestions.Count);

        var firstSuggestion = suggestions[0];
        Assert.NotEqual(Guid.Empty, firstSuggestion.LocationId);
        Assert.Equal("New York, NY, USA", firstSuggestion.DisplayText);
        Assert.Equal("123 Main St, New York, NY, USA, 10001", firstSuggestion.Address);
        Assert.Equal("primary", firstSuggestion.LocationType);
        Assert.Null(firstSuggestion.Distance);
        Assert.False(firstSuggestion.IsLandmark);

        var secondSuggestion = suggestions[1];
        Assert.Equal("address", secondSuggestion.LocationType);

        _locationRepositoryMock.Verify(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("  ")]
    public async Task AutocompleteAsync_WithEmptyOrWhitespaceQuery_ShouldReturnEmptyResults(string query)
    {
        // Act
        var result = await _locationService.AutocompleteAsync(query, null);
        var suggestions = result.ToList();

        // Assert
        Assert.NotNull(suggestions);
        Assert.Empty(suggestions);

        _locationRepositoryMock.Verify(x => x.AutocompleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AutocompleteAsync_WithNullQuery_ShouldReturnEmptyResults()
    {
        // Act
        var result = await _locationService.AutocompleteAsync(null!, null);
        var suggestions = result.ToList();

        // Assert
        Assert.NotNull(suggestions);
        Assert.Empty(suggestions);

        _locationRepositoryMock.Verify(x => x.AutocompleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData("a")]
    [InlineData("ab")]
    public async Task AutocompleteAsync_WithQueryLessThanThreeCharacters_ShouldReturnEmptyResults(string query)
    {
        // Act
        var result = await _locationService.AutocompleteAsync(query, null);
        var suggestions = result.ToList();

        // Assert
        Assert.NotNull(suggestions);
        Assert.Empty(suggestions);

        _locationRepositoryMock.Verify(x => x.AutocompleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData("  a  ")]
    [InlineData("  ab  ")]
    public async Task AutocompleteAsync_WithWhitespaceAroundShortQuery_ShouldCallRepository(string query)
    {
        // Arrange
        var locations = new List<UserAddress>();
        _locationRepositoryMock.Setup(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(locations);

        // Act
        var result = await _locationService.AutocompleteAsync(query, null);
        var suggestions = result.ToList();

        // Assert
        Assert.NotNull(suggestions);
        Assert.Empty(suggestions);

        // Note: These queries have length >= 3 and contain non-whitespace characters, so repository should be called
        _locationRepositoryMock.Verify(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AutocompleteAsync_WithMinimumValidQuery_ShouldCallRepository()
    {
        // Arrange
        var query = "abc"; // Exactly 3 characters
        var locations = new List<UserAddress>();

        _locationRepositoryMock.Setup(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(locations);

        // Act
        var result = await _locationService.AutocompleteAsync(query, null);
        var suggestions = result.ToList();

        // Assert
        Assert.NotNull(suggestions);
        Assert.Empty(suggestions);

        _locationRepositoryMock.Verify(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AutocompleteAsync_WithVariousQueryStrings_ShouldHandleAllCases()
    {
        // Arrange
        var testCases = new[]
        {
            "London",
            "San Francisco",
            "New York City",
            "Los Angeles, CA",
            "123 Main Street",
            "Downtown Area"
        };

        foreach (var query in testCases)
        {
            var locations = new List<UserAddress>
            {
                new UserAddress
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    City = query,
                    Country = "Test Country",
                    IsPrimary = false
                }
            };

            _locationRepositoryMock.Setup(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()))
                .ReturnsAsync(locations);

            // Act
            var result = await _locationService.AutocompleteAsync(query, null);
            var suggestions = result.ToList();

            // Assert
            Assert.NotNull(suggestions);
            Assert.Single(suggestions);
            Assert.Contains(query, suggestions[0].DisplayText);
        }

        _locationRepositoryMock.Verify(x => x.AutocompleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(testCases.Length));
    }

    [Fact]
    public async Task AutocompleteAsync_WithSpecialCharacters_ShouldHandleGracefully()
    {
        // Arrange
        var query = "São Paulo"; // Contains special characters
        var locations = new List<UserAddress>
        {
            new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                City = "São Paulo",
                Country = "Brazil",
                IsPrimary = false
            }
        };

        _locationRepositoryMock.Setup(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(locations);

        // Act
        var result = await _locationService.AutocompleteAsync(query, null);
        var suggestions = result.ToList();

        // Assert
        Assert.NotNull(suggestions);
        Assert.Single(suggestions);
        Assert.Contains("São Paulo", suggestions[0].DisplayText);

        _locationRepositoryMock.Verify(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AutocompleteAsync_WithLongQuery_ShouldHandleGracefully()
    {
        // Arrange
        var query = "This is a very long location query that might be used to test the system's ability to handle extended search terms";
        var locations = new List<UserAddress>();

        _locationRepositoryMock.Setup(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(locations);

        // Act
        var result = await _locationService.AutocompleteAsync(query, null);
        var suggestions = result.ToList();

        // Assert
        Assert.NotNull(suggestions);
        Assert.Empty(suggestions);

        _locationRepositoryMock.Verify(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region DisplayText and Address Building Tests

    [Fact]
    public async Task AutocompleteAsync_ShouldBuildCorrectDisplayText()
    {
        // Arrange
        var query = "test";
        var locations = new List<UserAddress>
        {
            // Location with all fields
            new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                City = "New York",
                Governorate = "NY",
                Country = "USA",
                IsPrimary = false
            },
            // Location with missing governorate
            new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                City = "London",
                Country = "UK",
                IsPrimary = false
            },
            // Location with only country
            new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Country = "Canada",
                IsPrimary = false
            },
            // Location with no location fields
            new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                AddressLine = "123 Main St",
                IsPrimary = false
            }
        };

        _locationRepositoryMock.Setup(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(locations);

        // Act
        var result = await _locationService.AutocompleteAsync(query, null);
        var suggestions = result.ToList();

        // Assert
        Assert.Equal(4, suggestions.Count);
        Assert.Equal("New York, NY, USA", suggestions[0].DisplayText);
        Assert.Equal("London, UK", suggestions[1].DisplayText);
        Assert.Equal("Canada", suggestions[2].DisplayText);
        Assert.Equal("Unknown Location", suggestions[3].DisplayText);
    }

    [Fact]
    public async Task AutocompleteAsync_ShouldBuildCorrectAddress()
    {
        // Arrange
        var query = "test";
        var locations = new List<UserAddress>
        {
            new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                AddressLine = "123 Main Street",
                City = "New York",
                Governorate = "NY",
                Country = "USA",
                PostalCode = "10001",
                IsPrimary = false
            },
            new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                City = "London",
                Country = "UK",
                IsPrimary = false
            }
        };

        _locationRepositoryMock.Setup(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(locations);

        // Act
        var result = await _locationService.AutocompleteAsync(query, null);
        var suggestions = result.ToList();

        // Assert
        Assert.Equal(2, suggestions.Count);
        Assert.Equal("123 Main Street, New York, NY, USA, 10001", suggestions[0].Address);
        Assert.Equal("London, UK", suggestions[1].Address);
    }

    [Fact]
    public async Task AutocompleteAsync_ShouldSetCorrectLocationType()
    {
        // Arrange
        var query = "test";
        var locations = new List<UserAddress>
        {
            new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                City = "Primary Location",
                IsPrimary = true
            },
            new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                City = "Secondary Location",
                IsPrimary = false
            }
        };

        _locationRepositoryMock.Setup(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(locations);

        // Act
        var result = await _locationService.AutocompleteAsync(query, null);
        var suggestions = result.ToList();

        // Assert
        Assert.Equal(2, suggestions.Count);
        Assert.Equal("primary", suggestions[0].LocationType);
        Assert.Equal("address", suggestions[1].LocationType);
    }

    #endregion

    #region GetLocationsAsync Tests

    [Fact]
    public async Task GetLocationsAsync_ShouldReturnPagedResults()
    {
        // Arrange
        var page = 1;
        var pageSize = 10;
        var locations = new List<UserAddress>
        {
            new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                AddressLine = "123 Main St",
                City = "New York",
                Governorate = "NY",
                Country = "USA",
                PostalCode = "10001",
                IsPrimary = true,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow
            }
        };

        var pagedResult = new PagedResult<UserAddress>(
            Data: locations,
            Page: page,
            PageSize: pageSize,
            TotalCount: 1,
            TotalPages: 1);

        _locationRepositoryMock.Setup(x => x.GetPagedAsync(
            page,
            pageSize,
            null,
            It.IsAny<Func<IQueryable<UserAddress>, IOrderedQueryable<UserAddress>>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _locationService.GetLocationsAsync(page, pageSize);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(page, result.Page);
        Assert.Equal(pageSize, result.PageSize);
        Assert.Equal(1, result.TotalCount);
        Assert.Equal(1, result.TotalPages);
        Assert.Single(result.Data);

        var locationDto = result.Data.First();
        Assert.Equal(locations[0].Id, locationDto.Id);
        Assert.Equal(locations[0].AddressLine, locationDto.AddressLine);
        Assert.Equal(locations[0].City, locationDto.City);
        Assert.Equal(locations[0].IsPrimary, locationDto.IsPrimary);

        _locationRepositoryMock.Verify(x => x.GetPagedAsync(
            page,
            pageSize,
            null,
            It.IsAny<Func<IQueryable<UserAddress>, IOrderedQueryable<UserAddress>>>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region CreateLocationAsync Tests

    [Fact]
    public async Task CreateLocationAsync_WithValidRequest_ShouldCreateAndReturnLocation()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new CreateLocationRequest(
            UserId: userId,
            AddressLine: "123 Test Street",
            City: "Test City",
            Governorate: "Test State",
            Country: "Test Country",
            PostalCode: "12345",
            Latitude: 40.7128m,
            Longitude: -74.0060m,
            IsPrimary: true);

        var createdLocation = new UserAddress
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AddressLine = request.AddressLine,
            City = request.City,
            Governorate = request.Governorate,
            Country = request.Country,
            PostalCode = request.PostalCode,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            IsPrimary = request.IsPrimary,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _locationRepositoryMock.Setup(x => x.AddAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdLocation);

        _locationRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _locationService.CreateLocationAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(createdLocation.Id, result.Id);
        Assert.Equal(request.AddressLine, result.AddressLine);
        Assert.Equal(request.City, result.City);
        Assert.Equal(request.Governorate, result.Governorate);
        Assert.Equal(request.Country, result.Country);
        Assert.Equal(request.PostalCode, result.PostalCode);
        Assert.Equal(request.Latitude, result.Latitude);
        Assert.Equal(request.Longitude, result.Longitude);
        Assert.Equal(request.IsPrimary, result.IsPrimary);

        _locationRepositoryMock.Verify(x => x.AddAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()), Times.Once);
        _locationRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region UpdateLocationAsync Tests

    [Fact]
    public async Task UpdateLocationAsync_WithValidRequest_ShouldUpdateAndReturnLocation()
    {
        // Arrange
        var locationId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var request = new UpdateLocationRequest(
            AddressLine: "456 Updated Street",
            City: "Updated City",
            Governorate: "Updated State",
            Country: "Updated Country",
            PostalCode: "54321",
            Latitude: 34.0522m,
            Longitude: -118.2437m,
            IsPrimary: false);

        var existingLocation = new UserAddress
        {
            Id = locationId,
            UserId = userId,
            AddressLine = "123 Old Street",
            City = "Old City",
            Governorate = "Old State",
            Country = "Old Country",
            PostalCode = "12345",
            Latitude = 40.7128m,
            Longitude = -74.0060m,
            IsPrimary = true,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };

        _locationRepositoryMock.Setup(x => x.GetByIdAsync(locationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingLocation);

        _locationRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _locationRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _locationService.UpdateLocationAsync(locationId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(locationId, result.Id);
        Assert.Equal(request.AddressLine, result.AddressLine);
        Assert.Equal(request.City, result.City);
        Assert.Equal(request.Governorate, result.Governorate);
        Assert.Equal(request.Country, result.Country);
        Assert.Equal(request.PostalCode, result.PostalCode);
        Assert.Equal(request.Latitude, result.Latitude);
        Assert.Equal(request.Longitude, result.Longitude);
        Assert.Equal(request.IsPrimary, result.IsPrimary);

        _locationRepositoryMock.Verify(x => x.GetByIdAsync(locationId, It.IsAny<CancellationToken>()), Times.Once);
        _locationRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()), Times.Once);
        _locationRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateLocationAsync_WithNonExistentLocation_ShouldThrowArgumentException()
    {
        // Arrange
        var locationId = Guid.NewGuid();
        var request = new UpdateLocationRequest(
            AddressLine: "456 Updated Street",
            City: "Updated City",
            Governorate: "Updated State",
            Country: "Updated Country",
            PostalCode: "54321",
            Latitude: 34.0522m,
            Longitude: -118.2437m,
            IsPrimary: false);

        _locationRepositoryMock.Setup(x => x.GetByIdAsync(locationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserAddress?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _locationService.UpdateLocationAsync(locationId, request));

        Assert.Contains($"Location with ID {locationId} not found", exception.Message);
        Assert.Equal("locationId", exception.ParamName);

        _locationRepositoryMock.Verify(x => x.GetByIdAsync(locationId, It.IsAny<CancellationToken>()), Times.Once);
        _locationRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()), Times.Never);
        _locationRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region Additional Authorization and Edge Case Tests

    [Fact]
    public async Task CreateLocationAsync_WithValidRequestAndAdminRole_ShouldSucceed()
    {
        // Arrange - This test verifies the service logic works correctly for admin operations
        // Authorization is enforced at the controller level with [Authorize(Roles = "Admin")]
        var userId = Guid.NewGuid();
        var request = new CreateLocationRequest(
            UserId: userId,
            AddressLine: "Admin Created Location",
            City: "Admin City",
            Governorate: "Admin State",
            Country: "Admin Country",
            PostalCode: "ADMIN1",
            Latitude: 45.0000m,
            Longitude: -75.0000m,
            IsPrimary: false);

        var createdLocation = new UserAddress
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AddressLine = request.AddressLine,
            City = request.City,
            Governorate = request.Governorate,
            Country = request.Country,
            PostalCode = request.PostalCode,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            IsPrimary = request.IsPrimary,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _locationRepositoryMock.Setup(x => x.AddAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdLocation);

        _locationRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _locationService.CreateLocationAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(createdLocation.Id, result.Id);
        Assert.Equal("Admin Created Location", result.AddressLine);
        Assert.Equal("Admin City", result.City);

        _locationRepositoryMock.Verify(x => x.AddAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()), Times.Once);
        _locationRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateLocationAsync_WithValidRequestAndAdminRole_ShouldSucceed()
    {
        // Arrange - This test verifies the service logic works correctly for admin operations
        // Authorization is enforced at the controller level with [Authorize(Roles = "Admin")]
        var locationId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var request = new UpdateLocationRequest(
            AddressLine: "Admin Updated Location",
            City: "Admin Updated City",
            Governorate: "Admin Updated State",
            Country: "Admin Updated Country",
            PostalCode: "ADMIN2",
            Latitude: 46.0000m,
            Longitude: -76.0000m,
            IsPrimary: true);

        var existingLocation = new UserAddress
        {
            Id = locationId,
            UserId = userId,
            AddressLine = "Original Location",
            City = "Original City",
            Governorate = "Original State",
            Country = "Original Country",
            PostalCode = "ORIG1",
            Latitude = 40.0000m,
            Longitude = -70.0000m,
            IsPrimary = false,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };

        _locationRepositoryMock.Setup(x => x.GetByIdAsync(locationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingLocation);

        _locationRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _locationRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _locationService.UpdateLocationAsync(locationId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(locationId, result.Id);
        Assert.Equal("Admin Updated Location", result.AddressLine);
        Assert.Equal("Admin Updated City", result.City);
        Assert.Equal("Admin Updated State", result.Governorate);
        Assert.Equal("Admin Updated Country", result.Country);
        Assert.Equal("ADMIN2", result.PostalCode);
        Assert.Equal(46.0000m, result.Latitude);
        Assert.Equal(-76.0000m, result.Longitude);
        Assert.True(result.IsPrimary);

        _locationRepositoryMock.Verify(x => x.GetByIdAsync(locationId, It.IsAny<CancellationToken>()), Times.Once);
        _locationRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()), Times.Once);
        _locationRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetLocationsAsync_WithDifferentPageSizes_ShouldReturnCorrectResults()
    {
        // Arrange - Test pagination with various page sizes
        var testCases = new[]
        {
            new { Page = 1, PageSize = 5, ExpectedCount = 5 },
            new { Page = 1, PageSize = 10, ExpectedCount = 10 },
            new { Page = 2, PageSize = 5, ExpectedCount = 5 },
            new { Page = 1, PageSize = 1, ExpectedCount = 1 }
        };

        foreach (var testCase in testCases)
        {
            var locations = CreateTestLocations(testCase.ExpectedCount);
            var pagedResult = new PagedResult<UserAddress>(
                Data: locations,
                Page: testCase.Page,
                PageSize: testCase.PageSize,
                TotalCount: testCase.ExpectedCount,
                TotalPages: 1);

            _locationRepositoryMock.Setup(x => x.GetPagedAsync(
                testCase.Page,
                testCase.PageSize,
                null,
                It.IsAny<Func<IQueryable<UserAddress>, IOrderedQueryable<UserAddress>>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(pagedResult);

            // Act
            var result = await _locationService.GetLocationsAsync(testCase.Page, testCase.PageSize);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(testCase.Page, result.Page);
            Assert.Equal(testCase.PageSize, result.PageSize);
            Assert.Equal(testCase.ExpectedCount, result.Data.Count);
        }
    }

    [Fact]
    public async Task CreateLocationAsync_WithRepositoryFailure_ShouldPropagateException()
    {
        // Arrange
        var request = new CreateLocationRequest(
            UserId: Guid.NewGuid(),
            AddressLine: "Test Location",
            City: "Test City",
            Governorate: "Test State",
            Country: "Test Country",
            PostalCode: "12345",
            Latitude: 40.0000m,
            Longitude: -70.0000m,
            IsPrimary: false);

        var expectedException = new InvalidOperationException("Database save failed");

        _locationRepositoryMock.Setup(x => x.AddAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(expectedException);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _locationService.CreateLocationAsync(request));

        Assert.Equal(expectedException.Message, exception.Message);
        _locationRepositoryMock.Verify(x => x.AddAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()), Times.Once);
        _locationRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateLocationAsync_WithRepositoryFailure_ShouldPropagateException()
    {
        // Arrange
        var locationId = Guid.NewGuid();
        var request = new UpdateLocationRequest(
            AddressLine: "Updated Location",
            City: "Updated City",
            Governorate: "Updated State",
            Country: "Updated Country",
            PostalCode: "54321",
            Latitude: 41.0000m,
            Longitude: -71.0000m,
            IsPrimary: true);

        var existingLocation = new UserAddress
        {
            Id = locationId,
            UserId = Guid.NewGuid(),
            AddressLine = "Original Location",
            City = "Original City"
        };

        var expectedException = new InvalidOperationException("Database update failed");

        _locationRepositoryMock.Setup(x => x.GetByIdAsync(locationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingLocation);

        _locationRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(expectedException);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _locationService.UpdateLocationAsync(locationId, request));

        Assert.Equal(expectedException.Message, exception.Message);
        _locationRepositoryMock.Verify(x => x.GetByIdAsync(locationId, It.IsAny<CancellationToken>()), Times.Once);
        _locationRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()), Times.Once);
        _locationRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(0, 10)] // Invalid page
    [InlineData(-1, 10)] // Negative page
    [InlineData(1, 0)] // Invalid page size
    [InlineData(1, -1)] // Negative page size
    [InlineData(1, 101)] // Page size too large
    public async Task GetLocationsAsync_WithInvalidPaginationParameters_ShouldHandleGracefully(int page, int pageSize)
    {
        // Arrange - These invalid parameters would be caught at the controller level
        // but we test that the service can handle them gracefully if they somehow get through
        var emptyResult = new PagedResult<UserAddress>(
            Data: new List<UserAddress>(),
            Page: Math.Max(1, page),
            PageSize: Math.Min(Math.Max(1, pageSize), 100),
            TotalCount: 0,
            TotalPages: 0);

        _locationRepositoryMock.Setup(x => x.GetPagedAsync(
            It.IsAny<int>(),
            It.IsAny<int>(),
            null,
            It.IsAny<Func<IQueryable<UserAddress>, IOrderedQueryable<UserAddress>>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyResult);

        // Act - The service should handle these gracefully
        var result = await _locationService.GetLocationsAsync(page, pageSize);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.Data);
    }

    private List<UserAddress> CreateTestLocations(int count)
    {
        var locations = new List<UserAddress>();
        for (int i = 0; i < count; i++)
        {
            locations.Add(new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                AddressLine = $"Test Address {i + 1}",
                City = $"Test City {i + 1}",
                Governorate = $"Test State {i + 1}",
                Country = $"Test Country {i + 1}",
                PostalCode = $"1000{i}",
                Latitude = 40.0000m + i,
                Longitude = -70.0000m - i,
                IsPrimary = i == 0,
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                UpdatedAt = DateTime.UtcNow.AddDays(-i)
            });
        }
        return locations;
    }

    #endregion

    #region Edge Cases and Error Handling Tests

    [Fact]
    public async Task AutocompleteAsync_WithRepositoryException_ShouldPropagateException()
    {
        // Arrange
        var query = "test query";
        var expectedException = new InvalidOperationException("Database connection failed");

        _locationRepositoryMock.Setup(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()))
            .ThrowsAsync(expectedException);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _locationService.AutocompleteAsync(query, null));

        Assert.Equal(expectedException.Message, exception.Message);
        _locationRepositoryMock.Verify(x => x.AutocompleteAsync(query, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AutocompleteAsync_WithCancellationToken_ShouldPassTokenToRepository()
    {
        // Arrange
        var query = "test";
        var cancellationToken = new CancellationToken();
        var locations = new List<UserAddress>();

        _locationRepositoryMock.Setup(x => x.AutocompleteAsync(query, cancellationToken))
            .ReturnsAsync(locations);

        // Act
        await _locationService.AutocompleteAsync(query, null, cancellationToken);

        // Assert
        _locationRepositoryMock.Verify(x => x.AutocompleteAsync(query, cancellationToken), Times.Once);
    }

    #endregion
}