# Settings Page Specification

## Original Location in `bookcars`
- Frontend: `bookcars/frontend/src/pages/Settings.tsx`
- Admin: `bookcars/admin/src/pages/Settings.tsx` (Similar structure)

## Design & Structure
The page is split into three primary elevated cards (`Paper`):
1. **Personal Information**:
   - Avatar Upload Component.
   - Text inputs: Full Name, Email (disabled/readonly), Phone, Birth Date (DatePicker), Location, Bio.
   - Buttons to "Reset Password" (navigates to Change Password page) and "Save".
2. **Driver License**:
   - A dedicated component `DriverLicense` allowing users to upload front and back images of their driver's license.
3. **Network Settings**:
   - A switch (`Switch` from MUI) to toggle "Email Notifications" on or off.

## Architecture & Logic
- **Form Management**: Handled by `react-hook-form` and validated via `zod`.
- **Context**: Hydrates initial form values using the global `UserContext`.
- **Asynchronous Operations**: 
  - Avatar and License uploads trigger immediate loading backdrops and update the user context directly upon success.
  - The email notification switch updates instantly via its own endpoint.

## API & Types
- **Types**: 
  - `UpdateUserPayload { _id, fullName, birthDate, phone, location, bio }`
  - `UpdateEmailNotificationsPayload { _id, enableEmailNotifications }`
- **Endpoints Used**:
  - `POST /api/update-user`
  - `POST /api/update-email-notifications`
  - `POST /api/upload-avatar`
  - `POST /api/upload-driver-license`

## Proposed Frontend Implementation for `ares` (Next.js)
**Path**: Expand existing `ares/frontend/app/(customer)/account/profile/page.tsx` or create a new dedicated `ares/frontend/app/(customer)/account/settings/page.tsx`.
- **Framework**: Client component (`'use client'`) to handle complex form state and file uploads.
- **UI**: Group the settings into Next.js Tabs or stacked Cards (using Tailwind CSS). 
- **File Uploads**: Use the `ares` existing S3/Cloud Storage integration for avatar and license uploads. Ensure you provide visual feedback (progress bar/spinner).

## Proposed Backend Implementation for `ares` (C# .NET)

1. **API Endpoints (`Api/Controllers/UsersController.cs`)**:
   ```csharp
   [HttpPut("{id}")]
   [Authorize]
   public async Task<IActionResult> UpdateProfile(Guid id, [FromBody] UpdateProfileRequest request) { ... }

   [HttpPatch("{id}/email-notifications")]
   [Authorize]
   public async Task<IActionResult> UpdateEmailSettings(Guid id, [FromBody] UpdateNotificationSettingsRequest request) { ... }

   [HttpPost("{id}/avatar")]
   [Authorize]
   public async Task<IActionResult> UploadAvatar(Guid id, IFormFile file) { ... }
   ```

2. **Application Layer (MediatR)**:
   - Create commands like `UpdateUserProfileCommand`, `UpdateUserNotificationSettingsCommand`.
   - The Handlers will validate inputs and modify the SQL database via EF Core.

3. **Infrastructure Layer**:
   - An `IFileStorageService` to handle saving the Avatar/License images to an S3 bucket or local blob storage and returning the URI.