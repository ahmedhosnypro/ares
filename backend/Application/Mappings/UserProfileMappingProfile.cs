using AutoMapper;
using Backend.Application.DTOs.UserProfile;
using Backend.Domain.Entities;

namespace Backend.Application.Mappings;

/// <summary>
/// AutoMapper profile for user profile-related mappings
/// Maps between domain entities and DTOs for user profile operations
/// </summary>
public class UserProfileMappingProfile : Profile
{
    public UserProfileMappingProfile()
    {
        // ApplicationUser -> UserProfileDto
        CreateMap<ApplicationUser, UserProfileDto>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.EmailVerified, opt => opt.MapFrom(src => src.EmailConfirmed))
            .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.PhoneNumber))
            .ForMember(dest => dest.PhoneVerified, opt => opt.MapFrom(src => src.PhoneNumberConfirmed))
            .ForMember(dest => dest.DateOfBirth, opt => opt.Ignore()) // DateOfBirth not in ApplicationUser entity
            .ForMember(dest => dest.ProfilePhotoUrl, opt => opt.MapFrom(src => src.ProfileImage))
            .ForMember(dest => dest.Address, opt => opt.Ignore()) // Handled separately in service
            .ForMember(dest => dest.EmergencyContact, opt => opt.Ignore()) // Handled separately in service
            .ForMember(dest => dest.LanguagePreference, opt => opt.Ignore()) // Default value in service
            .ForMember(dest => dest.CurrencyPreference, opt => opt.Ignore()) // Default value in service
            .ForMember(dest => dest.ProfileCompleteness, opt => opt.Ignore()) // Calculated in service
            .ForMember(dest => dest.VerificationStatus, opt => opt.Ignore()); // Calculated in service

        // UserAddress -> AddressDto
        CreateMap<UserAddress, AddressDto>()
            .ForMember(dest => dest.Street, opt => opt.MapFrom(src => src.AddressLine))
            .ForMember(dest => dest.City, opt => opt.MapFrom(src => src.City))
            .ForMember(dest => dest.State, opt => opt.MapFrom(src => src.Governorate))
            .ForMember(dest => dest.PostalCode, opt => opt.MapFrom(src => src.PostalCode))
            .ForMember(dest => dest.Country, opt => opt.MapFrom(src => src.Country));

        // AddressDto -> UserAddress
        CreateMap<AddressDto, UserAddress>()
            .ForMember(dest => dest.AddressLine, opt => opt.MapFrom(src => src.Street))
            .ForMember(dest => dest.City, opt => opt.MapFrom(src => src.City))
            .ForMember(dest => dest.Governorate, opt => opt.MapFrom(src => src.State))
            .ForMember(dest => dest.PostalCode, opt => opt.MapFrom(src => src.PostalCode))
            .ForMember(dest => dest.Country, opt => opt.MapFrom(src => src.Country))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.Latitude, opt => opt.Ignore())
            .ForMember(dest => dest.Longitude, opt => opt.Ignore())
            .ForMember(dest => dest.IsPrimary, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        // UpdateProfileRequest -> ApplicationUser (for updating user properties)
        CreateMap<UpdateProfileRequest, ApplicationUser>()
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.Phone))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.Email, opt => opt.Ignore())
            .ForMember(dest => dest.UserName, opt => opt.Ignore())
            .ForMember(dest => dest.NormalizedUserName, opt => opt.Ignore())
            .ForMember(dest => dest.NormalizedEmail, opt => opt.Ignore())
            .ForMember(dest => dest.EmailConfirmed, opt => opt.Ignore())
            .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
            .ForMember(dest => dest.SecurityStamp, opt => opt.Ignore())
            .ForMember(dest => dest.ConcurrencyStamp, opt => opt.Ignore())
            .ForMember(dest => dest.PhoneNumberConfirmed, opt => opt.Ignore())
            .ForMember(dest => dest.TwoFactorEnabled, opt => opt.Ignore())
            .ForMember(dest => dest.LockoutEnd, opt => opt.Ignore())
            .ForMember(dest => dest.LockoutEnabled, opt => opt.Ignore())
            .ForMember(dest => dest.AccessFailedCount, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.ProfileImage, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());
    }
}