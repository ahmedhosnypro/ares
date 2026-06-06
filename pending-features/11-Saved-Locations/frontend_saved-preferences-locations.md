# Feature: Saved Preferences & Locations

## Overview

The Saved Preferences & Locations feature enables users to store and manage their booking preferences and frequently used locations for a faster, more personalized rental experience. This feature reduces friction in the booking process by pre-filling common selections, minimizing data entry, and providing quick access to saved configurations. Users can customize their default settings for vehicle types, insurance coverage, extras, payment methods, and communication preferences, while also maintaining a library of frequently used pickup and return locations with custom nicknames.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature IDs

- F-AM-013: Saved Preferences
- F-AM-014: Saved Locations
- F-USER-IND-004: Customer Profile - Saved Preferences
- F-USER-IND-005: Customer Profile - Saved Locations
- F-FUNC-UM-009: User Preferences (Functional Requirements)

## User Stories

### As a frequent renter
- I want to save my preferred vehicle types and features, so that I don't have to select them every time I book
- I want to save my home and work addresses, so that I can quickly select pickup locations without typing
- I want to set default insurance and extras, so that my bookings are pre-configured with my usual choices
- I want to save my payment preferences, so that checkout is faster and more convenient

### As a business traveler
- I want to save multiple frequent locations (airport, office, hotel), so that I can quickly book from common locations
- I want to set default communication preferences, so that I receive notifications in my preferred channels
- I want to nickname my saved locations, so that I can easily identify them (e.g., "Home Office", "Client Site")

### As a user with accessibility needs
- I want to save my accessibility requirements, so that I don't have to re-enter them for every booking
- I want my saved preferences to automatically apply to new bookings, so that I have a consistent experience

### As a power user
- I want to manage multiple saved locations, so that I can organize my frequent rental spots
- I want to edit or delete saved preferences, so that I can keep my settings up to date
- I want to see my location history, so that I can quickly access recently used addresses

## Frontend Specifications

### Pages

#### Preferences Management Page (`/account/preferences`)
Main page for managing all user preferences with tabbed interface for different preference categories.

**Route**: `/account/preferences`
**Access**: Authenticated users only
**Layout**: Account settings layout with sidebar navigation

#### Saved Locations Page (`/account/locations`)
Dedicated page for managing saved locations with map integration.

**Route**: `/account/locations`
**Access**: Authenticated users only
**Layout**: Account settings layout with sidebar navigation

### UI Components

#### PreferencesOverview Component
Dashboard showing summary of current preferences with quick edit actions.

**Elements**:
- Preference category cards (Vehicle, Insurance, Extras, Payment, Communication, Accessibility)
- Current settings summary for each category
- "Edit" button for each category
- Visual indicators for incomplete preferences
- Last updated timestamp

**Interactions**:
- Click category card to expand inline editor
- Click "Edit" button to navigate to detailed settings
- Hover to show tooltip with preference details

#### VehiclePreferences Component
Form for setting preferred vehicle types and features.

**Fields**:
- Preferred vehicle categories (multi-select: Economy, Compact, SUV, Luxury, etc.)
- Preferred transmission type (Automatic, Manual, No preference)
- Preferred fuel type (Gasoline, Diesel, Electric, Hybrid, No preference)
- Preferred features (multi-select: GPS, Bluetooth, Backup camera, etc.)
- Seating capacity preference (dropdown: 2-9+ seats)
- Luggage capacity preference (Small, Medium, Large, Extra Large)

**Validation**:
- At least one vehicle category must be selected
- All fields are optional except vehicle category

#### InsurancePreferences Component
Form for setting default insurance coverage level.

**Fields**:
- Default insurance tier (radio buttons: Basic, Standard, Premium, Comprehensive)
- Auto-select insurance on booking (toggle)
- Insurance preference notes (textarea)

**Display**:
- Coverage comparison table showing what each tier includes
- Pricing information (if available)
- Recommended tier based on user history

#### ExtrasPreferences Component
Form for setting default rental extras and equipment.

**Fields**:
- GPS Navigation (toggle + auto-add to booking)
- Child seat (toggle + age selection + auto-add)
- Additional driver (toggle + auto-add)
- Toll pass (toggle + auto-add)
- WiFi hotspot (toggle + auto-add)
- Snow chains (toggle + auto-add)
- Ski rack (toggle + auto-add)
- Custom extras notes (textarea)

**Interactions**:
- Toggle switches for each extra
- "Auto-add to booking" checkbox for each enabled extra
- Quantity selector for items that can have multiples (child seats)

#### PaymentPreferences Component
Form for setting default payment method and timing preferences.

**Fields**:
- Default payment method (radio buttons: Credit card, Debit card, Digital wallet, Bank transfer)
- Saved payment method selection (dropdown of user's saved cards)
- Payment timing preference (radio buttons: Pay now, Pay at pickup, Split payment)
- Auto-apply default payment (toggle)
- Invoice delivery preference (Email, SMS, Both)

**Security**:
- Display last 4 digits of saved cards only
- Require re-authentication to change payment preferences
- Show security badges and PCI compliance indicators

#### CommunicationPreferences Component
Form for setting notification and communication preferences.

**Fields**:
- Email notifications (toggle + email address)
- SMS notifications (toggle + phone number)
- Push notifications (toggle)
- Notification types (checkboxes: Booking confirmations, Payment receipts, Trip reminders, Promotional offers, Price alerts, Platform updates)
- Quiet hours (time range picker)
- Notification frequency (radio buttons: Real-time, Daily digest, Weekly digest)
- Preferred language (dropdown)
- Preferred contact method (radio buttons: Email, Phone, SMS, In-app)

**Validation**:
- At least one notification channel must be enabled
- Valid email and phone number required if channels are enabled
- Quiet hours end time must be after start time

#### AccessibilityPreferences Component
Form for saving accessibility requirements.

**Fields**:
- Mobility requirements (checkboxes: Wheelchair accessible, Hand controls, Swivel seat, Ramp/lift)
- Visual requirements (checkboxes: Large text, High contrast, Screen reader compatible)
- Hearing requirements (checkboxes: Visual alerts, Closed captions)
- Cognitive requirements (checkboxes: Simplified interface, Extended time limits)
- Service animal accommodation (toggle)
- Additional accessibility notes (textarea)

**Display**:
- Clear descriptions of each accessibility feature
- Icons representing each accommodation type
- Link to full accessibility policy

#### SavedLocationsList Component
List view of all saved locations with management actions.

**Elements**:
- Location cards showing nickname, address, and usage count
- Location type badge (Home, Work, Airport, Custom)
- "Set as default" action for pickup/return
- Edit and delete actions
- "Add new location" button
- Search/filter bar for locations
- Sort options (Most used, Recently used, Alphabetical)

**Interactions**:
- Click location card to view details
- Click edit icon to modify location
- Click delete icon to remove location (with confirmation)
- Drag to reorder locations
- Click "Set as default" to mark as primary pickup/return location

#### LocationEditor Component
Form for adding or editing a saved location.

**Fields**:
- Location nickname (text input, required)
- Location type (dropdown: Home, Work, Airport, Hotel, Custom)
- Address search (autocomplete input with map integration)
- Street address (text input)
- City (text input)
- State/Province (text input)
- Postal code (text input)
- Country (dropdown)
- Location notes (textarea)
- Set as default pickup location (checkbox)
- Set as default return location (checkbox)

**Map Integration**:
- Interactive map showing selected location
- Drag pin to adjust exact location
- Nearby rental locations indicator
- Distance to nearest rental location

**Validation**:
- Nickname is required and must be unique
- Address must be valid and geocodable
- All address fields are required

#### LocationQuickSelector Component
Compact location selector for use during booking flow.

**Elements**:
- Dropdown showing saved locations
- Location type icons
- "Use current location" option
- "Add new location" option
- Recently used locations section
- Search bar for filtering saved locations

**Interactions**:
- Click saved location to select
- Type to search/filter locations
- Click "Use current location" to detect GPS position
- Click "Add new location" to open location editor modal

#### LocationHistory Component
Timeline view of recently used locations.

**Elements**:
- Chronological list of locations used in past bookings
- Date and booking reference for each usage
- "Save this location" action for unsaved locations
- Filter by date range
- Export location history option

**Display**:
- Last 50 locations used
- Grouped by month
- Duplicate detection (show usage count)

### User Flows

#### Save Preferences Flow
1. User navigates to Account Settings → Preferences
2. System displays PreferencesOverview with current settings
3. User clicks on a preference category (e.g., Vehicle Preferences)
4. System expands category or navigates to detailed settings page
5. User modifies preferences using form controls
6. User clicks "Save Preferences" button
7. System validates input
8. System saves preferences to backend
9. System displays success confirmation
10. System updates PreferencesOverview with new settings

#### Save Location Flow
1. User navigates to Account Settings → Saved Locations
2. System displays SavedLocationsList
3. User clicks "Add New Location" button
4. System displays LocationEditor modal/page
5. User enters location nickname
6. User searches for address using autocomplete
7. System displays map with selected location
8. User adjusts pin if needed
9. User optionally sets as default pickup/return
10. User clicks "Save Location" button
11. System validates location data
12. System saves location to backend
13. System displays success confirmation
14. System updates SavedLocationsList with new location

#### Quick Location Selection During Booking
1. User starts new booking flow
2. System displays pickup location selector
3. User clicks location input field
4. System displays LocationQuickSelector dropdown
5. User sees saved locations with nicknames
6. User clicks desired saved location
7. System auto-fills address fields
8. System displays map with selected location
9. User proceeds with booking

#### Apply Saved Preferences to Booking
1. User starts new booking flow
2. System loads user's saved preferences
3. System pre-selects preferred vehicle categories in search filters
4. User selects specific vehicle
5. System auto-fills insurance selection with default tier
6. System auto-adds default extras to booking
7. System pre-selects default payment method at checkout
8. User reviews and confirms booking with pre-filled preferences

#### Edit Saved Location
1. User navigates to Saved Locations page
2. System displays SavedLocationsList
3. User clicks edit icon on a location card
4. System displays LocationEditor with current location data
5. User modifies nickname, address, or settings
6. User clicks "Update Location" button
7. System validates changes
8. System updates location in backend
9. System displays success confirmation
10. System refreshes SavedLocationsList

#### Delete Saved Location
1. User navigates to Saved Locations page
2. System displays SavedLocationsList
3. User clicks delete icon on a location card
4. System displays confirmation dialog
5. User confirms deletion
6. System removes location from backend
7. System displays success confirmation
8. System removes location from SavedLocationsList

### Data Requirements

#### User Preferences Data
```
{
  userId: string
  vehiclePreferences: {
    categories: string[]
    transmissionType: string
    fuelType: string
    features: string[]
    seatingCapacity: number
    luggageCapacity: string
  }
  insurancePreferences: {
    defaultTier: string
    autoSelect: boolean
    notes: string
  }
  extrasPreferences: {
    gps: { enabled: boolean, autoAdd: boolean }
    childSeat: { enabled: boolean, autoAdd: boolean, age: string }
    additionalDriver: { enabled: boolean, autoAdd: boolean }
    tollPass: { enabled: boolean, autoAdd: boolean }
    wifiHotspot: { enabled: boolean, autoAdd: boolean }
    snowChains: { enabled: boolean, autoAdd: boolean }
    skiRack: { enabled: boolean, autoAdd: boolean }
    notes: string
  }
  paymentPreferences: {
    defaultMethod: string
    savedPaymentMethodId: string
    paymentTiming: string
    autoApply: boolean
    invoiceDelivery: string
  }
  communicationPreferences: {
    email: { enabled: boolean, address: string }
    sms: { enabled: boolean, phone: string }
    push: { enabled: boolean }
    notificationTypes: string[]
    quietHours: { start: string, end: string }
    frequency: string
    language: string
    preferredContact: string
  }
  accessibilityPreferences: {
    mobilityRequirements: string[]
    visualRequirements: string[]
    hearingRequirements: string[]
    cognitiveRequirements: string[]
    serviceAnimal: boolean
    notes: string
  }
  lastUpdated: timestamp
}
```

#### Saved Location Data
```
{
  locationId: string
  userId: string
  nickname: string
  locationType: string
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
    coordinates: { lat: number, lng: number }
  }
  notes: string
  isDefaultPickup: boolean
  isDefaultReturn: boolean
  usageCount: number
  lastUsed: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Location History Data
```
{
  historyId: string
  userId: string
  locationId: string (nullable)
  address: object
  bookingId: string
  usedAt: timestamp
  locationType: string
}
```

### API Integration Points

#### Get User Preferences
- **Endpoint**: `GET /api/users/{userId}/preferences`
- **Purpose**: Retrieve all saved preferences for a user
- **Response**: User preferences object with all categories

#### Update User Preferences
- **Endpoint**: `PUT /api/users/{userId}/preferences`
- **Purpose**: Update one or more preference categories
- **Request Body**: Partial or complete preferences object
- **Response**: Updated preferences object

#### Get Saved Locations
- **Endpoint**: `GET /api/users/{userId}/locations`
- **Purpose**: Retrieve all saved locations for a user
- **Query Parameters**: `sort`, `filter`, `limit`, `offset`
- **Response**: Array of saved location objects

#### Create Saved Location
- **Endpoint**: `POST /api/users/{userId}/locations`
- **Purpose**: Add a new saved location
- **Request Body**: Location object (without locationId)
- **Response**: Created location object with generated locationId

#### Update Saved Location
- **Endpoint**: `PUT /api/users/{userId}/locations/{locationId}`
- **Purpose**: Update an existing saved location
- **Request Body**: Partial or complete location object
- **Response**: Updated location object

#### Delete Saved Location
- **Endpoint**: `DELETE /api/users/{userId}/locations/{locationId}`
- **Purpose**: Remove a saved location
- **Response**: Success confirmation

#### Get Location History
- **Endpoint**: `GET /api/users/{userId}/location-history`
- **Purpose**: Retrieve recently used locations
- **Query Parameters**: `limit`, `startDate`, `endDate`
- **Response**: Array of location history objects

#### Geocode Address
- **Endpoint**: `POST /api/locations/geocode`
- **Purpose**: Convert address to coordinates
- **Request Body**: Address object
- **Response**: Coordinates and validated address

### State Management

#### Preferences State
- Current user preferences (all categories)
- Preferences loading state
- Preferences save state
- Validation errors
- Unsaved changes indicator

#### Locations State
- Saved locations array
- Locations loading state
- Location save/update/delete state
- Selected location for editing
- Location search results
- Location history array
- Map state (center, zoom, markers)

### Performance Considerations

- Cache user preferences in local storage for offline access
- Lazy load location history (paginated)
- Debounce address autocomplete searches (300ms)
- Optimize map rendering for multiple location markers
- Prefetch preferences when user logs in
- Use optimistic UI updates for preference changes

### Accessibility

- Keyboard navigation for all preference forms
- Screen reader announcements for save confirmations
- ARIA labels for all form controls
- Focus management in modals and dropdowns
- High contrast mode support
- Large touch targets for mobile (minimum 44x44px)
- Clear error messages with suggestions

### Mobile Considerations

- Responsive layout for all preference screens
- Touch-optimized controls (larger buttons, switches)
- Native date/time pickers for quiet hours
- GPS integration for "Use current location"
- Swipe gestures for location list management
- Bottom sheet modals for location editor
- Simplified forms with progressive disclosure

## Technology Stack

- **Frontend**: Next.js 14+ with TypeScript, React 18+
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Context API or Zustand
- **Forms**: React Hook Form with Zod validation
- **Maps**: Google Maps API or Mapbox
- **Geocoding**: Google Geocoding API or Mapbox Geocoding

## Implementation Notes

### Preference Application Logic
- Preferences should be applied automatically when user starts a new booking
- Users should be able to override pre-filled preferences during booking
- System should track which preferences are most frequently overridden to suggest updates
- Preferences should not override explicit user selections in current booking session

### Location Management
- Limit users to maximum 20 saved locations to prevent clutter
- Automatically suggest saving frequently used locations (used 3+ times)
- Merge duplicate locations based on address similarity
- Validate that saved locations are within service area

### Data Privacy
- Preferences and locations are private user data
- Do not share location data with third parties without explicit consent
- Allow users to export their preferences and locations (GDPR compliance)
- Provide clear option to delete all saved preferences and locations

### Performance Optimization
- Load preferences asynchronously after initial page load
- Cache preferences in browser for 24 hours
- Use incremental updates (only send changed fields)
- Implement optimistic UI updates with rollback on error

### Future Enhancements
- AI-powered preference suggestions based on booking history
- Seasonal preference profiles (summer vs winter preferences)
- Shared location lists for family accounts
- Integration with calendar for automatic location suggestions
- Voice commands for location selection
- Preference templates for different trip types (business, leisure, family)
