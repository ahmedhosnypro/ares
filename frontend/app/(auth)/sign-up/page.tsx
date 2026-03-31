"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, CarFront, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  // States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false); 

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // تأكيد أولي إن اليوزر وافق على الشروط
    if (!acceptedTerms || !acceptedPrivacy) {
      setErrorMessage("You must accept both the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      // 🚀 هنا بنستخدم fetch العادية عشان نكلم الباك إند يكريت الحساب
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          acceptedTerms,
          acceptedPrivacy,
        }),
      });

      // معالجة الأخطاء بناءً على الـ API Contract
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("Invalid details. Please ensure your email is correct and your password is strong.");
        } else if (response.status === 409) {
          throw new Error("This email is already registered. Try signing in instead.");
        } else if (response.status === 429) {
          throw new Error("Too many registration attempts. Please try again later.");
        } else {
          throw new Error("An unexpected error occurred. Please try again.");
        }
      }

      // النجاح (201 Created)
      setIsSuccess(true); 

    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-white transition-colors duration-300 dark:bg-slate-950">
      
      {/* الجانب الأيسر: فورم التسجيل */}
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
            {!isSuccess && (
              <>
                <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
                  Create an account
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Join us and start your premium rental experience today.
                </p>
              </>
            )}
          </div>

          {/* شاشة النجاح (بتظهر لما الـ API يرجع 201) */}
          {isSuccess ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-8 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Account Created!</h3>
              <p className="mb-8 text-sm text-slate-600 dark:text-slate-400">
                Welcome to ARES, {firstName}. Your account has been successfully created. We've sent a verification link to <span className="font-bold text-slate-900 dark:text-white">{email}</span>.
              </p>
              <Link 
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.98] dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:shadow-indigo-900/50"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              {/* رسالة الخطأ */}
              {errorMessage && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium leading-relaxed">{errorMessage}</p>
                </div>
              )}

              {/* الفورم */}
              <form onSubmit={handleRegister} className="space-y-5">
                
                {/* الاسم الأول والأخير (جنب بعض) */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                      First Name
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        id="firstName"
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
                        placeholder="John"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                      Last Name
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        id="lastName"
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>

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
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
                      placeholder="Create a strong password"
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

                {/* Checkboxes: Terms & Privacy */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id="terms"
                        type="checkbox"
                        required
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-slate-600 dark:bg-slate-800 dark:ring-offset-slate-950"
                      />
                    </div>
                    <label htmlFor="terms" className="ml-3 text-sm text-slate-600 dark:text-slate-400">
                      I accept the{" "}
                      <Link href="/terms" className="font-bold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400">
                        Terms of Service
                      </Link>
                    </label>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id="privacy"
                        type="checkbox"
                        required
                        checked={acceptedPrivacy}
                        onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-slate-600 dark:bg-slate-800 dark:ring-offset-slate-950"
                      />
                    </div>
                    <label htmlFor="privacy" className="ml-3 text-sm text-slate-600 dark:text-slate-400">
                      I accept the{" "}
                      <Link href="/privacy" className="font-bold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>

                {/* زرار التسجيل */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !email || !password || !firstName || !lastName || !acceptedTerms || !acceptedPrivacy}
                    className="group relative flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:shadow-indigo-900/50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </form>

              {/* رابط تسجيل الدخول */}
              <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* الجانب الأيمن: صورة ديكور (بتختفي في الشاشات الصغيرة) */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-slate-900 dark:bg-slate-900/50">
          <img
            className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-overlay"
            src="https://images.unsplash.com/photo-1503376760366-5a4d1e1f1807?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Luxury Car Fleet"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <h3 className="mb-2 text-3xl font-black tracking-tight">Your Journey Begins Here</h3>
            <p className="max-w-lg text-lg text-slate-300">
              Join thousands of satisfied customers and gain access to the most exclusive vehicle fleet in the region.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}