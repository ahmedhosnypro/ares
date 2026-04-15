"use client";
import { useState } from "react";

export default function BookingPage() {
  const [days, setDays] = useState(1);
  const pricePerDay = 50;
  const total = days * pricePerDay;

  return (
 
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4 md:p-8 transition-colors duration-500">
      
 
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] w-full max-w-5xl overflow-hidden grid lg:grid-cols-5 gap-0">
        
    
        <div className="lg:col-span-3 p-8 md:p-12">
          <div className="mb-8">
 
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Checkout</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Complete your booking details below.</p>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 ml-1">Full Name</label>
              
                  <input type="text" placeholder="John Doe" className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 ml-1">Email Address</label>
                  <input type="email" placeholder="john@example.com" className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 ml-1">Phone Number</label>
                  <input type="tel" placeholder="012 3456 7890" className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 ml-1">ID / Passport</label>
                  <input type="text" placeholder="30325441.." className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
                </div>
              </div>
            </section>

            <section className="pt-4">
              <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">Rental Duration</h3>
          
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50/80 dark:bg-blue-900/10 p-4 rounded-3xl">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pickup Date</label>
                  <input type="date" className="w-full bg-white dark:bg-slate-800 dark:text-white border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Return Date</label>
                  <input type="date" className="w-full bg-white dark:bg-slate-800 dark:text-white border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Days</label>
                  <input 
                    type="number" 
                    value={days} 
                    min="1" 
                    onChange={(e) => setDays(Number(e.target.value))} 
                    className="w-full bg-white dark:bg-slate-800 dark:text-white border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-8">Reservation Summary</h2>
            
            <div className="group overflow-hidden rounded-3xl mb-6">
              <img
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70"
                className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-500"
                alt="Car"
              />
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold">Toyota Corolla</h3>
              <div className="flex gap-2 mt-2">
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium">Sedan</span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium">Automatic</span>
              </div>
            </div>

            <div className="space-y-4 border-t border-white/10 pt-6">
              <div className="flex justify-between text-slate-400">
                <span>Daily Rate</span>
                <span className="text-white font-semibold">${pricePerDay}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Rental Period</span>
                <span className="text-white font-semibold">{days} days</span>
              </div>
              <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/10">
                <span className="text-lg font-medium text-slate-300">Total Price</span>
                <span className="text-3xl font-bold text-blue-400">${total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button className="relative z-10 mt-12 w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-900/20 transition-all duration-200">
            Confirm & Pay
          </button>
        </div>
      </div>
    </div>
  );
}