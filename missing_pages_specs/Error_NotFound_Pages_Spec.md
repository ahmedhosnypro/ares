# Error and NotFound (NoMatch) Pages Specification

## Original Location in `bookcars`
- Frontend: `bookcars/frontend/src/pages/Error.tsx`, `bookcars/frontend/src/pages/NoMatch.tsx`
- Admin: `bookcars/admin/src/pages/Error.tsx`, `bookcars/admin/src/pages/NoMatch.tsx`

## Design & Structure
- **NoMatch (404)**: A fallback page displaying "404 Not Found" and a link directing the user back to the homepage.
- **Error (500)**: A global error boundary fallback page displaying "500 Internal Server Error" (or a generic "Something went wrong" message) with a button to reload the application.

## Architecture & Logic
- **React Router**: `NoMatch` is typically registered as a catch-all route `<Route path="*" element={<NoMatch />} />`.
- **ErrorBoundary**: `Error` is mounted inside an Error Boundary component that catches standard React rendering exceptions.

## API & Types
- Static presentational pages. No API calls made directly.

## Proposed Frontend Implementation for `ares` (Next.js)

The Next.js App Router provides specialized, built-in files to handle these exact scenarios natively at the root of the `app/` directory.

1. **Not Found Page (`ares/frontend/app/not-found.tsx`)**:
   Next.js uses `not-found.tsx` to handle 404 responses automatically.
   ```tsx
   import Link from 'next/link';

   export default function NotFound() {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen">
         <h1 className="text-4xl font-bold">404 - Not Found</h1>
         <p className="mt-4 text-gray-600">The page you are looking for does not exist.</p>
         <Link href="/" className="mt-6 px-4 py-2 bg-blue-600 text-white rounded">
           Return Home
         </Link>
       </div>
     );
   }
   ```

2. **Global Error Page (`ares/frontend/app/error.tsx`)**:
   Next.js uses `error.tsx` as a React Error Boundary. It **must** be a Client Component.
   ```tsx
   'use client'; // Error components must be Client Components

   import { useEffect } from 'react';

   export default function Error({
     error,
     reset,
   }: {
     error: Error & { digest?: string };
     reset: () => void;
   }) {
     useEffect(() => {
       console.error(error);
     }, [error]);

     return (
       <div className="flex flex-col items-center justify-center min-h-screen">
         <h2 className="text-2xl font-bold text-red-600">Something went wrong!</h2>
         <button
           onClick={() => reset()} // Attempts to recover by trying to re-render the segment
           className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
         >
           Try again
         </button>
       </div>
     );
   }
   ```

## Proposed Backend Implementation for `ares` (C# .NET)

To ensure the frontend reliably receives standard HTTP status codes (404 and 500), the C# .NET API must implement global exception handling.

1. **Global Exception Middleware (`Api/Middleware/ExceptionMiddleware.cs`)**:
   Catch unhandled exceptions and return an RFC 7807 `ProblemDetails` response with a 500 status code.

2. **API Response Standardization**:
   Ensure controllers return `NotFound()` (404) when resources (like a specific vehicle or booking) are requested but do not exist in the database, allowing the frontend to trigger the `notFound()` Next.js helper.