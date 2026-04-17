-- Update existing locations with image URLs
UPDATE UserAddresses 
SET ImageUrl = 'uploads/seed/locations/cairo.jpg'
WHERE City = 'Cairo' AND ImageUrl IS NULL;

UPDATE UserAddresses 
SET ImageUrl = 'uploads/seed/locations/alexandria.jpg'
WHERE City = 'Alexandria' AND ImageUrl IS NULL;

UPDATE UserAddresses 
SET ImageUrl = 'uploads/seed/locations/sharm.jpg'
WHERE City = 'Sharm El Sheikh' AND ImageUrl IS NULL;

UPDATE UserAddresses 
SET ImageUrl = 'uploads/seed/locations/hurghada.jpg'
WHERE City = 'Hurghada' AND ImageUrl IS NULL;

-- Insert new locations if they don't exist
IF NOT EXISTS (SELECT 1 FROM UserAddresses WHERE City = 'Sharm El Sheikh')
BEGIN
    INSERT INTO UserAddresses (Id, UserId, AddressLine, City, Governorate, Country, PostalCode, Latitude, Longitude, IsPrimary, ImageUrl, CreatedAt, UpdatedAt)
    SELECT 
        'aaaabbbb-cccc-dddd-eeee-111111111111',
        (SELECT TOP 1 Id FROM AspNetUsers WHERE Email = 'supplier.demo@ares.local'),
        'Naama Bay',
        'Sharm El Sheikh',
        'South Sinai Governorate',
        'Egypt',
        '46619',
        27.9158,
        34.3300,
        0,
        'uploads/seed/locations/sharm.jpg',
        GETUTCDATE(),
        GETUTCDATE()
    WHERE NOT EXISTS (SELECT 1 FROM UserAddresses WHERE Id = 'aaaabbbb-cccc-dddd-eeee-111111111111');
END

IF NOT EXISTS (SELECT 1 FROM UserAddresses WHERE City = 'Hurghada')
BEGIN
    INSERT INTO UserAddresses (Id, UserId, AddressLine, City, Governorate, Country, PostalCode, Latitude, Longitude, IsPrimary, ImageUrl, CreatedAt, UpdatedAt)
    SELECT 
        'aaaabbbb-cccc-dddd-eeee-222222222222',
        (SELECT TOP 1 Id FROM AspNetUsers WHERE Email = 'supplier.demo@ares.local'),
        'Marina Boulevard',
        'Hurghada',
        'Red Sea Governorate',
        'Egypt',
        '84511',
        27.2579,
        33.8116,
        0,
        'uploads/seed/locations/hurghada.jpg',
        GETUTCDATE(),
        GETUTCDATE()
    WHERE NOT EXISTS (SELECT 1 FROM UserAddresses WHERE Id = 'aaaabbbb-cccc-dddd-eeee-222222222222');
END
