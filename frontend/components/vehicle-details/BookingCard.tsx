'use client';

import  { useState, useEffect } from 'react';
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

  // Effect to fetch real-time pricing from API when dates change
  useEffect(() => {
    if (pickupDate && returnDate) {
      const getPricing = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/vehicles/${vehicleId}/pricing?pickupDate=${pickupDate}&returnDate=${returnDate}`
          );
          
          const data = (await response.json()) as PricingData;
          setPrice(data.totalAmount); 
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to fetch pricing:", error);
        } finally {
          setIsLoading(false);
        }
      };
      void getPricing();    
    }
  }, [pickupDate, returnDate, vehicleId, setPrice]);

  return (
    // شيلنا الـ border والـ shadow عشان الأب في صفحة page.tsx بيعملهم
    // كبرنا الـ padding عشان الكارت يتنفس
    <div className="bg-white p-6 sm:p-8">
      
      {/* السعر الأساسي */}
      <div className="flex items-baseline justify-between mb-8">
        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {formatCurrency(basePrice)}
        </span>
        <span className="text-sm font-medium text-slate-500">/ day</span>
      </div>

      <div className="space-y-5">
        {/* Pickup Date Input */}
        <div>
          <label className="block text-xs font-bold tracking-wide uppercase text-slate-500 mb-2">
            Pickup Date
          </label>
          <input
            type="date"
            className="w-full cursor-pointer rounded-xl border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-700 transition-colors focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            onChange={(e) => { setDates(e.target.value, returnDate || ''); }}
          />
        </div>

        {/* Return Date Input */}
        <div>
          <label className="block text-xs font-bold tracking-wide uppercase text-slate-500 mb-2">
            Return Date
          </label>
          <input
            type="date"
            className="w-full cursor-pointer rounded-xl border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-700 transition-colors focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            onChange={(e) => { setDates(pickupDate || '', e.target.value); }}
          />
        </div>

        {/* Pricing Summary (شكل الفاتورة المصغرة) */}
        {totalPrice && (
          <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-5 border border-slate-100">
            <div className="flex justify-between text-sm font-medium text-slate-500">
              <span>Total days</span>
              <span className="text-slate-700">{pickupDate && returnDate ? 'Calculated' : '0'}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200/60 mt-2">
              <span>Total Price</span>
              <span className={cn("transition-opacity duration-200", isLoading ? "opacity-50" : "opacity-100")}>
                {isLoading ? "Updating..." : formatCurrency(totalPrice)}
              </span>
            </div>
          </div>
        )}

        {/* زرار الحجز */}
        <button
          disabled={!pickupDate || !returnDate || isLoading}
          className={cn(
            "mt-6 w-full py-4 rounded-xl text-base font-bold transition-all duration-300",
            (!pickupDate || !returnDate) 
              ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
              : "bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          )}
        >
          {isLoading ? "Calculating..." : "Reserve Now"}
        </button>
      </div>

      <p className="mt-5 text-center text-xs font-medium text-slate-400">
        You won&apos;t be charged yet
      </p>
    </div>
  );
}