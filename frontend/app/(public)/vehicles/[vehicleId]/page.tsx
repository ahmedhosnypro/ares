import React from "react";
import Gallery from "@/components/vehicle-details/Gallery";
import VehicleInfo from "@/components/vehicle-details/VehicleInfo";
import ReviewSection from "@/components/vehicle-details/ReviewSection";
import BookingCard from "@/components/vehicle-details/BookingCard";
import { VehicleBookingProvider } from "@/context/VehicleBookingContext";

// ضفنا الـ Type ده عشان TypeScript ميزعلش من الـ params
interface PageProps {
  params: Promise<{ vehicleId: string }>;
}

export default async function VehicleDetailsPage({ params }: PageProps) {
  // فك الـ params عشان التحديث الجديد في Next.js 15
  const resolvedParams = await params;
  const vehicleId = resolvedParams.vehicleId;

  // جلب بيانات العربية من الـ API
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  let vehicle = null;

  try {
    const response = await fetch(`${baseUrl}/api/vehicles/${vehicleId}`, {
      cache: "no-store", // عشان نجيب أحدث داتا دايماً
    });
    
    if (response.ok) {
      const data = await response.json();
      vehicle = data?.resultData;
    }
  } catch (error) {
    console.error("Error fetching vehicle details:", error);
  }

  // لو الـ API مرجعش حاجة أو العربية مش موجودة
  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-600">Vehicle not found</h1>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* العمود اللي على الشمال: بياخد مساحة أكبر وفيه الصور والتفاصيل والريفيوهات */}
        <div className="w-full lg:w-2/3 space-y-8">
          <Gallery images={vehicle?.images || [vehicle?.image]} />
          
          <VehicleInfo vehicle={vehicle} />
          
          <hr className="border-gray-200" />
          
<ReviewSection vehicleId={vehicleId} reviews={vehicle?.reviews} />        </div>

        {/* العمود اللي على اليمين: كارت الحجز (BookingCard) */}
        <div className="w-full lg:w-1/3">
          {/* class sticky بتخلي الكارت ينزل معاك وإنت بتعمل سكرول */}
          <div className="sticky top-24">
            {/* التعديل السحري: غلفنا الكارت بالـ Provider */}
            <VehicleBookingProvider>
              <BookingCard vehicle={vehicle} />
            </VehicleBookingProvider>
          </div>
        </div>
        
      </div>
    </main>
  );
}