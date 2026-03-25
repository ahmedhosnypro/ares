"use client";

import React, { useState, useEffect, useCallback } from "react";
import BookingCard from "./BookingCard";
import BookingFilters from "./BookingFilters";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";

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

interface ApiResponse {
  readonly resultData?: readonly BookingItem[];
  readonly pageInfo?: readonly { readonly totalRecords?: number }[];
}

interface BookingsListProps {
  readonly userId: string;
}

export default function BookingsList({ userId }: Readonly<BookingsListProps>) {
  const [bookings, setBookings] = useState<readonly BookingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const size = 6;

  const [activeStatuses, setActiveStatuses] = useState<readonly string[]>([
    "Pending",
    "Deposit",
    "Paid",
    "Reserved",
    "Cancelled",
  ]);
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Fetch data from the API whenever page, user, or filters change
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/${String(page)}/${String(size)}/en`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: userId,
          statuses: activeStatuses,
          filter: {
            keyword: searchKeyword !== "" ? searchKeyword : null,
            from: null,
            to: null,
            pickupLocation: null,
            dropOffLocation: null,
          },
        }),
      });

      const data = (await response.json()) as ApiResponse;

      setBookings(data.resultData ?? []);
      setTotalRecords(data.pageInfo?.[0]?.totalRecords ?? 0);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [page, userId, activeStatuses, searchKeyword]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  // Reset to page 1 when user searches or changes status filters
  const handleFilterChange = useCallback((statuses: readonly string[], keyword: string) => {
    setActiveStatuses(statuses);
    setSearchKeyword(keyword);
    setPage(1);
  }, []);

  const totalPages = Math.ceil(totalRecords / size);

  // Calculate which page numbers to display in the pagination bar
  const getVisiblePages = () => {
    let start = Math.max(1, page - 1);
    const end = Math.min(totalPages, start + 2);

    if (end - start < 2) {
      start = Math.max(1, end - 2);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Show skeleton loading state while fetching data
  if (loading) {
    return (
      <div className="space-y-8">
        <BookingFilters onFilterChange={handleFilterChange} />
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-slate-100 animate-pulse">
              <div className="flex gap-6">
                <div className="w-52 h-40 bg-slate-200 rounded-2xl"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-slate-200 rounded-xl"></div>
                    <div className="h-16 bg-slate-200 rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BookingFilters onFilterChange={handleFilterChange} />

      {/* Show empty state if no data matches the filters */}
      {bookings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur-sm py-24 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50"></div>
          <div className="relative z-10">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 mb-6">
              <Calendar className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No bookings found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Try adjusting your filters or search terms to find what you&apos;re looking for
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Display the list of bookings with animations */}
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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

          {/* Pagination Controls */}
          {totalRecords > size && (
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-slate-100">
              <div className="text-sm text-slate-500">
                Showing <span className="font-bold text-indigo-600">{(page - 1) * size + 1}</span> to{" "}
                <span className="font-bold text-indigo-600">{Math.min(page * size, totalRecords)}</span> of{" "}
                <span className="font-bold text-indigo-600">{totalRecords}</span> bookings
              </div>

              <div className="flex items-center gap-3">
                {/* Previous Button */}
                <button
                  onClick={() => {
                    setPage(p => Math.max(1, p - 1));
                  }}
                  disabled={page === 1}
                  className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                >
                  <span className="text-lg transform group-hover:-translate-x-0.5 transition-transform">←</span>
                  Prev
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 px-4">
                  {getVisiblePages().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setPage(pageNum);
                      }}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                        page === pageNum
                          ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => {
                    setPage(p => p + 1);
                  }}
                  disabled={page >= totalPages}
                  className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                >
                  Next
                  <span className="text-lg transform group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}