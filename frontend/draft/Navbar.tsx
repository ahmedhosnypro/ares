"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Vehicles", href: "/vehicles" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav className="bg-slate-50 rounded-b-4xl dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm fixed top-0 left-0 right-0 z-50 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-20 items-center">

          {/* Logo */}
          <div className="text-2xl font-extrabold tracking-tight">
            <Link href="/" className="flex items-center gap-2 group">
              <Car className="w-6 h-6 text-blue-600 dark:text-blue-500" strokeWidth={2.5} />
              <span className="text-blue-600 dark:text-blue-500">Car</span>
              <span className="text-slate-800 dark:text-slate-200">Rental</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex space-x-10 font-semibold">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative transition-all duration-300 after:content-[''] after:absolute after:h-0.5 after:bg-blue-600 dark:after:bg-blue-500 after:left-0 after:-bottom-1 after:transition-all ${isActive
                      ? "text-blue-600 dark:text-blue-400 after:w-full"
                      : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 after:w-0 hover:after:w-full"
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4">

            {/* Theme Button */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="cursor-pointer p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {mounted ? (
                theme === "light"
                  ? <Moon size={22} className="text-gray-700" />
                  : <Sun size={22} />
              ) : (
                <div className="w-[22px] h-[22px]" />
              )}
            </button>

            <Link href="/login">
              <button className="cursor-pointer px-5 py-2.5 text-slate-700 dark:text-slate-300 font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 rounded-xl hover:shadow-sm">
                Sign in
              </button>
            </Link>

            <Link href="/register">
              <button className="cursor-pointer relative inline-flex items-center justify-center px-7 py-2.5 overflow-hidden font-bold text-white transition-all duration-300 bg-blue-600 dark:bg-blue-500 rounded-xl group hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-none hover:-translate-y-0.5 active:translate-y-0">
                <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                <span className="relative">Sign up</span>
              </button>
            </Link>

          </div>

          {/* Mobile Buttons */}
          <div className="lg:hidden flex items-center gap-2">

            {/* Theme Button */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2"
            >
              {mounted ? (
                theme === "light"
                  ? <Moon size={22} className="text-gray-700" />
                  : <Sun size={22} />
              ) : (
                <div className="w-[22px] h-[22px]" />
              )}
            </button>

            {/* Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="cursor-pointer p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-125 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white dark:bg-slate-900 px-6 py-6 space-y-4 border-t border-slate-200 dark:border-slate-800 shadow-inner">

          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block text-lg font-semibold transition-colors ${isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-700 dark:text-slate-300 hover:text-blue-600"
                  }`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            );
          })}

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link href="/login">
              <button onClick={() => setIsOpen(false)} className="p-3 rounded-xl font-bold text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                Sign in
              </button>
            </Link>

            <Link href="/register">
              <button onClick={() => setIsOpen(false)} className="p-3 rounded-xl font-bold text-white bg-blue-600 dark:bg-blue-500 shadow-lg shadow-blue-100 dark:shadow-none hover:brightness-110 transition-all">
                Sign up
              </button>
            </Link>
          </div>

        </div>
      </div>

    </nav>
  );
}