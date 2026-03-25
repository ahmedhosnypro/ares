"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface BookingFiltersProps {
  readonly onFilterChange: (statuses: readonly string[], keyword: string) => void;
}

const ALL_STATUSES = ["Pending", "Deposit", "Paid", "Reserved", "Cancelled"];

export default function BookingFilters({ onFilterChange }: Readonly<BookingFiltersProps>) {
  const [keyword, setKeyword] = useState<string>("");
  const [activeStatuses, setActiveStatuses] = useState<string[]>([...ALL_STATUSES]);

  // Toggle a single status on or off
  const toggleStatus = (status: string) => {
    setActiveStatuses((prev) => {
      if (prev.includes(status)) {
        // If it's the last one, don't allow unchecking (must have at least one filter)
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== status);
      }
      return [...prev, status];
    });
  };

  // Trigger the filter change to the parent component whenever state changes
  useEffect(() => {
    // We use a small delay (debounce) for the keyword to avoid spamming the API while typing
    const delayDebounceFn = setTimeout(() => {
      onFilterChange(activeStatuses, keyword);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [keyword, activeStatuses, onFilterChange]);

  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-white/70 p-6 backdrop-blur-sm border border-slate-100 shadow-sm md:flex-row md:items-center md:justify-between">
      
      {/* Search Input */}
      <div className="relative w-full md:max-w-xs">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder="Search cars or locations..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10"
        />
      </div>

      {/* Status Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 text-sm font-bold text-slate-500">Status:</span>
        {ALL_STATUSES.map((status) => {
          const isActive = activeStatuses.includes(status);
          return (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>

    </div>
  );
}