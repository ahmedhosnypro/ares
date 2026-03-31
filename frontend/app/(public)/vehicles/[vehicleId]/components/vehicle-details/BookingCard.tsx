'use client';

import { useState, useEffect } from 'react';
import { useBooking } from '@/context/VehicleBookingContext';
import { formatCurrency } from '@/src/utils/currency-helpers';
import { cn } from '@/src/utils/cn';

interface BookingCardProps {
  readonly vehicleId: string;
  readonly basePrice: number;
}
interface PricingData {
  totalAmount: number;
}

export default function BookingCard({ vehicleId, basePrice }: BookingCardProps) {
  const { pickupDate, returnDate, totalPrice, setDates, setPrice } = useBooking();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (pickupDate && returnDate) {
      const getPricing = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/vehicles/${vehicleId}/pricing?pickupDate=${pickupDate}&returnDate=${returnDate}`
          );
          if(response.ok) {
            const data = (await response.json()) as PricingData;
            setPrice(data.totalAmount); 
          }
        } catch (error) {
          console.error("Failed to fetch pricing:", error);
        } finally {
          setIsLoading(false);
        }
      };
      void getPricing();    
    }
  }, [pickupDate, returnDate, vehicleId, setPrice]);

  return (
    <div className="p-6 sm:p-8">
      {/* السعر الأساسي */}
      <div className="mb-8 flex items-baseline justify-between">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900 transition-colors duration-300 dark:text-white">
          {formatCurrency(basePrice)}
        </span>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/ day</span>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Pickup Date
          </label>
          <input
            type="date"
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-700 outline-none transition-all duration-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-800"
            onChange={(e) => { setDates(e.target.value, returnDate || ''); }}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Return Date
          </label>
          <input
            type="date"
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-700 outline-none transition-all duration-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-800"
            onChange={(e) => { setDates(pickupDate || '', e.target.value); }}
          />
        </div>

        {/* Pricing Summary */}
        {totalPrice > 0 && (
          <div className="mt-6 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-5 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex justify-between text-sm font-medium text-slate-500 dark:text-slate-400">
              <span>Total days</span>
              <span className="text-slate-700 dark:text-slate-300">{pickupDate && returnDate ? 'Calculated' : '0'}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-200/60 pt-2 text-lg font-bold text-slate-900 transition-colors duration-300 dark:border-slate-700 dark:text-white">
              <span>Total Price</span>
              <span className={cn("transition-opacity duration-200", isLoading ? "opacity-50" : "opacity-100")}>
                {isLoading ? "Updating..." : formatCurrency(totalPrice)}
              </span>
            </div>
          </div>
        )}

        <button
          disabled={!pickupDate || !returnDate || isLoading}
          className={cn(
            "mt-6 w-full rounded-xl py-4 text-base font-bold transition-all duration-300",
            (!pickupDate || !returnDate) 
              ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500" 
              : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-600/40 active:translate-y-0 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400"
          )}
        >
          {isLoading ? "Calculating..." : "Reserve Now"}
        </button>
      </div>

      <p className="mt-5 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
        You won&apos;t be charged yet
      </p>
    </div>
  );
}