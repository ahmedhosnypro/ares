CREATE TABLE [AboutSections] (
    [Id] uniqueidentifier NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    [Order] int NOT NULL,
    [SectionType] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_AboutSections] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [AspNetRoles] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(256) NULL,
    [NormalizedName] nvarchar(256) NULL,
    [ConcurrencyStamp] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetRoles] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [AspNetUsers] (
    [Id] uniqueidentifier NOT NULL,
    [FirstName] nvarchar(100) NOT NULL,
    [LastName] nvarchar(100) NOT NULL,
    [NationalId] nvarchar(50) NULL,
    [NationalIdImage] nvarchar(max) NULL,
    [Status] nvarchar(50) NULL,
    [ProfileImage] nvarchar(500) NULL,
    [GoogleId] nvarchar(64) NULL,
    [AuthProvider] nvarchar(20) NULL DEFAULT N'Local',
    [EmailVerifiedAt] datetime2 NULL,
    [DateOfBirth] date NULL,
    [LanguagePreference] nvarchar(10) NOT NULL DEFAULT N'en',
    [CurrencyPreference] nvarchar(10) NOT NULL DEFAULT N'USD',
    [EmergencyContactName] nvarchar(200) NULL,
    [EmergencyContactPhone] nvarchar(20) NULL,
    [EmergencyContactRelationship] nvarchar(50) NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [UpdatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [UserName] nvarchar(256) NULL,
    [NormalizedUserName] nvarchar(256) NULL,
    [Email] nvarchar(256) NULL,
    [NormalizedEmail] nvarchar(256) NULL,
    [EmailConfirmed] bit NOT NULL,
    [PasswordHash] nvarchar(max) NULL,
    [SecurityStamp] nvarchar(max) NULL,
    [ConcurrencyStamp] nvarchar(max) NULL,
    [PhoneNumber] nvarchar(max) NULL,
    [PhoneNumberConfirmed] bit NOT NULL,
    [TwoFactorEnabled] bit NOT NULL,
    [LockoutEnd] datetimeoffset NULL,
    [LockoutEnabled] bit NOT NULL,
    [AccessFailedCount] int NOT NULL,
    CONSTRAINT [PK_AspNetUsers] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [Categories] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Description] nvarchar(500) NULL,
    [CommissionPercentage] decimal(5,2) NOT NULL,
    [DiscountPercentage] decimal(5,2) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Categories] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [service_areas] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Governorate] nvarchar(100) NULL,
    [IsActive] bit NOT NULL,
    CONSTRAINT [PK_service_areas] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [SystemSettings] (
    [Id] uniqueidentifier NOT NULL,
    [Key] nvarchar(max) NOT NULL,
    [Value] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_SystemSettings] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [TermsSections] (
    [Id] uniqueidentifier NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    [Order] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_TermsSections] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [AspNetRoleClaims] (
    [Id] int NOT NULL IDENTITY,
    [RoleId] uniqueidentifier NOT NULL,
    [ClaimType] nvarchar(max) NULL,
    [ClaimValue] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [AspNetUserClaims] (
    [Id] int NOT NULL IDENTITY,
    [UserId] uniqueidentifier NOT NULL,
    [ClaimType] nvarchar(max) NULL,
    [ClaimValue] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [AspNetUserLogins] (
    [LoginProvider] nvarchar(450) NOT NULL,
    [ProviderKey] nvarchar(450) NOT NULL,
    [ProviderDisplayName] nvarchar(max) NULL,
    [UserId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
    CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [AspNetUserRoles] (
    [UserId] uniqueidentifier NOT NULL,
    [RoleId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY ([UserId], [RoleId]),
    CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [AspNetUserTokens] (
    [UserId] uniqueidentifier NOT NULL,
    [LoginProvider] nvarchar(450) NOT NULL,
    [Name] nvarchar(450) NOT NULL,
    [Value] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
    CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [CompanyProfiles] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [CompanyName] nvarchar(255) NOT NULL,
    [CommercialRegistrationNumber] nvarchar(100) NULL,
    [TaxId] nvarchar(100) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_CompanyProfiles] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_CompanyProfiles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [driver_profiles] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [LicenseNumber] nvarchar(50) NULL,
    [LicenseExpiryDate] datetime2 NULL,
    [LicenseImage] nvarchar(500) NULL,
    [NationalIdFrontImage] nvarchar(500) NULL,
    [NationalIdBackImage] nvarchar(500) NULL,
    [Address] nvarchar(500) NULL,
    [EmergencyContactName] nvarchar(150) NULL,
    [EmergencyContactPhone] nvarchar(30) NULL,
    [Status] nvarchar(30) NOT NULL DEFAULT N'Incomplete',
    [Availability] nvarchar(20) NOT NULL DEFAULT N'Unavailable',
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    [RejectionReason] nvarchar(500) NULL,
    [ReviewedBy] uniqueidentifier NULL,
    [ReviewedAt] datetime2 NULL,
    [LockedUntil] datetime2 NULL,
    [RowVersion] rowversion NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_driver_profiles] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_driver_profiles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Drivers] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [LicenseNumber] nvarchar(50) NOT NULL,
    [LicenseExpiryDate] datetime2 NOT NULL,
    [LicenseImage] nvarchar(max) NULL,
    [IsAvailable] bit NOT NULL,
    [IsVerified] bit NOT NULL,
    [IsActive] bit NOT NULL,
    [VerificationStatus] nvarchar(20) NULL,
    [RejectionReason] nvarchar(500) NULL,
    [ReviewedBy] uniqueidentifier NULL,
    [ReviewedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Drivers] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Drivers_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Inspectors] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [EmployeeCode] nvarchar(50) NOT NULL,
    [IsAvailable] bit NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [Region] nvarchar(100) NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Inspectors] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Inspectors_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Notifications] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [Title] nvarchar(200) NOT NULL,
    [Message] nvarchar(max) NOT NULL,
    [Type] nvarchar(64) NULL,
    [IsRead] bit NOT NULL,
    [ReadAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Notifications_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [RefreshTokens] (
    [Id] uniqueidentifier NOT NULL,
    [Token] nvarchar(500) NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [ExpiresAt] datetime2 NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedByIp] nvarchar(45) NULL,
    [RevokedAt] datetime2 NULL,
    [RevokedByIp] nvarchar(45) NULL,
    [ReplacedByToken] nvarchar(500) NULL,
    [ReasonRevoked] nvarchar(200) NULL,
    CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RefreshTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [UserAddresses] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [AddressLine] nvarchar(255) NULL,
    [City] nvarchar(100) NULL,
    [Governorate] nvarchar(100) NULL,
    [Country] nvarchar(100) NULL,
    [PostalCode] nvarchar(20) NULL,
    [Latitude] decimal(9,6) NULL,
    [Longitude] decimal(9,6) NULL,
    [IsPrimary] bit NOT NULL,
    [ImageUrl] nvarchar(500) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_UserAddresses] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_UserAddresses_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [Verifications] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [VerificationType] nvarchar(50) NULL,
    [DocumentType] nvarchar(50) NULL,
    [DocumentFront] nvarchar(max) NULL,
    [DocumentBack] nvarchar(max) NULL,
    [Status] nvarchar(50) NULL,
    [SubmittedAt] datetime2 NULL,
    [ReviewedBy] uniqueidentifier NULL,
    [ReviewedAt] datetime2 NULL,
    [RejectionReason] nvarchar(max) NULL,
    [ExpiresAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Verifications] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Verifications_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [category_offers] (
    [id] uniqueidentifier NOT NULL,
    [category_id] uniqueidentifier NOT NULL,
    [offer_name] nvarchar(100) NOT NULL,
    [discount_percentage] decimal(5,2) NOT NULL,
    [start_date] datetime2 NOT NULL,
    [end_date] datetime2 NOT NULL,
    [is_active] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_category_offers] PRIMARY KEY ([id]),
    CONSTRAINT [FK_category_offers_Categories_category_id] FOREIGN KEY ([category_id]) REFERENCES [Categories] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [Promotions] (
    [Id] uniqueidentifier NOT NULL,
    [CategoryId] uniqueidentifier NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [DiscountPercentage] decimal(5,2) NOT NULL,
    [StartDate] datetime2 NOT NULL,
    [EndDate] datetime2 NOT NULL,
    [Status] nvarchar(50) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Promotions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Promotions_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [Vehicles] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [Make] nvarchar(100) NULL,
    [Model] nvarchar(100) NULL,
    [Year] int NULL,
    [Color] nvarchar(50) NULL,
    [LicensePlate] nvarchar(50) NULL,
    [Transmission] nvarchar(50) NULL,
    [FuelType] nvarchar(50) NULL,
    [Seats] int NULL,
    [PricePerDay] decimal(18,2) NULL,
    [LocationCity] nvarchar(100) NULL,
    [Description] nvarchar(max) NULL,
    [Status] nvarchar(50) NULL,
    [AvailabilityStatus] nvarchar(50) NULL,
    [IsActive] bit NOT NULL,
    [ApprovedAt] datetime2 NULL,
    [CategoryId] uniqueidentifier NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Vehicles] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Vehicles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Vehicles_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([Id])
);
GO


CREATE TABLE [driver_work_areas] (
    [DriverProfileId] uniqueidentifier NOT NULL,
    [ServiceAreaId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_driver_work_areas] PRIMARY KEY ([DriverProfileId], [ServiceAreaId]),
    CONSTRAINT [FK_driver_work_areas_driver_profiles_DriverProfileId] FOREIGN KEY ([DriverProfileId]) REFERENCES [driver_profiles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_driver_work_areas_service_areas_ServiceAreaId] FOREIGN KEY ([ServiceAreaId]) REFERENCES [service_areas] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [PaymentMethods] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [PaymentType] int NOT NULL,
    [TokenizedData] nvarchar(500) NOT NULL,
    [DisplayName] nvarchar(100) NOT NULL,
    [MaskedDetails] nvarchar(50) NOT NULL,
    [CardBrand] nvarchar(20) NULL,
    [ExpirationMonth] tinyint NULL,
    [ExpirationYear] smallint NULL,
    [BillingAddressId] uniqueidentifier NULL,
    [IsDefault] bit NOT NULL,
    [IsExpired] bit NOT NULL,
    [IsVerified] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_PaymentMethods] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PaymentMethods_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_PaymentMethods_UserAddresses_BillingAddressId] FOREIGN KEY ([BillingAddressId]) REFERENCES [UserAddresses] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Bookings] (
    [Id] uniqueidentifier NOT NULL,
    [BookingNumber] nvarchar(100) NULL,
    [UserId] uniqueidentifier NOT NULL,
    [VehicleId] uniqueidentifier NOT NULL,
    [PickupDate] datetime2 NULL,
    [ReturnDate] datetime2 NULL,
    [PickupLocation] nvarchar(255) NULL,
    [DropoffLocation] nvarchar(255) NULL,
    [TotalDays] int NULL,
    [RequiresDriver] bit NOT NULL,
    [DriverId] uniqueidentifier NULL,
    [OriginalPrice] decimal(18,2) NULL,
    [DiscountAmount] decimal(18,2) NULL,
    [TotalPrice] decimal(18,2) NULL,
    [Status] nvarchar(50) NOT NULL,
    [CancelledAt] datetime2 NULL,
    [CancellationReason] nvarchar(max) NULL,
    [AssignedInspectorId] uniqueidentifier NULL,
    [InspectionStatus] nvarchar(20) NOT NULL DEFAULT N'NotRequired',
    [DriverAssignmentStatus] nvarchar(20) NOT NULL DEFAULT N'NotRequired',
    [AssignedDriverProfileId] uniqueidentifier NULL,
    [VehicleFee] decimal(18,2) NULL,
    [DriverFee] decimal(18,2) NULL,
    [GrandTotal] decimal(18,2) NULL,
    [DriverLockedUntil] datetime2 NULL,
    [HoldStartedAt] datetime2 NULL,
    [HoldExpiresAt] datetime2 NULL,
    [CommissionPercentage] decimal(5,2) NULL,
    [CommissionAmount] decimal(18,2) NULL,
    [SupplierAmount] decimal(18,2) NULL,
    [RowVersion] rowversion NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Bookings] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_Booking_DriverRequirement] CHECK (([RequiresDriver] = 1 OR [AssignedDriverProfileId] IS NULL)),
    CONSTRAINT [FK_Bookings_AspNetUsers_AssignedInspectorId] FOREIGN KEY ([AssignedInspectorId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Bookings_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Bookings_Drivers_DriverId] FOREIGN KEY ([DriverId]) REFERENCES [Drivers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Bookings_Vehicles_VehicleId] FOREIGN KEY ([VehicleId]) REFERENCES [Vehicles] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Bookings_driver_profiles_AssignedDriverProfileId] FOREIGN KEY ([AssignedDriverProfileId]) REFERENCES [driver_profiles] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Favorites] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [VehicleId] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Favorites] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Favorites_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Favorites_Vehicles_VehicleId] FOREIGN KEY ([VehicleId]) REFERENCES [Vehicles] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [VehicleFeatures] (
    [Id] uniqueidentifier NOT NULL,
    [VehicleId] uniqueidentifier NOT NULL,
    [FeatureCategory] nvarchar(max) NOT NULL,
    [FeatureName] nvarchar(max) NOT NULL,
    [FeatureDescription] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_VehicleFeatures] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_VehicleFeatures_Vehicles_VehicleId] FOREIGN KEY ([VehicleId]) REFERENCES [Vehicles] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [VehicleImages] (
    [Id] uniqueidentifier NOT NULL,
    [VehicleId] uniqueidentifier NOT NULL,
    [ImageUrl] nvarchar(max) NOT NULL,
    [ThumbnailUrl] nvarchar(max) NOT NULL,
    [IsPrimary] bit NOT NULL,
    [DisplayOrder] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_VehicleImages] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_VehicleImages_Vehicles_VehicleId] FOREIGN KEY ([VehicleId]) REFERENCES [Vehicles] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [BookingCancellations] (
    [Id] uniqueidentifier NOT NULL,
    [BookingId] uniqueidentifier NOT NULL,
    [CancelledBy] uniqueidentifier NOT NULL,
    [PolicyType] int NOT NULL,
    [RefundPercentage] decimal(5,2) NOT NULL,
    [OriginalAmount] decimal(10,2) NOT NULL,
    [CancellationFee] decimal(10,2) NOT NULL,
    [RefundCommissionAmount] decimal(18,2) NOT NULL,
    [RefundSupplierAmount] decimal(18,2) NOT NULL,
    [Currency] nvarchar(max) NOT NULL,
    [RefundStatus] int NOT NULL,
    [RefundTransactionId] uniqueidentifier NULL,
    [RefundProcessedAt] datetime2 NULL,
    [RefundMethod] nvarchar(max) NULL,
    [Reason] nvarchar(max) NULL,
    [ReasonCategory] int NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_BookingCancellations] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_BookingCancellations_AspNetUsers_CancelledBy] FOREIGN KEY ([CancelledBy]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_BookingCancellations_Bookings_BookingId] FOREIGN KEY ([BookingId]) REFERENCES [Bookings] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [driver_reviews] (
    [Id] uniqueidentifier NOT NULL,
    [BookingId] uniqueidentifier NOT NULL,
    [DriverProfileId] uniqueidentifier NOT NULL,
    [CustomerId] uniqueidentifier NOT NULL,
    [Rating] int NOT NULL,
    [Comment] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_driver_reviews] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_driver_reviews_AspNetUsers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_driver_reviews_Bookings_BookingId] FOREIGN KEY ([BookingId]) REFERENCES [Bookings] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_driver_reviews_driver_profiles_DriverProfileId] FOREIGN KEY ([DriverProfileId]) REFERENCES [driver_profiles] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Payments] (
    [PaymentId] uniqueidentifier NOT NULL,
    [BookingId] uniqueidentifier NOT NULL,
    [TransactionId] uniqueidentifier NOT NULL,
    [PaymentMethod] nvarchar(50) NOT NULL,
    [Amount] decimal(10,2) NOT NULL,
    [Currency] nvarchar(3) NOT NULL,
    [Status] nvarchar(20) NOT NULL,
    [AuthorizationCode] nvarchar(50) NULL,
    [ProcessedAt] datetime2 NULL,
    [FailureReason] nvarchar(max) NULL,
    [PaymobOrderId] nvarchar(100) NULL,
    [PaymobTransactionId] bigint NULL,
    [Id] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Payments] PRIMARY KEY ([PaymentId]),
    CONSTRAINT [FK_Payments_Bookings_BookingId] FOREIGN KEY ([BookingId]) REFERENCES [Bookings] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Reviews] (
    [Id] uniqueidentifier NOT NULL,
    [BookingId] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [VehicleId] uniqueidentifier NOT NULL,
    [Rating] int NULL,
    [Comment] nvarchar(max) NULL,
    [AdminResponse] nvarchar(max) NULL,
    [SupplierReply] nvarchar(2000) NULL,
    [RepliedAt] datetime2 NULL,
    [IsReported] bit NOT NULL,
    [ReportReason] nvarchar(1000) NULL,
    [ReportedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Reviews] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Reviews_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Reviews_Bookings_BookingId] FOREIGN KEY ([BookingId]) REFERENCES [Bookings] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Reviews_Vehicles_VehicleId] FOREIGN KEY ([VehicleId]) REFERENCES [Vehicles] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [VehicleAvailabilities] (
    [Id] uniqueidentifier NOT NULL,
    [VehicleId] uniqueidentifier NOT NULL,
    [BookingId] uniqueidentifier NULL,
    [StartDate] datetime2 NOT NULL,
    [EndDate] datetime2 NOT NULL,
    [Status] nvarchar(50) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_VehicleAvailabilities] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_VehicleAvailability_Dates] CHECK ("StartDate" < "EndDate"),
    CONSTRAINT [FK_VehicleAvailabilities_Bookings_BookingId] FOREIGN KEY ([BookingId]) REFERENCES [Bookings] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_VehicleAvailabilities_Vehicles_VehicleId] FOREIGN KEY ([VehicleId]) REFERENCES [Vehicles] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [VehicleInspections] (
    [InspectionId] uniqueidentifier NOT NULL,
    [VehicleId] uniqueidentifier NOT NULL,
    [BookingId] uniqueidentifier NOT NULL,
    [InspectorId] uniqueidentifier NULL,
    [InspectionType] nvarchar(20) NOT NULL,
    [InspectionDate] datetime2 NOT NULL,
    [OdometerReading] int NOT NULL,
    [FuelLevel] decimal(5,2) NOT NULL,
    [GeneralCondition] nvarchar(max) NULL,
    [Notes] nvarchar(max) NULL,
    [Status] nvarchar(20) NOT NULL DEFAULT N'Pending',
    [SubmittedAt] datetime2 NULL,
    [IsSubmitted] bit NOT NULL DEFAULT CAST(0 AS bit),
    [Id] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_VehicleInspections] PRIMARY KEY ([InspectionId]),
    CONSTRAINT [FK_VehicleInspections_AspNetUsers_InspectorId] FOREIGN KEY ([InspectorId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_VehicleInspections_Bookings_BookingId] FOREIGN KEY ([BookingId]) REFERENCES [Bookings] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_VehicleInspections_Vehicles_VehicleId] FOREIGN KEY ([VehicleId]) REFERENCES [Vehicles] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [InspectionImages] (
    [Id] uniqueidentifier NOT NULL,
    [InspectionId] uniqueidentifier NOT NULL,
    [ImageUrl] nvarchar(500) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_InspectionImages] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_InspectionImages_VehicleInspections_InspectionId] FOREIGN KEY ([InspectionId]) REFERENCES [VehicleInspections] ([InspectionId]) ON DELETE CASCADE
);
GO


CREATE TABLE [InspectionPhotos] (
    [PhotoId] uniqueidentifier NOT NULL,
    [InspectionId] uniqueidentifier NOT NULL,
    [PhotoUrl] nvarchar(255) NOT NULL,
    [ViewAngle] nvarchar(50) NOT NULL,
    [AiProcessed] bit NOT NULL,
    [CapturedAt] datetime2 NOT NULL,
    [Id] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_InspectionPhotos] PRIMARY KEY ([PhotoId]),
    CONSTRAINT [FK_InspectionPhotos_VehicleInspections_InspectionId] FOREIGN KEY ([InspectionId]) REFERENCES [VehicleInspections] ([InspectionId]) ON DELETE NO ACTION
);
GO


CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON [AspNetRoleClaims] ([RoleId]);
GO


CREATE UNIQUE INDEX [RoleNameIndex] ON [AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL;
GO


CREATE INDEX [IX_AspNetUserClaims_UserId] ON [AspNetUserClaims] ([UserId]);
GO


CREATE INDEX [IX_AspNetUserLogins_UserId] ON [AspNetUserLogins] ([UserId]);
GO


CREATE INDEX [IX_AspNetUserRoles_RoleId] ON [AspNetUserRoles] ([RoleId]);
GO


CREATE INDEX [EmailIndex] ON [AspNetUsers] ([NormalizedEmail]);
GO


CREATE UNIQUE INDEX [IX_AspNetUsers_GoogleId] ON [AspNetUsers] ([GoogleId]) WHERE [GoogleId] IS NOT NULL;
GO


CREATE UNIQUE INDEX [UserNameIndex] ON [AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL;
GO


CREATE UNIQUE INDEX [IX_BookingCancellations_BookingId] ON [BookingCancellations] ([BookingId]);
GO


CREATE INDEX [IX_BookingCancellations_CancelledBy] ON [BookingCancellations] ([CancelledBy]);
GO


CREATE INDEX [IX_Bookings_AssignedDriverProfileId] ON [Bookings] ([AssignedDriverProfileId]);
GO


CREATE INDEX [IX_Bookings_AssignedDriverProfileId_PickupDate_ReturnDate] ON [Bookings] ([AssignedDriverProfileId], [PickupDate], [ReturnDate]);
GO


CREATE INDEX [IX_Bookings_AssignedInspectorId] ON [Bookings] ([AssignedInspectorId]);
GO


CREATE UNIQUE INDEX [IX_Bookings_BookingNumber] ON [Bookings] ([BookingNumber]) WHERE [BookingNumber] IS NOT NULL;
GO


CREATE INDEX [IX_Bookings_DriverId] ON [Bookings] ([DriverId]);
GO


CREATE INDEX [IX_Bookings_Status_HoldExpiresAt] ON [Bookings] ([Status], [HoldExpiresAt]);
GO


CREATE INDEX [IX_Bookings_User_Status] ON [Bookings] ([UserId], [Status]);
GO


CREATE INDEX [IX_Bookings_Vehicle_Status_Window] ON [Bookings] ([VehicleId], [Status], [PickupDate], [ReturnDate]);
GO


CREATE INDEX [IX_category_offers_category_id] ON [category_offers] ([category_id]);
GO


CREATE UNIQUE INDEX [IX_CompanyProfiles_UserId] ON [CompanyProfiles] ([UserId]);
GO


CREATE UNIQUE INDEX [IX_driver_profiles_LicenseNumber] ON [driver_profiles] ([LicenseNumber]) WHERE [LicenseNumber] IS NOT NULL;
GO


CREATE INDEX [IX_driver_profiles_Status_Availability_IsActive] ON [driver_profiles] ([Status], [Availability], [IsActive]);
GO


CREATE UNIQUE INDEX [IX_driver_profiles_UserId] ON [driver_profiles] ([UserId]);
GO


CREATE UNIQUE INDEX [IX_driver_reviews_BookingId] ON [driver_reviews] ([BookingId]);
GO


CREATE INDEX [IX_driver_reviews_CustomerId] ON [driver_reviews] ([CustomerId]);
GO


CREATE INDEX [IX_driver_reviews_DriverProfileId] ON [driver_reviews] ([DriverProfileId]);
GO


CREATE INDEX [IX_driver_work_areas_ServiceAreaId] ON [driver_work_areas] ([ServiceAreaId]);
GO


CREATE UNIQUE INDEX [IX_Drivers_UserId] ON [Drivers] ([UserId]);
GO


CREATE UNIQUE INDEX [IX_Favorites_UserId_VehicleId] ON [Favorites] ([UserId], [VehicleId]);
GO


CREATE INDEX [IX_Favorites_VehicleId] ON [Favorites] ([VehicleId]);
GO


CREATE INDEX [IX_InspectionImages_InspectionId] ON [InspectionImages] ([InspectionId]);
GO


CREATE INDEX [IX_InspectionPhotos_InspectionId] ON [InspectionPhotos] ([InspectionId]);
GO


CREATE UNIQUE INDEX [IX_Inspectors_UserId] ON [Inspectors] ([UserId]);
GO


CREATE INDEX [IX_Notifications_UserId_IsRead] ON [Notifications] ([UserId], [IsRead]);
GO


CREATE INDEX [IX_PaymentMethods_BillingAddressId] ON [PaymentMethods] ([BillingAddressId]);
GO


CREATE INDEX [IX_PaymentMethods_UserId] ON [PaymentMethods] ([UserId]);
GO


CREATE INDEX [IX_Payments_BookingId] ON [Payments] ([BookingId]);
GO


CREATE INDEX [IX_Promotions_CategoryId] ON [Promotions] ([CategoryId]);
GO


CREATE INDEX [IX_RefreshTokens_UserId] ON [RefreshTokens] ([UserId]);
GO


CREATE UNIQUE INDEX [IX_Reviews_BookingId] ON [Reviews] ([BookingId]);
GO


CREATE INDEX [IX_Reviews_UserId] ON [Reviews] ([UserId]);
GO


CREATE INDEX [IX_Reviews_VehicleId] ON [Reviews] ([VehicleId]);
GO


CREATE UNIQUE INDEX [IX_service_areas_Name] ON [service_areas] ([Name]);
GO


CREATE INDEX [IX_UserAddresses_UserId] ON [UserAddresses] ([UserId]);
GO


CREATE INDEX [IX_VehicleAvailabilities_BookingId] ON [VehicleAvailabilities] ([BookingId]);
GO


CREATE INDEX [IX_VehicleAvailabilities_VehicleId_StartDate_EndDate] ON [VehicleAvailabilities] ([VehicleId], [StartDate], [EndDate]);
GO


CREATE INDEX [IX_VehicleFeatures_VehicleId] ON [VehicleFeatures] ([VehicleId]);
GO


CREATE INDEX [IX_VehicleImages_VehicleId] ON [VehicleImages] ([VehicleId]);
GO


CREATE INDEX [IX_VehicleInspections_BookingId] ON [VehicleInspections] ([BookingId]);
GO


CREATE INDEX [IX_VehicleInspections_InspectorId] ON [VehicleInspections] ([InspectorId]);
GO


CREATE INDEX [IX_VehicleInspections_VehicleId] ON [VehicleInspections] ([VehicleId]);
GO


CREATE INDEX [IX_Vehicles_CategoryId] ON [Vehicles] ([CategoryId]);
GO


CREATE INDEX [IX_Vehicles_UserId] ON [Vehicles] ([UserId]);
GO


CREATE INDEX [IX_Verifications_UserId] ON [Verifications] ([UserId]);
GO


