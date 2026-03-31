import React from "react";
import Gallery from "@/app/(public)/vehicles/[vehicleId]/components/vehicle-details/Gallery";
import VehicleInfo from "@/app/(public)/vehicles/[vehicleId]/components/vehicle-details/VehicleInfo";
import ReviewSection from "@/app/(public)/vehicles/[vehicleId]/components/vehicle-details/ReviewSection";
import BookingCard from "@/app/(public)/vehicles/[vehicleId]/components/vehicle-details/BookingCard";
import { VehicleBookingProvider } from "@/context/VehicleBookingContext";

interface PageProps {
  params: Promise<{ vehicleId: string }>;
}

export default async function VehicleDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const vehicleId = resolvedParams.vehicleId;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  // 🚀 Pro Tip: نجيب كل الداتا مع بعض في نفس الوقت (Concurrent Fetching) عشان الأداء
  let vehicle = null;
  let reviews = [];
  let images = [];

  try {
    const [vehicleRes, reviewsRes, imagesRes] = await Promise.all([
      fetch(`${baseUrl}/api/vehicles/${vehicleId}`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/vehicles/${vehicleId}/reviews`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/vehicles/${vehicleId}/images`, { cache: "no-store" })
    ]);

    if (vehicleRes.ok) {
      const vData = await vehicleRes.json();
      vehicle = vData?.resultData || vData; 
    }
    if (reviewsRes.ok) {
      const rData = await reviewsRes.json();
      reviews = rData?.reviews || rData || [];
    }
    if (imagesRes.ok) {
      const iData = await imagesRes.json();
      images = iData?.images || iData || [];
    }
  } catch (error) {
    console.error("Error fetching vehicle details:", error);
  }

  if (!vehicle) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <h1 className="text-2xl font-bold text-slate-500 dark:text-slate-400">Vehicle not found</h1>
      </div>
    );
  }

  // تجميع الصور (لو الـ API بتاع الصور مرجعش حاجة، ناخد الصورة الأساسية)
  const finalImages = images.length > 0 ? images : (vehicle.images || [vehicle.image]);

  return (
    <main className="min-h-screen bg-slate-50 py-8 transition-colors duration-300 dark:bg-slate-950 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          
          {/* العمود الشمال (الصور + التفاصيل + التقييمات) */}
          <div className="w-full space-y-8 lg:w-2/3">
            {/* Gallery Card */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
              <Gallery images={finalImages} />
            </div>
            
            {/* Info Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <VehicleInfo vehicle={vehicle} vehicleId={vehicleId} />
            </div>
            
            {/* Reviews Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <ReviewSection reviews={reviews} />
            </div>
          </div>

          {/* العمود اليمين (كارت الحجز) */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <VehicleBookingProvider>
                <BookingCard vehicleId={vehicleId} basePrice={vehicle.price || 0} />
              </VehicleBookingProvider>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}