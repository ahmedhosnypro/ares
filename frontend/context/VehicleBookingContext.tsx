'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface BookingContextType {
  pickupDate: string | null;
  returnDate: string | null;
  totalPrice: number | null;
  setDates: (pickup: string, returnDt: string) => void;
  setPrice: (price: number) => void;
}

const VehicleBookingContext = createContext<BookingContextType | undefined>(undefined);

// استخدمنا Readonly هنا عشان نرضي SonarJS
export function VehicleBookingProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [pickupDate, setPickupDate] = useState<string | null>(null);
  const [returnDate, setReturnDate] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState<number | null>(null);

  const setDates = (pickup: string, returnDt: string) => {
    setPickupDate(pickup);
    setReturnDate(returnDt);
  };

  return (
    <VehicleBookingContext.Provider value={{ pickupDate, returnDate, totalPrice, setDates, setPrice: setTotalPrice }}>
      {children}
    </VehicleBookingContext.Provider>
  );
}

export const useBooking = () => {
  const context = useContext(VehicleBookingContext);
  if (!context) throw new Error('useBooking must be used within VehicleBookingProvider');
  return context;
};