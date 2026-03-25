import BookingsList from './_componets/BookingsList';

export default function MyBookingsPage() {
  // TODO: Replace this placeholder with the actual authenticated user ID (e.g., from NextAuth session)
  const currentUserId = "123-uuid-placeholder";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Page Header Section */}
        <header className="mb-12 text-center sm:text-left">
          
          <div className="mb-6 inline-block rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-[2px] shadow-sm">
            <div className="rounded-xl bg-white/90 px-6 py-2 backdrop-blur-sm">
              <span className="text-xs font-black tracking-widest text-indigo-600">
                RENTAL MANAGEMENT
              </span>
            </div>
          </div>
          
          <h1 className="pb-3 bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-4xl font-black text-transparent md:text-5xl lg:text-6xl">
            My Bookings
          </h1>
          
          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-slate-500 sm:mx-0">
            Track, manage, and review all your car rental reservations in one place.
          </p>
        </header>

        {/* Main Content: Filterable and paginated list of user bookings */}
        <BookingsList userId={currentUserId} />

      </div>
    </main>
  );
}