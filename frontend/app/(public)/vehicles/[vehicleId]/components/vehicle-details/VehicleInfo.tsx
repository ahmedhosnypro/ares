"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { toApiUrl } from "@/src/utils/api-client";

interface Spec {
  label: string;
  value: string;
  icon?: string;
}

interface VehicleInfoData {
  readonly name?: string;
  readonly description?: string;
  readonly specs?: readonly Spec[];
}

interface VehicleInfoProps {
  readonly vehicle?: VehicleInfoData;
  readonly vehicleId: string;
}

export default function VehicleInfo({ vehicle, vehicleId }: VehicleInfoProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);
  const { data: session } = useSession();

  const name = vehicle?.name || "Unknown Vehicle";
  const description = vehicle?.description || "No description available.";
  const specs: readonly Spec[] = vehicle?.specs ?? [];

  const handleFavorite = async () => {
    if (!session?.accessToken) {
      alert("Please sign in to add favorites.");
      return;
    }

    setIsFavLoading(true);
    try {
      const response = await fetch(toApiUrl(`/api/vehicles/${vehicleId}/favorites`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      if (response.ok) {
        setIsFavorite(!isFavorite);
      }
    } catch {
      alert("Failed to update favorites.");
    } finally {
      setIsFavLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Title & Live Badge */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 transition-colors duration-300 dark:text-white sm:text-4xl">
          {name}
        </h1>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/10 dark:ring-emerald-500/30">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Available Now
            </span>
          </div>

          <button
            onClick={() => {
              void handleFavorite();
            }}
            disabled={isFavLoading}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all duration-300 hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-red-900/50 dark:hover:bg-red-500/10"
          >
            <Heart className={`h-5 w-5 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 transition-colors duration-300 dark:text-white">
          About this vehicle
        </h3>
        <p className="text-base leading-relaxed text-slate-600 transition-colors duration-300 dark:text-slate-400 sm:text-lg">
          {description}
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 transition-colors duration-300 dark:text-white">
          Key Specifications
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {specs.map((spec, index) => (
            <div
              key={index}
              className="group flex flex-col justify-center rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-slate-200 hover:bg-white hover:shadow-lg hover:shadow-slate-200/40 dark:border-slate-800/60 dark:bg-slate-800/30 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:shadow-black/20"
            >
              <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:text-xs">
                {spec.label}
              </span>
              <span className="text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-slate-200 dark:group-hover:text-indigo-400 sm:text-base">
                {spec.value}
              </span>
            </div>
          ))}
          {specs.length === 0 && (
            <div className="col-span-2 text-sm italic text-slate-500 dark:text-slate-400 sm:col-span-3">
              No specifications added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
