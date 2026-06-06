# Feature: Saved Preferences & Locations - Database

## Overview

The database schema for Saved Preferences & Locations stores user preferences across multiple categories and manages saved location data with geospatial capabilities. The schema supports efficient querying, maintains referential integrity, and enables tracking of preference and location usage patterns. The design uses normalized tables for preferences and locations with appropriate indexes for performance optimization.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature IDs

- F-AM-013: Saved Preferences
- F-AM-014: Saved Locations
- F-FUNC-UM-009: User Preferences (Functional Requirements)

## Database Specifications

### Schema Changes

#### New Tables

1. **user_preferences**: Stores all user preference categories
2. **saved_locations**: Stores user's saved locations with geospatial data
3. **location_history**: Tracks usage of locations in bookings
4. **geocoding_cache**: Caches geocoding API results

### Table Definitions

#### user_preferences

Stores comprehensive user preferences across all categories.

```sql
CREATE TABLE user_preferences (
    preference_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    
    -- Vehicle Preferences (JSON)
    vehicle_preferences JSON NULL,
    
    -- Insurance Preferences (JSON)
    insurance_preferences JSON NULL,
    
    -- Extras Preferences (JSON)
    extras_preferences JSON NULL,
    
    -- Payment Preferences (JSON)
    payment_preferences JSON NULL,
    
    -- Communication Preferences (JSON)
    communication_preferences JSON NULL,
    
    -- Accessibility Preferences (JSON)
    accessibility_preferences JSON NULL,
    
    -- Metadata
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version INT NOT NULL DEFAULT 1,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_updated_at (updated_at),
    
    -- Foreign Keys
    CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT uq_user_preferences_user UNIQUE (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Column Details**:

- `preference_id`: Unique identifier for preference record (UUID format)
- `user_id`: Reference to user who owns these preferences
- `vehicle_preferences`: JSON object containing vehicle-related preferences
  ```json
  {
    "categories": ["SUV", "Luxury"],
    "transmissionType": "Automatic",
    "fuelType": "Electric",
    "features": ["GPS", "Bluetooth", "Backup Camera"],
    "seatingCapacity": 5,
    "luggageCapacity": "Large"
  }
  ```
- `insurance_preferences`: JSON object containing insurance preferences
  ```json
  {
    "defaultTier": "Premium",
    "autoSelect": true,
    "notes": "Always include comprehensive coverage"
  }
  ```
- `extras_preferences`: JSON object containing rental extras preferences
  ```json
  {
    "gps": {"enabled": true, "autoAdd": true},
    "childSeat": {"enabled": true, "autoAdd": true, "age": "4-7 years"},
    "additionalDriver": {"enabled": false, "autoAdd": false},
    "tollPass": {"enabled": true, "autoAdd": true},
    "wifiHotspot": {"enabled": false, "autoAdd": false},
    "snowChains": {"enabled": false, "autoAdd": false},
    "skiRack": {"enabled": false, "autoAdd": false},
    "notes": ""
  }
  ```
- `payment_preferences`: JSON object containing payment preferences
  ```json
  {
    "defaultMethod": "credit_card",
    "savedPaymentMethodId": "pm_987654",
    "paymentTiming": "pay_now",
    "autoApply": true,
    "invoiceDelivery": "email"
  }
  ```
- `communication_preferences`: JSON object containing notification preferences
  ```json
  {
    "email": {"enabled": true, "address": "user@example.com"},
    "sms": {"enabled": true, "phone": "+1234567890"},
    "push": {"enabled": true},
    "notificationTypes": ["booking_confirmations", "payment_receipts", "trip_reminders"],
    "quietHours": {"start": "22:00", "end": "08:00"},
    "frequency": "real_time",
    "language": "en",
    "preferredContact": "email"
  }
  ```
- `accessibility_preferences`: JSON object containing accessibility requirements
  ```json
  {
    "mobilityRequirements": ["wheelchair_accessible", "hand_controls"],
    "visualRequirements": ["large_text"],
    "hearingRequirements": [],
    "cognitiveRequirements": [],
    "serviceAnimal": false,
    "notes": "Require vehicles with hand controls"
  }
  ```
- `created_at`: Timestamp when preferences were first created
- `updated_at`: Timestamp of last preference update (auto-updated)
- `version`: Optimistic concurrency control version number

**Design Rationale**:
- JSON columns provide flexibility for evolving preference structures
- Single row per user simplifies queries and updates
- Version column enables optimistic concurrency control
- Unique constraint on user_id ensures one preference record per user

#### saved_locations

Stores user's saved locations with geospatial data.

```sql
CREATE TABLE saved_locations (
    location_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    location_type ENUM('home', 'work', 'airport', 'hotel', 'custom') NOT NULL DEFAULT 'custom',
    
    -- Address Components
    street VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    country VARCHAR(3) NOT NULL,
    formatted_address VARCHAR(255) NOT NULL,
    
    -- Geospatial Data
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    coordinates POINT NOT NULL SRID 4326,
    
    -- Additional Information
    notes TEXT NULL,
    is_default_pickup BOOLEAN NOT NULL DEFAULT FALSE,
    is_default_return BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Usage Tracking
    usage_count INT NOT NULL DEFAULT 0,
    last_used DATETIME NULL,
    
    -- Metadata
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_location_type (location_type),
    INDEX idx_is_default_pickup (user_id, is_default_pickup),
    INDEX idx_is_default_return (user_id, is_default_return),
    INDEX idx_usage_count (user_id, usage_count DESC),
    INDEX idx_last_used (user_id, last_used DESC),
    SPATIAL INDEX idx_coordinates (coordinates),
    
    -- Foreign Keys
    CONSTRAINT fk_saved_locations_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT uq_saved_locations_nickname UNIQUE (user_id, nickname),
    CONSTRAINT chk_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_longitude CHECK (longitude BETWEEN -180 AND 180)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Column Details**:

- `location_id`: Unique identifier for saved location (UUID format)
- `user_id`: Reference to user who owns this location
- `nickname`: User-defined name for the location (e.g., "Home", "Office")
- `location_type`: Category of location (home, work, airport, hotel, custom)
- `street`: Street address
- `city`: City name
- `state`: State or province name
- `postal_code`: Postal or ZIP code
- `country`: ISO 3166-1 alpha-3 country code
- `formatted_address`: Complete formatted address string
- `latitude`: Latitude coordinate (decimal degrees)
- `longitude`: Longitude coordinate (decimal degrees)
- `coordinates`: MySQL POINT type for geospatial queries (SRID 4326 = WGS84)
- `notes`: Optional user notes about the location
- `is_default_pickup`: Whether this is the default pickup location
- `is_default_return`: Whether this is the default return location
- `usage_count`: Number of times location has been used in bookings
- `last_used`: Timestamp of most recent usage
- `created_at`: Timestamp when location was saved
- `updated_at`: Timestamp of last location update

**Design Rationale**:
- Separate columns for address components enable filtering and validation
- POINT column with spatial index enables efficient geospatial queries
- Usage tracking supports analytics and location suggestions
- Unique constraint on (user_id, nickname) prevents duplicate nicknames per user
- Boolean flags for default locations simplify booking flow queries

#### location_history

Tracks usage of locations in bookings for analytics and suggestions.

```sql
CREATE TABLE location_history (
    history_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    location_id VARCHAR(36) NULL,
    booking_id VARCHAR(36) NOT NULL,
    
    -- Address Snapshot (for locations not saved)
    street VARCHAR(100) NULL,
    city VARCHAR(50) NULL,
    state VARCHAR(50) NULL,
    postal_code VARCHAR(10) NULL,
    country VARCHAR(3) NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    
    -- Usage Context
    location_type ENUM('pickup', 'return') NOT NULL,
    used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_location_id (location_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_used_at (user_id, used_at DESC),
    
    -- Foreign Keys
    CONSTRAINT fk_location_history_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_location_history_location FOREIGN KEY (location_id) 
        REFERENCES saved_locations(location_id) ON DELETE SET NULL,
    CONSTRAINT fk_location_history_booking FOREIGN KEY (booking_id) 
        REFERENCES bookings(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Column Details**:

- `history_id`: Unique identifier for history entry (UUID format)
- `user_id`: Reference to user who used the location
- `location_id`: Reference to saved location (NULL if location was not saved)
- `booking_id`: Reference to booking where location was used
- `street`, `city`, `state`, `postal_code`, `country`: Address snapshot
- `latitude`, `longitude`: Coordinate snapshot
- `location_type`: Whether this was pickup or return location
- `used_at`: Timestamp when location was used

**Design Rationale**:
- Stores address snapshot to preserve history even if saved location is deleted
- Nullable location_id allows tracking of unsaved locations
- Enables analytics on location usage patterns
- Supports "save this location" suggestions for frequently used addresses

#### geocoding_cache

Caches geocoding API results to reduce external API calls and costs.

```sql
CREATE TABLE geocoding_cache (
    cache_id VARCHAR(36) PRIMARY KEY,
    
    -- Input Address
    input_street VARCHAR(100) NOT NULL,
    input_city VARCHAR(50) NOT NULL,
    input_state VARCHAR(50) NOT NULL,
    input_postal_code VARCHAR(10) NOT NULL,
    input_country VARCHAR(3) NOT NULL,
    input_hash VARCHAR(64) NOT NULL,
    
    -- Geocoded Result
    formatted_address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    coordinates POINT NOT NULL SRID 4326,
    confidence_score DECIMAL(3, 2) NOT NULL,
    
    -- Service Area Validation
    in_service_area BOOLEAN NOT NULL,
    nearest_rental_location_id VARCHAR(36) NULL,
    distance_to_nearest DECIMAL(6, 2) NULL,
    
    -- Metadata
    geocoding_provider VARCHAR(50) NOT NULL,
    cached_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    hit_count INT NOT NULL DEFAULT 0,
    
    -- Indexes
    INDEX idx_input_hash (input_hash),
    INDEX idx_expires_at (expires_at),
    SPATIAL INDEX idx_coordinates (coordinates),
    
    -- Constraints
    CONSTRAINT uq_geocoding_cache_hash UNIQUE (input_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Column Details**:

- `cache_id`: Unique identifier for cache entry (UUID format)
- `input_street`, `input_city`, `input_state`, `input_postal_code`, `input_country`: Original input address
- `input_hash`: SHA-256 hash of normalized input address for fast lookup
- `formatted_address`: Standardized address from geocoding service
- `latitude`, `longitude`: Geocoded coordinates
- `coordinates`: MySQL POINT type for geospatial queries
- `confidence_score`: Geocoding confidence (0.00 to 1.00)
- `in_service_area`: Whether location is within service area
- `nearest_rental_location_id`: Reference to nearest rental location
- `distance_to_nearest`: Distance in kilometers to nearest rental location
- `geocoding_provider`: Name of geocoding service used (e.g., "google", "mapbox")
- `cached_at`: Timestamp when result was cached
- `expires_at`: Timestamp when cache entry expires (30 days from cached_at)
- `hit_count`: Number of times this cache entry has been used

**Design Rationale**:
- Hash-based lookup provides fast cache retrieval
- Stores service area validation to avoid repeated checks
- Tracks hit count for cache effectiveness analysis
- Expires after 30 days to ensure data freshness
- Reduces geocoding API costs and improves response times

### Relationships

#### user_preferences Relationships
- **users** (1:1): Each user has one preference record
  - Foreign key: `user_id` references `users.user_id`
  - Cascade delete: When user is deleted, preferences are deleted

#### saved_locations Relationships
- **users** (N:1): Each user can have multiple saved locations
  - Foreign key: `user_id` references `users.user_id`
  - Cascade delete: When user is deleted, all saved locations are deleted

#### location_history Relationships
- **users** (N:1): Each user can have multiple history entries
  - Foreign key: `user_id` references `users.user_id`
  - Cascade delete: When user is deleted, all history is deleted
- **saved_locations** (N:1): Each history entry may reference a saved location
  - Foreign key: `location_id` references `saved_locations.location_id`
  - Set null on delete: When saved location is deleted, history is preserved with NULL location_id
- **bookings** (N:1): Each history entry references a booking
  - Foreign key: `booking_id` references `bookings.booking_id`
  - Cascade delete: When booking is deleted, history entry is deleted

#### geocoding_cache Relationships
- **rental_locations** (N:1): Cache may reference nearest rental location
  - Foreign key: `nearest_rental_location_id` references `rental_locations.location_id`
  - No cascade: Cache entry remains if rental location is deleted

### Indexes

#### Performance Indexes

**user_preferences**:
- `idx_user_id`: Fast lookup of preferences by user
- `idx_updated_at`: Support for finding recently updated preferences

**saved_locations**:
- `idx_user_id`: Fast lookup of all locations for a user
- `idx_location_type`: Filter locations by type
- `idx_is_default_pickup`: Fast lookup of default pickup location per user
- `idx_is_default_return`: Fast lookup of default return location per user
- `idx_usage_count`: Sort locations by usage frequency
- `idx_last_used`: Sort locations by recency
- `idx_coordinates`: Geospatial queries (find nearby locations)

**location_history**:
- `idx_user_id`: Fast lookup of history for a user
- `idx_location_id`: Find all uses of a specific location
- `idx_booking_id`: Find location history for a booking
- `idx_used_at`: Sort history by date

**geocoding_cache**:
- `idx_input_hash`: Fast cache lookup by address hash
- `idx_expires_at`: Efficient cleanup of expired entries
- `idx_coordinates`: Geospatial queries on cached locations

### Data Integrity Constraints

#### Unique Constraints
- `user_preferences.user_id`: One preference record per user
- `saved_locations.(user_id, nickname)`: Unique nicknames per user
- `geocoding_cache.input_hash`: One cache entry per unique address

#### Check Constraints
- `saved_locations.latitude`: Must be between -90 and 90
- `saved_locations.longitude`: Must be between -180 and 180

#### Foreign Key Constraints
- All foreign keys use appropriate cascade rules
- User deletion cascades to preferences, locations, and history
- Saved location deletion sets location_id to NULL in history
- Booking deletion cascades to location history

### Triggers

#### update_location_usage Trigger
Updates usage_count and last_used when location is used in a booking.

```sql
DELIMITER //

CREATE TRIGGER update_location_usage
AFTER INSERT ON location_history
FOR EACH ROW
BEGIN
    IF NEW.location_id IS NOT NULL THEN
        UPDATE saved_locations
        SET usage_count = usage_count + 1,
            last_used = NEW.used_at
        WHERE location_id = NEW.location_id;
    END IF;
END//

DELIMITER ;
```

#### enforce_single_default_pickup Trigger
Ensures only one location per user can be default pickup.

```sql
DELIMITER //

CREATE TRIGGER enforce_single_default_pickup
BEFORE UPDATE ON saved_locations
FOR EACH ROW
BEGIN
    IF NEW.is_default_pickup = TRUE AND OLD.is_default_pickup = FALSE THEN
        UPDATE saved_locations
        SET is_default_pickup = FALSE
        WHERE user_id = NEW.user_id
          AND location_id != NEW.location_id
          AND is_default_pickup = TRUE;
    END IF;
END//

DELIMITER ;
```

#### enforce_single_default_return Trigger
Ensures only one location per user can be default return.

```sql
DELIMITER //

CREATE TRIGGER enforce_single_default_return
BEFORE UPDATE ON saved_locations
FOR EACH ROW
BEGIN
    IF NEW.is_default_return = TRUE AND OLD.is_default_return = FALSE THEN
        UPDATE saved_locations
        SET is_default_return = FALSE
        WHERE user_id = NEW.user_id
          AND location_id != NEW.location_id
          AND is_default_return = TRUE;
    END IF;
END//

DELIMITER ;
```

#### increment_cache_hit_count Trigger
Tracks cache usage for analytics.

```sql
DELIMITER //

CREATE TRIGGER increment_cache_hit_count
AFTER UPDATE ON geocoding_cache
FOR EACH ROW
BEGIN
    IF NEW.hit_count > OLD.hit_count THEN
        -- Log cache hit for analytics (optional)
        INSERT INTO cache_analytics (cache_id, hit_at)
        VALUES (NEW.cache_id, NOW());
    END IF;
END//

DELIMITER ;
```

### Stored Procedures

#### sp_get_user_preferences
Retrieves user preferences with default values for missing categories.

```sql
DELIMITER //

CREATE PROCEDURE sp_get_user_preferences(
    IN p_user_id VARCHAR(36)
)
BEGIN
    SELECT 
        preference_id,
        user_id,
        COALESCE(vehicle_preferences, '{}') AS vehicle_preferences,
        COALESCE(insurance_preferences, '{}') AS insurance_preferences,
        COALESCE(extras_preferences, '{}') AS extras_preferences,
        COALESCE(payment_preferences, '{}') AS payment_preferences,
        COALESCE(communication_preferences, '{}') AS communication_preferences,
        COALESCE(accessibility_preferences, '{}') AS accessibility_preferences,
        created_at,
        updated_at,
        version
    FROM user_preferences
    WHERE user_id = p_user_id;
END//

DELIMITER ;
```

#### sp_save_location
Creates or updates a saved location with validation.

```sql
DELIMITER //

CREATE PROCEDURE sp_save_location(
    IN p_location_id VARCHAR(36),
    IN p_user_id VARCHAR(36),
    IN p_nickname VARCHAR(50),
    IN p_location_type VARCHAR(20),
    IN p_street VARCHAR(100),
    IN p_city VARCHAR(50),
    IN p_state VARCHAR(50),
    IN p_postal_code VARCHAR(10),
    IN p_country VARCHAR(3),
    IN p_formatted_address VARCHAR(255),
    IN p_latitude DECIMAL(10, 8),
    IN p_longitude DECIMAL(11, 8),
    IN p_notes TEXT,
    IN p_is_default_pickup BOOLEAN,
    IN p_is_default_return BOOLEAN,
    OUT p_result VARCHAR(20)
)
BEGIN
    DECLARE location_count INT;
    DECLARE duplicate_count INT;
    
    -- Check location limit (20 per user)
    SELECT COUNT(*) INTO location_count
    FROM saved_locations
    WHERE user_id = p_user_id;
    
    IF location_count >= 20 AND p_location_id IS NULL THEN
        SET p_result = 'LIMIT_REACHED';
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Maximum 20 saved locations per user';
    END IF;
    
    -- Check for duplicate locations (within 50 meters)
    SELECT COUNT(*) INTO duplicate_count
    FROM saved_locations
    WHERE user_id = p_user_id
      AND location_id != COALESCE(p_location_id, '')
      AND ST_Distance_Sphere(
            coordinates,
            ST_GeomFromText(CONCAT('POINT(', p_longitude, ' ', p_latitude, ')'), 4326)
          ) < 50;
    
    IF duplicate_count > 0 THEN
        SET p_result = 'DUPLICATE_FOUND';
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Similar location already exists';
    END IF;
    
    -- Insert or update location
    INSERT INTO saved_locations (
        location_id, user_id, nickname, location_type,
        street, city, state, postal_code, country, formatted_address,
        latitude, longitude, coordinates,
        notes, is_default_pickup, is_default_return
    ) VALUES (
        COALESCE(p_location_id, UUID()),
        p_user_id, p_nickname, p_location_type,
        p_street, p_city, p_state, p_postal_code, p_country, p_formatted_address,
        p_latitude, p_longitude,
        ST_GeomFromText(CONCAT('POINT(', p_longitude, ' ', p_latitude, ')'), 4326),
        p_notes, p_is_default_pickup, p_is_default_return
    )
    ON DUPLICATE KEY UPDATE
        nickname = p_nickname,
        location_type = p_location_type,
        street = p_street,
        city = p_city,
        state = p_state,
        postal_code = p_postal_code,
        country = p_country,
        formatted_address = p_formatted_address,
        latitude = p_latitude,
        longitude = p_longitude,
        coordinates = ST_GeomFromText(CONCAT('POINT(', p_longitude, ' ', p_latitude, ')'), 4326),
        notes = p_notes,
        is_default_pickup = p_is_default_pickup,
        is_default_return = p_is_default_return,
        updated_at = CURRENT_TIMESTAMP;
    
    SET p_result = 'SUCCESS';
END//

DELIMITER ;
```

#### sp_get_location_suggestions
Suggests locations to save based on usage patterns.

```sql
DELIMITER //

CREATE PROCEDURE sp_get_location_suggestions(
    IN p_user_id VARCHAR(36),
    IN p_min_usage_count INT
)
BEGIN
    SELECT 
        street, city, state, postal_code, country,
        latitude, longitude,
        COUNT(*) AS usage_count,
        MAX(used_at) AS last_used
    FROM location_history
    WHERE user_id = p_user_id
      AND location_id IS NULL
    GROUP BY street, city, state, postal_code, country, latitude, longitude
    HAVING COUNT(*) >= p_min_usage_count
    ORDER BY usage_count DESC, last_used DESC
    LIMIT 5;
END//

DELIMITER ;
```

#### sp_cleanup_expired_cache
Removes expired geocoding cache entries.

```sql
DELIMITER //

CREATE PROCEDURE sp_cleanup_expired_cache()
BEGIN
    DELETE FROM geocoding_cache
    WHERE expires_at < NOW();
    
    SELECT ROW_COUNT() AS deleted_count;
END//

DELIMITER ;
```

### Migration Scripts

#### Initial Migration
```sql
-- Create user_preferences table
CREATE TABLE user_preferences (...);

-- Create saved_locations table
CREATE TABLE saved_locations (...);

-- Create location_history table
CREATE TABLE location_history (...);

-- Create geocoding_cache table
CREATE TABLE geocoding_cache (...);

-- Create triggers
CREATE TRIGGER update_location_usage ...;
CREATE TRIGGER enforce_single_default_pickup ...;
CREATE TRIGGER enforce_single_default_return ...;

-- Create stored procedures
CREATE PROCEDURE sp_get_user_preferences ...;
CREATE PROCEDURE sp_save_location ...;
CREATE PROCEDURE sp_get_location_suggestions ...;
CREATE PROCEDURE sp_cleanup_expired_cache ...;
```

#### Rollback Migration
```sql
-- Drop stored procedures
DROP PROCEDURE IF EXISTS sp_cleanup_expired_cache;
DROP PROCEDURE IF EXISTS sp_get_location_suggestions;
DROP PROCEDURE IF EXISTS sp_save_location;
DROP PROCEDURE IF EXISTS sp_get_user_preferences;

-- Drop triggers
DROP TRIGGER IF EXISTS enforce_single_default_return;
DROP TRIGGER IF EXISTS enforce_single_default_pickup;
DROP TRIGGER IF EXISTS update_location_usage;

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS geocoding_cache;
DROP TABLE IF EXISTS location_history;
DROP TABLE IF EXISTS saved_locations;
DROP TABLE IF EXISTS user_preferences;
```

## Technology Stack

- **Database**: MySQL 8.0+
- **Storage Engine**: InnoDB for ACID compliance and foreign key support
- **Character Set**: utf8mb4 for full Unicode support
- **Collation**: utf8mb4_unicode_ci for case-insensitive comparisons
- **Spatial Reference System**: SRID 4326 (WGS84) for geospatial data

## Implementation Notes

### JSON Column Usage
- JSON columns provide flexibility for evolving preference structures
- Use JSON_EXTRACT() for querying specific preference values
- Consider extracting frequently queried fields to separate columns if performance issues arise
- Validate JSON structure at application layer before storage

### Geospatial Considerations
- POINT columns use SRID 4326 (WGS84) for compatibility with GPS coordinates
- Spatial indexes enable efficient proximity queries
- Use ST_Distance_Sphere() for distance calculations in meters
- Consider using MySQL 8.0+ spatial functions for better performance

### Performance Optimization
- Index all foreign keys for join performance
- Use covering indexes where possible
- Partition location_history table by date if volume is high
- Regularly run ANALYZE TABLE to update statistics
- Monitor slow query log for optimization opportunities

### Data Retention
- Keep location_history for 2 years, then archive
- Clean up expired geocoding_cache entries daily
- Soft delete saved_locations (add deleted_at column) for recovery

### Backup and Recovery
- Include all tables in regular database backups
- Test restore procedures regularly
- Consider point-in-time recovery for critical data
- Replicate to standby database for high availability

### Security Considerations
- Encrypt sensitive preference data at rest
- Use parameterized queries to prevent SQL injection
- Limit database user permissions to minimum required
- Audit all preference and location modifications
- Mask personal data in logs and error messages
