import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const resolvedParams = await params;
  
  const vehicleData = {
    resultData: {
      _id: resolvedParams.vehicleId,
      name: "Mercedes-Benz S-Class 2024",
      description: "Experience ultimate luxury with the new S-Class. Perfect for business trips and special occasions.",
      price: 250, // سعر اليوم الواحد
      images: [
        "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
        "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80"
      ],
      image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
      supplier: {
        _id: "sup-2",
        fullName: "Luxury Drive Egypt"
      },
      features: ["Auto Transmission", "4 Seats", "Leather Interior", "GPS Navigation"],
      
      // ✨ التعديل السحري: ضفنا المواصفات عشان تظهر في شبكة الـ VehicleInfo
      specs: [
        { label: "Engine", value: "3.0L V6 Turbo" },
        { label: "Horsepower", value: "429 hp" },
        { label: "Transmission", value: "9-Speed Automatic" },
        { label: "0-100 km/h", value: "4.8 sec" },
        { label: "Fuel Type", value: "Gasoline" },
        { label: "Drivetrain", value: "AWD" }
      ],

      // ✨ وضفنا تقييمات كمان عشان كومبوننت الـ ReviewSection ميطلعش فاضي
      reviews: [
        { 
          _id: "r-1", 
          userName: "Ahmed Mahmoud", 
          rating: 5, 
          comment: "Best car I've ever rented. The supplier was very professional.",
          date: "2026-03-20"
        },
        { 
          _id: "r-2", 
          userName: "Sara Kamal", 
          rating: 4, 
          comment: "Very smooth ride and extremely comfortable seats.",
          date: "2026-03-15"
        }
      ],

      status: "Available"
    }
  };

  // تأخير بسيط لمحاكاة سرعة الإنترنت الحقيقية
  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json(vehicleData);
}