# Change Password Page Specification

## Original Location in `bookcars`
- Frontend: `bookcars/frontend/src/pages/ChangePassword.tsx`
- Admin: `bookcars/admin/src/pages/ChangePassword.tsx`

## Design & Structure
- **Layout**: Centered, elevated card (`Paper` from MUI) containing a dedicated form.
- **Fields**: 
  - `currentPassword` (conditionally rendered if the user already has a password).
  - `newPassword` (Input type password).
  - `confirmPassword` (Input type password).
- **Actions**: "Reset Password" (submit) and "Cancel" (returns to home or settings).

## Architecture & Logic
- **Form State**: Managed using `react-hook-form`.
- **Validation**: Strict client-side validation using `zod` (`@hookform/resolvers/zod`).
- **Initialization**: Checks if the user already has an active password (`hasPassword`). If they logged in via an OAuth provider and haven't set a local password, it allows them to create one without providing a "current" password.

## API & Types
- **Types**: `ChangePasswordPayload { _id: string, password?: string, newPassword: string, strict: boolean }`
- **Endpoints Used**:
  - `GET /api/has-password/:userId` (Checks if the user has a local password hash)
  - `POST /api/check-password` (Validates the current password before allowing change)
  - `POST /api/change-password` (Commits the password change)

## Proposed Frontend Implementation for `ares` (Next.js)
**Path**: `ares/frontend/app/(customer)/account/change-password/page.tsx` (or embed as a tab component in `app/(customer)/account/profile/page.tsx`).
- **Framework**: Use Next.js App Router (`'use client'`).
- **UI Components**: Use your existing design system (Tailwind CSS / Shadcn UI / MUI) for consistent inputs.
- **State**: Use `react-hook-form` + `@hookform/resolvers/zod`.
- **Submission**: Post the data to your Next.js API Route or Server Action, passing the JWT auth token.

## Proposed Backend Implementation for `ares` (C# .NET)
Because `ares` uses a C# .NET backend, the implementation will reside in the Application/API layers.

1. **API Endpoint (`Api/Controllers/UsersController.cs` or `AuthController.cs`)**:
   ```csharp
   [HttpPost("{id}/change-password")]
   [Authorize]
   public async Task<IActionResult> ChangePassword(Guid id, [FromBody] ChangePasswordRequest request)
   {
       // Ensure the authenticated user is changing their own password
   }
   ```

2. **Application Command (MediatR)**:
   - `ChangePasswordCommand`: Contains `UserId`, `CurrentPassword`, `NewPassword`.
   - `ChangePasswordCommandHandler`: 
     - Retrieves the user.
     - Verifies `CurrentPassword` matches the database hash (using `BCrypt` or ASP.NET `PasswordHasher`).
     - Hashes `NewPassword` and updates the entity.
     - Saves changes.

3. **Domain Layer**: Ensure `User` entity has a method to `UpdatePasswordHash(string newHash)`.