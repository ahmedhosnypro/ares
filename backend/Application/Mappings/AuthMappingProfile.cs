using AutoMapper;
using Backend.Application.DTOs.Auth;
using Backend.Domain.Entities;

namespace Backend.Application.Mappings;

/// <summary>
/// AutoMapper profile for authentication-related mappings
/// Maps between domain entities and DTOs for authentication operations
/// </summary>
public class AuthMappingProfile : Profile
{
    public AuthMappingProfile()
    {
        // ApplicationUser -> UserDto
        CreateMap<ApplicationUser, UserDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
            .ForMember(dest => dest.EmailVerified, opt => opt.MapFrom(src => src.EmailConfirmed))
            .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.PhoneNumber))
            .ForMember(dest => dest.Roles, opt => opt.Ignore()); // Roles are handled separately in the service
    }
}