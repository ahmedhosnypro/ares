import React from "react";
import { Metadata } from "next";

// 1. تعريف الـ Props بتاعة الصفحة
interface PageProps {
  // في Next.js 15+ الـ params بقت Promise ولازم نعملها await
  params: Promise<{ id: string }>; 
}

// 2. دالة الـ Metadata اللي شرحناها (عشان الـ SEO واسم التاب في المتصفح)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    
    // بنجيب بيانات الحجز عشان نكتب اسم العربية في عنوان الصفحة
    const response = await fetch(`${baseUrl}/api/bookings/${resolvedParams.id}`);
    const data = await response.json();
    const booking = data.resultData;

    return {
      title: `Booking ${booking?.car?.name || 'Details'} | Rent Your Dream Car`,
      description: `View details for your rental booking of ${booking?.car?.name || 'this vehicle'}.`,
    };
  } catch (error) {
    // خطة بديلة لو السيرفر وقع
    return {
      title: "Booking Details | Rent Your Dream Car",
    };
  }
}

// 3. الكومبوننت الأساسي للصفحة (Server Component)
export default async function BookingDetailsPage({ params }: PageProps) {
  // بنفك الـ Promise عشان ناخد الـ ID بتاع الحجز
  const resolvedParams = await params;
  const bookingId = resolvedParams.id;

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Booking Overview</h1>
            <p className="text-slate-500 mt-2 font-mono text-sm">
              Ref ID: <span className="font-bold text-indigo-600">{bookingId}</span>
            </p>
          </div>
          
          {/* زرار الرجوع للوراء */}
          <a 
            href="/bookings" 
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 transition-all"
          >
            &larr; Back to Bookings
          </a>
        </div>

        {/* Main Content Container 
          (هنا هنحط الديزاين بتاع الفاتورة وتفاصيل الاستلام والتسليم)
        */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 overflow-hidden relative">
          {/* خلفية تجميلية خفيفة */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full -z-10 opacity-50"></div>
          
          <div className="text-center py-16">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4 animate-bounce">
              <span className="text-2xl">🚗</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">
              Page Structure Ready!
            </h2>
            <p className="text-slate-500 max-w-md mx-auto">
              We successfully connected the card button to this page and fetched the ID: 
              <strong className="text-indigo-600 block mt-2">{bookingId}</strong>
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}