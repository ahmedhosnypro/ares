# Driver Complete Profile Translation Tasks

## Page Overview

- Route: `/(dashboard)/driver/complete-profile`
- Source: app/[locale]/(dashboard)/driver/complete-profile/

## Translation Status

- [ ] Not started
- [x] In progress
- [x] Completed

## Shared Components

- None (self-contained page)

## Component Discovery

- CompleteProfileClient.tsx (main component with all UI elements)
  - Hardcoded strings in JSX:
    - "Complete Your Driver Profile" (h1 title)
    - "Please provide your details and documents to start receiving ride requests." (subtitle)
    - "Personal Details" (section heading)
    - "Address" (textfield label)
    - "Emergency Contact Name" (textfield label)
    - "Emergency Contact Phone" (textfield label)
    - "Work Areas" (section heading)
    - "Select Service Areas" (input label)
    - "Loading areas..." (loading message)
    - "License & Documents" (section heading)
    - "License Number" (textfield label)
    - "License Expiry Date" (textfield label)
    - "Driver License Image" (file uploader label)
    - "National ID (Front)" (file uploader label)
    - "National ID (Back)" (file uploader label)
    - "Upload Image" (button text)
    - "Submit Profile" (submit button text)

## Translation Tasks

- [x] Create type file for driver complete profile translations
- [x] Register type in message schema
- [x] Create English translation file
- [x] Create Arabic translation file
- [x] Update root translation files
- [x] Replace hardcoded strings with translation hooks
- [x] Verify translations in UI
