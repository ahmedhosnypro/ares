using Backend.Application.DTOs.Location;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Backend.Infrastructure.Repositories;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests.PropertyTests;

/// <summary>
/// Property-based tests for location autocomplete functionality using FsCheck.
/// Each property validates universal correctness guarantees for location search across all valid inputs.
/// </summary>
public class LocationAutocompletePropertyTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ILocationRepository _locationRepository;
    private readonly ILocationService _locationService;

    public LocationAutocompletePropertyTests()
    {
        // Setup in-memory database for testing
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _locationRepository = new LocationRepository(_context);
        _locationService = new LocationService(_locationRepository);

        // Ensure database is created
        _context.Database.EnsureCreated();
    }

    #region Property 6: Location autocomplete returns matching suggestions

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 6: Location autocomplete returns matching suggestions
    public bool LocationAutocompleteReturnsMatchingSuggestions(string queryGen, PositiveInt locationCountGen)
    {
        // Generate valid query string (minimum 3 characters)
        var query = GenerateValidQuery(queryGen);
        if (string.IsNullOrWhiteSpace(query) || query.Length < 3)
            return true; // Skip invalid queries

        var locationCount = Math.Min(locationCountGen.Get % 21, 20); // 0-20 locations

        try
        {
            // Clear any existing data
            _context.UserAddresses.RemoveRange(_context.UserAddresses);
            _context.Users.RemoveRange(_context.Users);
            _context.SaveChanges();

            // Create test user
            var userId = Guid.NewGuid();
            var user = new ApplicationUser
            {
                Id = userId,
                Email = $"test{userId}@example.com",
                FirstName = "Test",
                LastName = "User",
                UserName = $"test{userId}@example.com"
            };
            _context.Users.Add(user);

            // Create test locations with varying match scenarios
            var locations = new List<UserAddress>();
            var matchingLocations = 0;
            var queryLower = query.ToLower();

            for (int i = 0; i < locationCount; i++)
            {
                var shouldMatch = i % 3 == 0; // Every 3rd location should match
                var location = CreateTestLocation(userId, i, query, shouldMatch);

                if (shouldMatch)
                {
                    matchingLocations++;
                }

                locations.Add(location);
            }

            _context.UserAddresses.AddRange(locations);
            _context.SaveChanges();

            // Act - Get autocomplete suggestions
            var result = _locationService.AutocompleteAsync(query, null).Result;
            var suggestions = result.ToList();

            // Assert - Verify all returned suggestions match the query (case-insensitive)
            foreach (var suggestion in suggestions)
            {
                var displayTextMatches = suggestion.DisplayText.ToLower().Contains(queryLower);
                var addressMatches = suggestion.Address.ToLower().Contains(queryLower);

                if (!displayTextMatches && !addressMatches)
                {
                    return false; // Found a suggestion that doesn't match the query
                }
            }

            // Verify response format is correct
            foreach (var suggestion in suggestions)
            {
                if (suggestion.LocationId == Guid.Empty ||
                    string.IsNullOrEmpty(suggestion.DisplayText) ||
                    string.IsNullOrEmpty(suggestion.Address) ||
                    string.IsNullOrEmpty(suggestion.LocationType))
                {
                    return false; // Missing required fields
                }
            }

            return true;
        }
        catch
        {
            // If any exception occurs, the property fails
            return false;
        }
    }

    #endregion

    #region Additional Properties for Edge Cases

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Empty query returns empty results
    public bool EmptyQueryReturnsEmptyResults(string emptyQuery)
    {
        // Test with various empty/invalid queries
        var queries = new[] { null, "", " ", "  ", "a", "ab" };
        var testQuery = queries[Math.Abs(emptyQuery?.GetHashCode() ?? 0) % queries.Length];

        try
        {
            // Act
            var result = _locationService.AutocompleteAsync(testQuery ?? "", null).Result;
            var suggestions = result.ToList();

            // Assert - Should return empty for queries less than 3 characters
            return suggestions.Count == 0;
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Case insensitive matching works
    public bool CaseInsensitiveMatchingWorks(string baseQuery, bool useUpperCase)
    {
        var query = GenerateValidQuery(baseQuery);
        if (string.IsNullOrWhiteSpace(query) || query.Length < 3)
            return true;

        // Transform query case
        var testQuery = useUpperCase ? query.ToUpper() : query.ToLower();
        var originalQuery = useUpperCase ? query.ToLower() : query.ToUpper();

        try
        {
            // Clear existing data
            _context.UserAddresses.RemoveRange(_context.UserAddresses);
            _context.Users.RemoveRange(_context.Users);
            _context.SaveChanges();

            // Create test user
            var userId = Guid.NewGuid();
            var user = new ApplicationUser
            {
                Id = userId,
                Email = $"test{userId}@example.com",
                FirstName = "Test",
                LastName = "User",
                UserName = $"test{userId}@example.com"
            };
            _context.Users.Add(user);

            // Create location with original case
            var location = new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AddressLine = $"Address with {originalQuery}",
                City = $"City {originalQuery}",
                Governorate = "Test Governorate",
                Country = "Test Country",
                IsPrimary = false
            };
            _context.UserAddresses.Add(location);
            _context.SaveChanges();

            // Act - Search with different case
            var result = _locationService.AutocompleteAsync(testQuery, null).Result;
            var suggestions = result.ToList();

            // Assert - Should find the location regardless of case
            return suggestions.Count > 0;
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Special characters are handled properly
    public bool SpecialCharactersHandledProperly(string specialQuery)
    {
        // Generate queries with special characters
        var specialChars = new[] { "@", "#", "$", "%", "&", "*", "(", ")", "-", "_", "+", "=", "[", "]", "{", "}", "|", "\\", ":", ";", "\"", "'", "<", ">", ",", ".", "?", "/" };
        var baseQuery = "test";
        var specialChar = specialChars[Math.Abs(specialQuery?.GetHashCode() ?? 0) % specialChars.Length];
        var query = baseQuery + specialChar + "location";

        try
        {
            // Act - Should not throw exception with special characters
            var result = _locationService.AutocompleteAsync(query, null).Result;
            var suggestions = result.ToList();

            // Assert - Should handle gracefully (return empty or valid results)
            return true; // If no exception thrown, property passes
        }
        catch
        {
            return false; // Exception indicates improper handling
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Long queries are handled properly
    public bool LongQueriesHandledProperly(PositiveInt lengthGen)
    {
        // Generate very long query strings
        var length = Math.Min(lengthGen.Get % 501 + 100, 600); // 100-600 characters
        var query = new string('a', length);

        try
        {
            // Act - Should handle long queries gracefully
            var result = _locationService.AutocompleteAsync(query, null).Result;
            var suggestions = result.ToList();

            // Assert - Should not throw exception and return valid results
            return true;
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Helper Methods

    private static string GenerateValidQuery(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return "test";

        // Ensure minimum 3 characters
        var baseQuery = input.Length >= 3 ? input.Substring(0, Math.Min(input.Length, 50)) : input + "test";

        // Clean up the query to be more realistic
        return baseQuery.Replace("\0", "").Replace("\n", "").Replace("\r", "").Trim();
    }

    private static UserAddress CreateTestLocation(Guid userId, int index, string query, bool shouldMatch)
    {
        var location = new UserAddress
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            IsPrimary = index == 0
        };

        if (shouldMatch)
        {
            // Create location that matches the query
            var matchType = index % 4;
            switch (matchType)
            {
                case 0:
                    location.AddressLine = $"Address containing {query}";
                    location.City = $"City {index}";
                    break;
                case 1:
                    location.AddressLine = $"Address {index}";
                    location.City = $"City with {query}";
                    break;
                case 2:
                    location.AddressLine = $"Address {index}";
                    location.City = $"City {index}";
                    location.Governorate = $"Governorate {query}";
                    break;
                case 3:
                    location.AddressLine = $"Address {index}";
                    location.City = $"City {index}";
                    location.Country = $"Country {query}";
                    break;
            }
        }
        else
        {
            // Create location that doesn't match the query
            location.AddressLine = $"Different Address {index}";
            location.City = $"Different City {index}";
            location.Governorate = $"Different Governorate {index}";
            location.Country = $"Different Country {index}";
        }

        // Set default values for required fields
        location.Governorate ??= "Default Governorate";
        location.Country ??= "Default Country";
        location.PostalCode = $"1234{index % 10}";

        return location;
    }

    #endregion

    public void Dispose()
    {
        _context.Dispose();
    }
}