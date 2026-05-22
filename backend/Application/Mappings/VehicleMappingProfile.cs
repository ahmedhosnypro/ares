using AutoMapper;
using Backend.Application.DTOs.Vehicle;
using Backend.Application.DTOs.Location;
using Backend.Application.DTOs.Common;
using Backend.Domain.Entities;

namespace Backend.Application.Mappings;

/// <summary>
/// AutoMapper profile for vehicle-related mappings
/// Maps between domain entities and DTOs for vehicle operations
/// </summary>
public class VehicleMappingProfile : Profile
{
    public VehicleMappingProfile()
    {
        // Vehicle -> VehicleListDto
        CreateMap<Vehicle, VehicleListDto>()
            .ForMember(dest => dest.VehicleId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Make, opt => opt.MapFrom(src => src.Make))
            .ForMember(dest => dest.Model, opt => opt.MapFrom(src => src.Model))
            .ForMember(dest => dest.Category, opt => opt.Ignore()) // Not in Vehicle entity, set in service
            .ForMember(dest => dest.DailyRate, opt => opt.MapFrom(src => src.PricePerDay))
            .ForMember(dest => dest.Currency, opt => opt.MapFrom(src => "USD")) // Default currency
            .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.Images.FirstOrDefault() != null ? src.Images.First().ImageUrl : ""))
            .ForMember(dest => dest.Rating, opt => opt.Ignore()) // Calculated in service
            .ForMember(dest => dest.ReviewCount, opt => opt.Ignore()) // Calculated in service
            .ForMember(dest => dest.Distance, opt => opt.Ignore()) // Calculated in service
            .ForMember(dest => dest.Available, opt => opt.MapFrom(src => src.Status == "Available"));

        // Vehicle -> VehicleDetailsDto
        CreateMap<Vehicle, VehicleDetailsDto>()
            .ForMember(dest => dest.VehicleId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Make, opt => opt.MapFrom(src => src.Make))
            .ForMember(dest => dest.Model, opt => opt.MapFrom(src => src.Model))
            .ForMember(dest => dest.Year, opt => opt.MapFrom(src => src.Year))
            .ForMember(dest => dest.Color, opt => opt.MapFrom(src => src.Color))
            .ForMember(dest => dest.LicensePlate, opt => opt.MapFrom(src => src.LicensePlate))
            .ForMember(dest => dest.Transmission, opt => opt.MapFrom(src => src.Transmission))
            .ForMember(dest => dest.FuelType, opt => opt.MapFrom(src => src.FuelType))
            .ForMember(dest => dest.Seats, opt => opt.MapFrom(src => src.Seats))
            .ForMember(dest => dest.PricePerDay, opt => opt.MapFrom(src => src.PricePerDay))
            .ForMember(dest => dest.LocationCity, opt => opt.MapFrom(src => src.LocationCity))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
            .ForMember(dest => dest.AvailabilityStatus, opt => opt.MapFrom(src => src.AvailabilityStatus))
            .ForMember(dest => dest.Images, opt => opt.MapFrom(src => src.Images))
            .ForMember(dest => dest.Features, opt => opt.Ignore()) // VehicleFeatures not in current entity
            .ForMember(dest => dest.Supplier, opt => opt.MapFrom(src => src.User)) // User is the supplier
            .ForMember(dest => dest.AverageRating, opt => opt.Ignore()) // Calculated in service
            .ForMember(dest => dest.ReviewCount, opt => opt.Ignore()); // Calculated in service

        // VehicleImage -> VehicleImageDto
        CreateMap<VehicleImage, VehicleImageDto>()
            .ForMember(dest => dest.ImageId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Url, opt => opt.MapFrom(src => src.ImageUrl))
            .ForMember(dest => dest.Size, opt => opt.Ignore()) // Handled in service based on request
            .ForMember(dest => dest.IsPrimary, opt => opt.MapFrom(src => src.IsPrimary));

        // ApplicationUser -> SupplierDto (when user is a supplier)
        CreateMap<ApplicationUser, SupplierDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"));

        // UserAddress -> LocationSuggestionDto
        CreateMap<UserAddress, LocationSuggestionDto>()
            .ForMember(dest => dest.LocationId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.DisplayText, opt => opt.MapFrom(src => $"{src.AddressLine}, {src.City}"))
            .ForMember(dest => dest.Address, opt => opt.MapFrom(src => $"{src.AddressLine}, {src.City}, {src.Governorate} {src.PostalCode}"))
            .ForMember(dest => dest.LocationType, opt => opt.MapFrom(src => "address"))
            .ForMember(dest => dest.Distance, opt => opt.Ignore()) // Calculated in service
            .ForMember(dest => dest.IsLandmark, opt => opt.MapFrom(src => false));

        // Admin Vehicle Management Mappings

        // CreateVehicleRequest -> Vehicle
        CreateMap<CreateVehicleRequest, Vehicle>()
            .ForMember(dest => dest.Id, opt => opt.Ignore()) // Generated by database
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore()) // Set by AuditableEntity
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore()) // Set by AuditableEntity
            .ForMember(dest => dest.User, opt => opt.Ignore()) // Navigation property
            .ForMember(dest => dest.Images, opt => opt.Ignore()) // Set separately
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
            .ForMember(dest => dest.ApprovedAt, opt => opt.MapFrom(src => DateTime.UtcNow));
    }
}