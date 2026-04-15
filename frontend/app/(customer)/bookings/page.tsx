import BookingsList from "./_componets/BookingsList";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function MyBookingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.id || !session.accessToken) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in required</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400">Please sign in to view your bookings.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header Section */}
        <header className="mb-12 text-center sm:text-left">
          <div className="mb-6 inline-block rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-[2px] shadow-sm">
            <div className="rounded-xl bg-white/90 px-6 py-2 backdrop-blur-sm dark:bg-slate-900/90">
              <span className="text-xs font-black tracking-widest text-indigo-600 dark:text-indigo-400">
                RENTAL MANAGEMENT
              </span>
            </div>
          </div>

          <h1 className="bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text pb-3 text-4xl font-black text-transparent dark:from-white dark:via-indigo-200 dark:to-purple-200 md:text-5xl lg:text-6xl">
            My Bookings
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-slate-500 dark:text-slate-400 sm:mx-0">
            Track, manage, and review all your car rental reservations in one place.
          </p>
        </header>

        {/* Main Content */}
        <BookingsList userId={session.user.id} accessToken={session.accessToken} />
      </div>
    </main>
  );
}
