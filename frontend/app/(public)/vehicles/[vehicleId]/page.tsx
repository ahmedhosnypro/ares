import Gallery from "@/app/(public)/vehicles/[vehicleId]/components/vehicle-details/Gallery";
import VehicleInfo from "@/app/(public)/vehicles/[vehicleId]/components/vehicle-details/VehicleInfo";
import ReviewSection from "@/app/(public)/vehicles/[vehicleId]/components/vehicle-details/ReviewSection";
import BookingCard from "@/app/(public)/vehicles/[vehicleId]/components/vehicle-details/BookingCard";
import { VehicleBookingProvider } from "@/context/VehicleBookingProvider";
import { toApiUrl } from "@/src/utils/api-client";
import { logger } from "@/src/utils/logger";

interface PageProps {
  params: Promise<{ vehicleId: string }>;
}

interface Spec {
  label: string;
  value: string;
}

interface VehicleDetail {
  name: string;
  description: string;
  price: number;
  image?: string;
  images?: string[];
  specs?: Spec[];
}

interface VehicleReview {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export default async function VehicleDetailsPage({ params }: Readonly<PageProps>) {
  const resolvedParams = await params;
  const vehicleId = resolvedParams.vehicleId;

  // 🚀 Pro Tip: نجيب كل الداتا مع بعض في نفس الوقت (Concurrent Fetching) عشان الأداء
  let vehicle: VehicleDetail | null = null;
  let reviews: VehicleReview[] = [];
  let images: string[] = [];

  try {
    const [vehicleRes, reviewsRes, imagesRes] = await Promise.all([
      fetch(toApiUrl(`/api/vehicles/${vehicleId}`), { cache: "no-store" }),
      fetch(toApiUrl(`/api/vehicles/${vehicleId}/reviews`), { cache: "no-store" }),
      fetch(toApiUrl(`/api/vehicles/${vehicleId}/images`), { cache: "no-store" }),
    ]);

    if (vehicleRes.ok) {
      const vData = (await vehicleRes.json()) as { resultData?: VehicleDetail; data?: VehicleDetail };
      vehicle = vData.resultData || vData.data || (vData as unknown as VehicleDetail);
    }
    if (reviewsRes.ok) {
      const rData = (await reviewsRes.json()) as { resultData?: unknown; data?: unknown; reviews?: unknown };
      const rawReviews = (rData.resultData || rData.data || rData.reviews || []) as Record<string, unknown>[];
      reviews = Array.isArray(rawReviews)
        ? rawReviews.map(review => ({
            _id: ([review["_id"], review["id"], review["Id"], ""] as unknown[]).find(
              v => typeof v === "string"
            ) as string,
            userName: ([review["userName"], review["user"], review["driverName"], "User"] as unknown[]).find(
              v => typeof v === "string"
            ) as string,
            rating: (() => {
              if (typeof review["rating"] === "number") return review["rating"];
              if (typeof review["stars"] === "number") return review["stars"];
              return 0;
            })(),
            comment: ([review["comment"], review["text"], ""] as unknown[]).find(v => typeof v === "string") as string,
            date: ([review["date"], review["createdAt"], ""] as unknown[]).find(v => typeof v === "string") as string,
          }))
        : [];
    }
    if (imagesRes.ok) {
      const iData = (await imagesRes.json()) as { images?: unknown[]; resultData?: unknown[]; data?: unknown[] };
      const rawImages = iData.images || iData.resultData || iData.data || (iData as unknown as unknown[]);
      images = Array.isArray(rawImages)
        ? rawImages
            .map(image => {
              if (typeof image === "string") return image;
              if (image && typeof image === "object") {
                const imgObj = image as Record<string, unknown>;
                const url = imgObj["url"] ?? imgObj["Url"];
                return typeof url === "string" ? url : "";
              }
              return "";
            })
            .filter(Boolean)
        : [];
    }
  } catch (error) {
    logger.error("Error fetching vehicle details", error);
  }

  if (!vehicle) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <h1 className="text-2xl font-bold text-slate-500 dark:text-slate-400">Vehicle not found</h1>
      </div>
    );
  }

  // تجميع الصور (لو الـ API بتاع الصور مرجعش حاجة، ناخد الصورة الأساسية)
  let finalImages: string[];
  if (images.length > 0) {
    finalImages = images;
  } else if (vehicle.images && vehicle.images.length > 0) {
    finalImages = vehicle.images;
  } else if (vehicle.image) {
    finalImages = [vehicle.image];
  } else {
    finalImages = [];
  }

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
