"use client";

import { useState, ReactNode } from "react";
import { VehicleBookingContext } from "./VehicleBookingContext";

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
