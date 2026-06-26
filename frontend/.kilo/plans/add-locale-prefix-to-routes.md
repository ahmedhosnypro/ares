# Plan: Add [locale] Prefix to All Routing Actions

## Overview

This plan outlines the steps to add the [locale] prefix to all routing/redirect actions in the Next.js application that uses next-intl for internationalization.

## Current State Analysis

1. The application uses next-intl for internationalization with a [locale] route parameter
2. Routes are structured under app/[locale]/ directory
3. There are multiple routing actions using router.push(), router.replace(), and redirect() that need to be updated
4. Some routes are absolute paths that don't include the locale prefix

## Implementation Strategy

### 1. Client-Side Routing Updates

Update all client-side routing actions to include the locale prefix:

Pattern to find:

- router.push('/')
- router.replace('/')
- router.back()

Pattern to replace with:

- router.push(\/\/\)
- router.replace(\/\/\)
- Keep router.back() as is since it navigates to the previous page

### 2. Server-Side Redirects

Update all server-side redirects to include the locale prefix:

Pattern to find:

- redirect('/')
- redirect('')

Pattern to replace with:

- redirect(\/\/\)
- redirect(\/\/\)

### 3. Special Cases

- Callback URLs in authentication flows
- External URLs should remain unchanged
- URLs that already include locale should not be modified

## Files to Process

Based on the grep search, there are numerous files containing routing actions that need to be updated. These include:

1. app/[locale]/(dashboard)/\_components/DashboardShell.tsx
2. app/[locale]/(public)/vehicles/[vehicleId]/\_components/vehicle-details/VehicleDetailsClient.tsx
3. app/[locale]/(public)/vehicles/[vehicleId]/\_components/vehicle-details/BookingCard.tsx
4. app/[locale]/(public)/search/SearchFormFilter.tsx
5. app/[locale]/(public)/bookings/confirmation/[bookingId]/page.tsx
6. And many more files with similar patterns

## Implementation Steps

### Step 1: Create a Helper Function

Create a helper function to generate localized URLs in utils/localized-url.ts

### Step 2: Update Client-Side Routing

For each file with useRouter:

1. Import the locale from context or props
2. Update router.push() and router.replace() calls to use the localized URL

### Step 3: Update Server-Side Redirects

For server-side files using redirect():

1. Update redirect calls to include the locale parameter
2. Get locale from cookies, headers, or parameters

### Step 4: Update Authentication Callbacks

Update sign-in and authentication callbacks to preserve the locale in callback URLs.

## Technical Approach

### Safe Regex Replacement Patterns

We'll use the following patterns for safe replacement:

1. Find: router\.push\('\/([^']\*)'
   Replace: router.push(\/\/\\)

2. Find: router\.replace\('\/([^']\*)'
   Replace: router.replace(\/\/\\)

3. Find: redirect\('\/([^']\*)'
   Replace: redirect(\/\/\\)

### Special Handling Required

1. Template literals in URLs (e.g., /booking/\) - need careful handling
2. Callback URLs that should preserve the full path
3. External URLs that should not be modified
4. URLs that already contain locale parameter

## Validation

1. Run TypeScript compilation to check for type errors
2. Run linting to ensure code style compliance
3. Test routing functionality in development environment
4. Verify that locale switching works correctly
5. Check that all redirects maintain proper locale context

## Rollback Plan

If issues are found:

1. Revert the changes using git
2. Identify problematic patterns
3. Refine the replacement strategy
4. Re-attempt with more targeted approach

## Timeline

- Preparation and planning: 1 hour
- Implementation: 3-4 hours
- Testing and validation: 2 hours
- Total estimated time: 6-7 hours
