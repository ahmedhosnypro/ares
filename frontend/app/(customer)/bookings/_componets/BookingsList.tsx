"use client";

import { useState, useEffect, useCallback } from "react";
import BookingCard from "./BookingCard";
import BookingFilters from "./BookingFilters";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "@/src/utils/logger";
import { Calendar, CarFront } from "lucide-react";
import Link from "next/link";
import { toApiUrl } from "@/src/utils/api-client";

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

interface RawBookingItem {
  readonly Id?: string;
  readonly id?: string;
  readonly Car?: {
    readonly id?: string;
    readonly Id?: string;
    readonly name?: string;
    readonly Name?: string;
    readonly image?: string;
    readonly Image?: string;
  };
  readonly car?: {
    readonly id?: string;
    readonly Id?: string;
    readonly name?: string;
    readonly Name?: string;
    readonly image?: string;
    readonly Image?: string;
  };
  readonly Supplier?: {
    readonly id?: string;
    readonly Id?: string;
    readonly fullName?: string;
    readonly FullName?: string;
  };
  readonly supplier?: {
    readonly id?: string;
    readonly Id?: string;
    readonly fullName?: string;
    readonly FullName?: string;
  };
  readonly PickupLocation?: {
    readonly id?: string;
    readonly Id?: string;
    readonly name?: string;
    readonly Name?: string;
  };
  readonly pickupLocation?: {
    readonly id?: string;
    readonly Id?: string;
    readonly name?: string;
    readonly Name?: string;
  };
  readonly DropOffLocation?: {
    readonly id?: string;
    readonly Id?: string;
    readonly name?: string;
    readonly Name?: string;
  };
  readonly dropOffLocation?: {
    readonly id?: string;
    readonly Id?: string;
    readonly name?: string;
    readonly Name?: string;
  };
  readonly From?: string;
  readonly from?: string;
  readonly To?: string;
  readonly to?: string;
  readonly Price?: number;
  readonly price?: number;
  readonly Status?: string;
  readonly status?: string;
}

interface ApiResponse {
  readonly resultData?: readonly RawBookingItem[];
  readonly pageInfo?: readonly { readonly totalRecords?: number }[];
}

export default function BookingsList({ userId, accessToken }: Readonly<{ userId: string; accessToken: string }>) {
  const [bookings, setBookings] = useState<readonly BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasEverBooked, setHasEverBooked] = useState<boolean | null>(null); // حالة جديدة للمستخدمين الجدد

  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const size = 6;

  const [activeStatuses, setActiveStatuses] = useState<readonly string[]>([
    "Pending",
    "Deposit",
    "Paid",
    "Reserved",
    "Cancelled",
  ]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      // 1. أولاً: نเชيك هل اليوزر ده عنده أي حجوزات أصلاً ولا ده حساب جديد؟
      if (hasEverBooked === null) {
        const hasBookingsRes = await fetch(toApiUrl(`/api/has-bookings/${userId}`), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (hasBookingsRes.status === 204) {
          setHasEverBooked(false);
          setLoading(false);
          return; // لو ملوش، نوقف هنا ونعرض شاشة الترحيب
        }
        setHasEverBooked(true);
      }

      // 2. ثانياً: لو عنده، نجيب الداتا بالـ Body اللي الباك إند طالبه بالمللي
      const response = await fetch(toApiUrl(`/api/bookings/${String(page)}/${String(size)}/en`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: userId,
          suppliers: [], // حسب الاتفاق
          statuses: activeStatuses,
          carId: null,
          filter: {
            from: null,
            to: null,
            keyword: searchKeyword !== "" ? searchKeyword : null,
            pickupLocation: null,
            dropOffLocation: null,
          },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as ApiResponse;
        const normalizedBookings = (data.resultData ?? []).map(booking => ({
          _id: booking.id || booking.Id,
          car:
            booking.car || booking.Car
              ? {
                  _id: booking.car?.id || booking.car?.Id || booking.Car?.id || booking.Car?.Id,
                  name: booking.car?.name || booking.car?.Name || booking.Car?.name || booking.Car?.Name,
                  image: booking.car?.image || booking.car?.Image || booking.Car?.image || booking.Car?.Image,
                }
              : undefined,
          supplier:
            booking.supplier || booking.Supplier
              ? {
                  _id: booking.supplier?.id || booking.supplier?.Id || booking.Supplier?.id || booking.Supplier?.Id,
                  fullName:
                    booking.supplier?.fullName ||
                    booking.supplier?.FullName ||
                    booking.Supplier?.fullName ||
                    booking.Supplier?.FullName,
                }
              : undefined,
          pickupLocation:
            booking.pickupLocation || booking.PickupLocation
              ? {
                  _id:
                    booking.pickupLocation?.id ||
                    booking.pickupLocation?.Id ||
                    booking.PickupLocation?.id ||
                    booking.PickupLocation?.Id,
                  name:
                    booking.pickupLocation?.name ||
                    booking.pickupLocation?.Name ||
                    booking.PickupLocation?.name ||
                    booking.PickupLocation?.Name,
                }
              : undefined,
          dropOffLocation:
            booking.dropOffLocation || booking.DropOffLocation
              ? {
                  _id:
                    booking.dropOffLocation?.id ||
                    booking.dropOffLocation?.Id ||
                    booking.DropOffLocation?.id ||
                    booking.DropOffLocation?.Id,
                  name:
                    booking.dropOffLocation?.name ||
                    booking.dropOffLocation?.Name ||
                    booking.DropOffLocation?.name ||
                    booking.DropOffLocation?.Name,
                }
              : undefined,
          from: booking.from || booking.From,
          to: booking.to || booking.To,
          price: booking.price || booking.Price,
          status: booking.status || booking.Status,
        }));

        setBookings(normalizedBookings);
        setTotalRecords(data.pageInfo?.[0]?.totalRecords ?? 0);
      }
    } catch (error) {
      logger.error("Fetch bookings error", error);
    } finally {
      setLoading(false);
    }
  }, [page, userId, accessToken, activeStatuses, searchKeyword, size, hasEverBooked]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const handleFilterChange = useCallback((statuses: readonly string[], keyword: string) => {
    setActiveStatuses(statuses);
    setSearchKeyword(keyword);
    setPage(1);
  }, []);

  const totalPages = Math.ceil(totalRecords / size);

  const getVisiblePages = () => {
    let start = Math.max(1, page - 1);
    const end = Math.min(totalPages, start + 2);
    if (end - start < 2) start = Math.max(1, end - 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // State 1: Loading Skeletons
  if (loading) {
    return (
      <div className="space-y-8">
        <BookingFilters onFilterChange={handleFilterChange} />
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-3xl border border-slate-100 bg-white/70 p-6 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="flex flex-col gap-6 sm:flex-row">
                <div className="h-40 w-full rounded-2xl bg-slate-200 dark:bg-slate-800 sm:w-56"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-6 w-1/3 rounded bg-slate-200 dark:bg-slate-800"></div>
                  <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-800"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
                    <div className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // State 2: Never Booked Anything (Zero State)
  if (hasEverBooked === false) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-24"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10"></div>
        <div className="relative z-10">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <CarFront className="h-12 w-12" />
          </div>
          <h3 className="mb-4 text-3xl font-black text-slate-900 dark:text-white">Ready for your first trip?</h3>
          <p className="mx-auto mb-8 max-w-md text-slate-500 dark:text-slate-400">
            You haven&apos;t made any reservations yet. Browse our premium collection of vehicles and start your journey
            today.
          </p>
          <Link
            href="/vehicles"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-4 font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-indigo-300 dark:shadow-none dark:hover:bg-indigo-500"
          >
            Browse Vehicles
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <BookingFilters onFilterChange={handleFilterChange} />

      {/* State 3: Filtered No Results */}
      {bookings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 py-24 text-center backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50"
        >
          <div className="relative z-10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <Calendar className="h-10 w-10" />
            </div>
            <h3 className="mb-2 text-2xl font-black text-slate-900 dark:text-white">No matches found</h3>
            <p className="mx-auto max-w-sm text-slate-500 dark:text-slate-400">
              Try adjusting your filters or searching for something else.
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          {/* State 4: Data Loaded */}
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-6"
            >
              {bookings.map((booking, index) => (
                <motion.div
                  key={booking._id ?? String(index)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <BookingCard booking={booking} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Pagination */}
          {totalRecords > size && (
            <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white/70 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70 sm:flex-row">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Showing <span className="font-bold text-indigo-600 dark:text-indigo-400">{(page - 1) * size + 1}</span>{" "}
                to{" "}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.min(page * size, totalRecords)}
                </span>{" "}
                of <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalRecords}</span> bookings
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setPage(p => Math.max(1, p - 1));
                  }}
                  disabled={page === 1}
                  className="group flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 dark:bg-slate-800 dark:hover:bg-slate-700 sm:px-6 sm:py-3"
                >
                  <span className="transition-transform group-hover:-translate-x-0.5">←</span> Prev
                </button>

                <div className="flex items-center gap-1 px-2 sm:px-4">
                  {getVisiblePages().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setPage(pageNum);
                      }}
                      className={`h-9 w-9 rounded-xl text-sm font-bold transition-all sm:h-10 sm:w-10 ${
                        page === pageNum
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setPage(p => p + 1);
                  }}
                  disabled={page >= totalPages}
                  className="group flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 dark:bg-slate-800 dark:hover:bg-slate-700 sm:px-6 sm:py-3"
                >
                  Next <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
