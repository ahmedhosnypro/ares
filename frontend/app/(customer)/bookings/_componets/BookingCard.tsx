import React from "react";
import Link from "next/link";
import { Calendar, MapPin, Building2, ArrowRight } from "lucide-react";

interface BookingItem {
  readonly _id?: string;
  readonly car?: { readonly _id?: string; readonly name?: string; readonly image?: string };
  readonly supplier?: { readonly _id?: string; readonly fullName?: string };
  readonly pickupLocation?: { readonly _id?: string; readonly name?: string };
  readonly dropOffLocation?: { readonly _id?: string; readonly name?: string };
  readonly from?: string;
  readonly to?: string;
  readonly price?: number;
  readonly status?: string;
}

const getStatusStyles = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "paid":
    case "reserved":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
    case "pending":
    case "deposit":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
    case "cancelled":
      return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
};

export default function BookingCard({ booking }: Readonly<{ booking: BookingItem }>) {
  const fromDate = booking.from ? new Date(booking.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A";
  const toDate = booking.to ? new Date(booking.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A";

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-100/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-indigo-900/20 sm:p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        
        {/* Car Image */}
        <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 sm:h-40 sm:w-56">
          <img
            src={booking.car?.image ?? "/placeholder-car.jpg"}
            alt={booking.car?.name ?? "Car image"}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md sm:text-xs ${getStatusStyles(booking.status)}`}>
            {booking.status ?? "Unknown"}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col justify-between gap-4">
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h3 className="line-clamp-1 text-xl font-black text-slate-900 transition-colors dark:text-white">
                {booking.car?.name ?? "Unknown Car"}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Building2 className="h-4 w-4" />
                <span>{booking.supplier?.fullName ?? "Unknown Supplier"}</span>
              </div>
            </div>
            
            <div className="text-left sm:text-right">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">${booking.price ?? 0}</span>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Price</span>
            </div>
          </div>

          <div className="h-px w-full bg-slate-100 dark:bg-slate-800"></div>

          {/* Locations & Dates */}
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300">Pick-up</p>
                <p className="line-clamp-1 text-slate-500 dark:text-slate-400">{booking.pickupLocation?.name ?? "N/A"}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                  <Calendar className="h-3 w-3" /> {fromDate}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300">Drop-off</p>
                <p className="line-clamp-1 text-slate-500 dark:text-slate-400">{booking.dropOffLocation?.name ?? "N/A"}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                  <Calendar className="h-3 w-3" /> {toDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 sm:ml-4">
          <Link
            href={`/booking/${booking._id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:shadow-indigo-900/50 sm:w-auto sm:py-3"
          >
            Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}