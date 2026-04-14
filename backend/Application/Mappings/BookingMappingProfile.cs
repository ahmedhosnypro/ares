using AutoMapper;
using Backend.Application.DTOs.Booking;
using Backend.Application.DTOs.Common;
using Backend.Domain.Entities;

namespace Backend.Application.Mappings;

/// <summary>
/// AutoMapper profile for booking-related mappings
/// Maps between domain entities and DTOs for booking operations
/// </summary>
public class BookingMappingProfile : Profile
{
    public BookingMappingProfile()
    {
        // Booking -> BookingListDto
        CreateMap<Booking, BookingListDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Car, opt => opt.MapFrom(src => new VehicleBasicDto(
                src.Vehicle!.Id,
                $"{src.Vehicle.Make} {src.Vehicle.Model}",
                src.Vehicle.Images.FirstOrDefault() != null ? src.Vehicle.Images.First().ImageUrl : "")))
            .ForMember(dest => dest.Supplier, opt => opt.MapFrom(src => new SupplierDto(
                src.Vehicle!.User!.Id,
                $"{src.Vehicle.User.FirstName} {src.Vehicle.User.LastName}")))
            .ForMember(dest => dest.PickupLocation, opt => opt.Ignore()) // Location handling needs to be done in service
            .ForMember(dest => dest.DropOffLocation, opt => opt.Ignore()) // Location handling needs to be done in service
            .ForMember(dest => dest.From, opt => opt.MapFrom(src => src.PickupDate))
            .ForMember(dest => dest.To, opt => opt.MapFrom(src => src.ReturnDate))
            .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.TotalPrice))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status));

        // Booking -> BookingDetailsDto
        CreateMap<Booking, BookingDetailsDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Car, opt => opt.MapFrom(src => new VehicleWithSupplierDto(
                src.Vehicle!.Id,
                $"{src.Vehicle.Make} {src.Vehicle.Model}",
                src.Vehicle.Images.FirstOrDefault() != null ? src.Vehicle.Images.First().ImageUrl : "",
                new SupplierDto(
                    src.Vehicle.User!.Id,
                    $"{src.Vehicle.User.FirstName} {src.Vehicle.User.LastName}"))))
            .ForMember(dest => dest.Driver, opt => opt.MapFrom(src => src.Driver != null ? new DriverDto(
                src.Driver.Id,
                src.Driver.User != null ? $"{src.Driver.User.FirstName} {src.Driver.User.LastName}" : string.Empty,
                src.Driver.User != null && src.Driver.User.PhoneNumber != null ? src.Driver.User.PhoneNumber : string.Empty) : null))
            .ForMember(dest => dest.PickupLocation, opt => opt.Ignore()) // Location handling needs to be done in service
            .ForMember(dest => dest.DropOffLocation, opt => opt.Ignore()) // Location handling needs to be done in service
            .ForMember(dest => dest.From, opt => opt.MapFrom(src => src.PickupDate))
            .ForMember(dest => dest.To, opt => opt.MapFrom(src => src.ReturnDate))
            .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.TotalPrice))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
            .ForMember(dest => dest.PayLater, opt => opt.Ignore()); // PayLater not in Booking entity, handle in service

        // Driver -> DriverDto
        CreateMap<Driver, DriverDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.User != null ? $"{src.User.FirstName} {src.User.LastName}" : string.Empty))
            .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.User != null ? src.User.PhoneNumber : string.Empty));
    }
}