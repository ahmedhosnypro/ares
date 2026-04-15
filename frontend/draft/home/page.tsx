"use client"
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [activeCat, setActiveCat] = useState("Luxury");
  const categories = ['Economy', 'Luxury', 'SUVs', 'Electric'];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">

      {/* Hero Section */}
      <section className="relative pt-10 pb-20 px-6 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[140%] h-150 bg-linear-to-b from-blue-100/60 dark:from-blue-900/20 via-white dark:via-transparent to-transparent -z-10 rounded-[100%] blur-[80px]"></div>

        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest text-blue-700 dark:text-blue-400 uppercase bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800">
            <i className="fa-solid fa-star mr-2"></i>Premium Car Rental Service
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight">
            Rent the Perfect <span className="text-blue-600 dark:text-blue-500">Car</span> <br />
            For Your Next Journey
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            Experience the freedom of the open road with our premium fleet.
            Affordable rates, 24/7 support, and instant booking.
          </p>

          {/* Search Bar Container */}
          <div className="relative max-w-5xl mx-auto z-20">
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                   className={`px-6 cursor-pointer py-2 rounded-full text-sm font-semibold transition-all duration-300 
                    ${activeCat === cat
                      ? "bg-blue-600 text-white shadow-xl scale-105"
                      : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:border-blue-300 shadow-sm"
                    }`}
                >
                  {cat === "Electric" && <i className="fa-solid fa-bolt mr-2"></i>}
                  {cat}
                </button>
              ))}
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl md:rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full flex items-center px-4 border-b md:border-b-0 md:border-r border-slate-300 dark:border-slate-800">
                <i className="fa-solid fa-location-dot text-blue-600 mr-3"></i>
                <select className="w-full bg-transparent py-4 focus:outline-none text-gray-700 dark:text-gray-200 font-medium appearance-none">
                  <option className="dark:bg-slate-900">Select Location</option>
                  <option className="dark:bg-slate-900">Dubai Marina</option>
                  <option className="dark:bg-slate-900">Cairo Airport</option>
                </select>
              </div>
              <div className="flex-1 w-full flex items-center px-4 border-b md:border-b-0 md:border-r border-slate-300 dark:border-slate-800">
                <i className="fa-solid fa-calendar-days text-blue-600 mr-3"></i>
                <input type="text" placeholder="Pick-up Date" className="w-full bg-transparent py-4 focus:outline-none text-gray-700 dark:text-gray-200 font-medium" onFocus={(e) => e.target.type = 'date'} />
              </div>
              <button className=" cursor-pointer  w-auto bg-blue-600 text-white px-12 py-4 rounded-2xl md:rounded-full font-bold hover:bg-blue-700  transform hover:scale-105 transition-all duration-500 active:scale-95 shadow-lg shadow-blue-200 dark:shadow-none">
                <i className="fa-solid fa-magnifying-glass mr-2"></i>Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="h-72 rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-500 hover:-rotate-2 group">
            <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800" alt="Porsche" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
          </div>
          <div className="h-80 rounded-[2rem] overflow-hidden shadow-2xl z-10 md:-mt-8 transition-all transform hover:scale-105 duration-500 group">
            <img src="https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800" alt="BMW" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
          </div>
          <div className="h-72 rounded-[2rem] overflow-hidden shadow-2xl transition-transform duration-500 hover:rotate-2 group">
            <img src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800" alt="Audi" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
          </div>
        </div>

      </section>

      {/* About Us Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-20 items-center">
        {/* Left: Image Grid */}
        <div className="grid grid-cols-2 gap-6 relative">
          <div className="space-y-6">
            <img src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=500" className="rounded-3xl h-56 w-full object-cover shadow-xl border dark:border-slate-800" alt="Office" />
            <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=500" className="rounded-3xl h-72 w-full object-cover shadow-xl border dark:border-slate-800" alt="Road Trip" />
          </div>
          <div className="pt-16 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-center border border-gray-50 dark:border-slate-800 transform hover:scale-105 transition">
              <div className="text-4xl mb-2"><i className="fa-solid fa-trophy text-yellow-500"></i></div>
              <p className="text-center font-bold text-sm text-gray-800 dark:text-gray-200">Best Rental Service 2024</p>
            </div>
            <img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=500" className="rounded-3xl h-64 w-full object-cover shadow-xl border dark:border-slate-800" alt="Luxury Interior" />
            <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-200 dark:shadow-none">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black">20</span>
                <span className="text-lg font-bold">Yrs</span>
              </div>
              <p className="text-xs uppercase tracking-wider font-semibold opacity-80">Of Excellence</p>
            </div>
          </div>
        </div>

        {/* Right: Content */}
        <div className="space-y-10">
          <div>
            <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-500 font-bold text-sm tracking-widest uppercase mb-4">
              <span className="w-8 h-0.5 bg-blue-600 dark:bg-blue-500"></span>
              About AutoHaven
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-slate-900 dark:text-white">
              Driving Your Journey with <br className="hidden md:block" />
              <span className="text-blue-600 dark:text-blue-500">Reliability</span> and Care
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-6 leading-relaxed">
              At Advanced Rental System, we don't just rent cars; we provide the keys to your next great adventure.
              Our mission is to make luxury and reliability accessible to everyone.
            </p>
          </div>

          <div className="grid gap-8">
            <div className="flex gap-5 group">
              <div className="shrink-0 w-14 h-14 bg-white dark:bg-slate-800 shadow-md rounded-2xl flex items-center justify-center text-2xl transition-colors duration-300 dark:text-blue-500">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <h4 className="font-bold text-xl mb-1 dark:text-white">Elite Fleet Standards</h4>
                <p className="text-gray-500 dark:text-gray-400">Every car undergoes a 50-point safety inspection before every rental.</p>
              </div>
            </div>

            <div className="flex gap-5 group">
              <div className="shrink-0 w-14 h-14 bg-white dark:bg-slate-800 shadow-md rounded-2xl flex items-center justify-center text-2xl transition-colors duration-300 dark:text-blue-500">
                <i className="fa-solid fa-headset"></i>
              </div>
              <div>
                <h4 className="font-bold text-xl mb-1 dark:text-white">VIP 24/7 Assistance</h4>
                <p className="text-gray-500 dark:text-gray-400">Roadside help or booking changes, we're one call away, anytime.</p>
              </div>
            </div>
          </div>

          <button className="group relative bg-slate-900 dark:bg-blue-600 text-white px-10 py-4 rounded-full font-bold overflow-hidden transition-all duration-300 hover:pr-14">
            <span className="relative z-10">Explore Full Fleet</span>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 text-xl">
              <i className="fa-solid fa-arrow-right"></i>
            </span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-slate-300 pt-20 pb-10 border-t border-slate-800 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-8">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                </div>
                <span className="font-bold text-2xl text-white tracking-tight">Advanced Rental</span>
              </div>
              <p className="text-sm leading-relaxed opacity-60 max-w-xs">
                Premium car rental services for people who value time, luxury, and reliability.
              </p>
              <div className="flex gap-4">
                {['instagram', 'x-twitter', 'linkedin-in'].map((icon) => (
                  <a key={icon} href="#" className="w-10 h-10 rounded-xl bg-slate-800/40 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 border border-slate-700/50">
                    <i className={`fa-brands fa-${icon}`}></i>
                  </a>
                ))}
              </div>
            </div>


            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Explore</h4>
                <ul className="space-y-4 text-sm">
                  <li><a href="/cars" className="hover:text-blue-500 transition-colors">Our Fleet</a></li>
                  <li><a href="/about" className="hover:text-blue-500 transition-colors">About Us</a></li>
                  <li><a href="/contact" className="hover:text-blue-500 transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Support</h4>
                <ul className="space-y-4 text-sm">
                  <li><a href="#" className="hover:text-blue-500 transition-colors">FAQ</a></li>
                  <li><a href="#" className="hover:text-blue-500 transition-colors">Booking Guide</a></li>
                </ul>
              </div>
            </div>
            <div className="bg-slate-800/30 p-8 rounded-3xl border border-slate-700/50">
              <h4 className="text-white font-bold mb-2 text-lg">Join our newsletter</h4>
              <p className="text-xs mb-6 opacity-50">Get exclusive offers and travel inspiration.</p>
              <div className="relative group">
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-5 text-sm focus:outline-none focus:border-blue-600 transition-all"
                />
                <button className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-medium opacity-40 tracking-[0.2em]">
              © 2026 Advanced Rental System. ALL RIGHTS RESERVED.
            </p>

            <div className="flex items-center gap-6 opacity-30 grayscale shrink-0">
              <i className="fa-brands fa-cc-visa text-xl"></i>
              <i className="fa-brands fa-cc-mastercard text-xl"></i>
              <i className="fa-brands fa-cc-apple-pay text-xl"></i>
            </div>

            <div className="flex gap-6 text-[10px] font-bold uppercase tracking-wider opacity-60">
              <span>Privacy</span>
              <span>Terms</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}