"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface BookingFiltersProps {
  readonly onFilterChange: (statuses: readonly string[], keyword: string) => void;
}

const ALL_STATUSES = ["Pending", "Deposit", "Paid", "Reserved", "Cancelled"];

export default function BookingFilters({ onFilterChange }: Readonly<BookingFiltersProps>) {
  const [keyword, setKeyword] = useState<string>("");
  
  // ✨ التعديل هنا: الـ State بقت بتحفظ حالة واحدة بس، والافتراضي بتاعها "All"
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // بنجهز الداتا للباك إند: لو دايس "All" نبعت المصفوفة كلها، لو دايس حاجة تانية نبعتها لوحدها
      const statusesToFetch = selectedStatus === "All" ? ALL_STATUSES : [selectedStatus];
      onFilterChange(statusesToFetch, keyword);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [keyword, selectedStatus, onFilterChange]);

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-slate-100 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70 md:flex-row md:items-center md:justify-between">
      
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
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500"
        />
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 text-sm font-bold text-slate-500 dark:text-slate-400">Status:</span>
        
        {/* زرار "All" */}
        <button
          onClick={() => setSelectedStatus("All")}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
            selectedStatus === "All"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:bg-indigo-500 dark:shadow-indigo-900/50"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          }`}
        >
          All
        </button>

        {/* باقي الزراير بتترسم لوب */}
        {ALL_STATUSES.map((status) => {
          // الزرار بينور بس لو اسمه هو نفس الـ State الحالية
          const isActive = selectedStatus === status;
          
          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:bg-indigo-500 dark:shadow-indigo-900/50"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
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