"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react"; // 🚀 السطر السحري بتاع NextAuth
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, CarFront } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  // States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stayConnected, setStayConnected] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 🚀 استخدام NextAuth بدل الـ fetch اليدوي والـ localStorage
      const res = await signIn("credentials", {
        redirect: false, // بنعملها false عشان نعرض الإيرور في نفس الصفحة من غير ريفريش
        email,
        password,
        stayConnected: stayConnected.toString(), // NextAuth بيفضل يبعت الداتا كـ String
      });

      if (res?.error) {
        // NextAuth هيرجعلك الإيرور اللي إحنا برمجناه في ملف الـ route بناءً على رد الباك إند
        setErrorMessage(res.error);
      } else if (res?.ok) {
        // الدخول نجح، بنوجه اليوزر للبروفايل
        router.push("/account/profile");
        router.refresh(); // ريفريش عشان הـ layout يحس بالـ Session الجديدة وتظهر بياناته
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-white transition-colors duration-300 dark:bg-slate-950">
      
      {/* الجانب الأيسر: فورم تسجيل الدخول */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          
          {/* اللوجو / الهيدر */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 dark:shadow-indigo-900/50">
                <CarFront className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">ARES</h1>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Please enter your details to sign in to your account.
            </p>
          </div>

          {/* رسالة الخطأ */}
          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm font-medium leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* الفورم */}
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* حقل الإيميل */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* حقل الباسورد */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* الإعدادات الإضافية (تذكرني + نسيت كلمة المرور) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="stayConnected"
                  name="stayConnected"
                  type="checkbox"
                  checked={stayConnected}
                  onChange={(e) => setStayConnected(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-slate-600 dark:bg-slate-800 dark:ring-offset-slate-950"
                />
                <label htmlFor="stayConnected" className="ml-2 block text-sm text-slate-600 dark:text-slate-400">
                  Stay connected
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-bold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* زرار الدخول */}
            <div>
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="group relative flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:shadow-indigo-900/50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Sign in to account"
                )}
              </button>
            </div>
          </form>

          {/* رابط إنشاء حساب */}
          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-bold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              Create a free account
            </Link>
          </p>
        </div>
      </div>

      {/* الجانب الأيمن: صورة ديكور (بتختفي في الشاشات الصغيرة) */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-slate-900 dark:bg-slate-900/50">
          <img
            className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-overlay"
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Luxury Car Rental"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <h3 className="mb-2 text-3xl font-black tracking-tight">Premium Vehicle Rentals</h3>
            <p className="max-w-lg text-lg text-slate-300">
              Experience the ultimate driving journey with our collection of top-tier vehicles, tailored just for you.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}