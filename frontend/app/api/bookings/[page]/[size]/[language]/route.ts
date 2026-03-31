import { NextRequest, NextResponse } from 'next/server';

interface BookingRequestBody {
  readonly statuses?: readonly string[];
  readonly filter?: {
    readonly keyword?: string | null;
    readonly from?: string | null;
    readonly to?: string | null;
    readonly pickupLocation?: string | null;
    readonly dropOffLocation?: string | null;
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as BookingRequestBody;
  
  const statuses = body.statuses ?? [];
  const keyword = body.filter?.keyword?.toLowerCase() ?? "";

  // الداتا الأساسية (Mock Data) بصور حقيقية عشان متضربش إيرور في الـ next/image
  const mockBookings = [
    {
      _id: "bk-001",
      car: {
        _id: "car-1",
        name: "Tesla Model 3",
        image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80"
      },
      supplier: { _id: "sup-1", fullName: "Elite Car Rentals" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-2", name: "Downtown Cairo" },
      from: "2026-04-10T10:00:00Z",
      to: "2026-04-15T10:00:00Z",
      price: 450,
      status: "Paid"
    },
    {
      _id: "bk-002",
      car: {
        _id: "car-2",
        name: "Mercedes-Benz C-Class",
        image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80"
      },
      supplier: { _id: "sup-2", fullName: "Luxury Drive" },
      pickupLocation: { _id: "loc-3", name: "Alexandria Port" },
      dropOffLocation: { _id: "loc-3", name: "Alexandria Port" },
      from: "2026-05-01T09:00:00Z",
      to: "2026-05-05T18:00:00Z",
      price: 1200,
      status: "Pending"
    },
    {
      _id: "bk-003",
      car: {
        _id: "car-3",
        name: "Hyundai Elantra",
        image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80"
      },
      supplier: { _id: "sup-3", fullName: "Safe Travel" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-1", name: "Cairo International Airport" },
      from: "2026-03-20T14:00:00Z",
      to: "2026-03-22T14:00:00Z",
      price: 180,
      status: "Cancelled"
    } ,{
      _id: "bk-0012",
      car: {
        _id: "car-1",
        name: "Tesla Model 3",
        image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80"
      },
      supplier: { _id: "sup-1", fullName: "Elite Car Rentals" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-2", name: "Downtown Cairo" },
      from: "2026-04-10T10:00:00Z",
      to: "2026-04-15T10:00:00Z",
      price: 450,
      status: "Paid"
    },
    {
      _id: "bk-0022",
      car: {
        _id: "car-2",
        name: "Mercedes-Benz C-Class",
        image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80"
      },
      supplier: { _id: "sup-2", fullName: "Luxury Drive" },
      pickupLocation: { _id: "loc-3", name: "Alexandria Port" },
      dropOffLocation: { _id: "loc-3", name: "Alexandria Port" },
      from: "2026-05-01T09:00:00Z",
      to: "2026-05-05T18:00:00Z",
      price: 1200,
      status: "Pending"
    },
    {
      _id: "bk-0032",
      car: {
        _id: "car-3",
        name: "Hyundai Elantra",
        image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80"
      },
      supplier: { _id: "sup-3", fullName: "Safe Travel" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-1", name: "Cairo International Airport" },
      from: "2026-03-20T14:00:00Z",
      to: "2026-03-22T14:00:00Z",
      price: 180,
      status: "Cancelled"
    }, {
      _id: "bk-00123",
      car: {
        _id: "car-1",
        name: "Tesla Model 3",
        image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80"
      },
      supplier: { _id: "sup-1", fullName: "Elite Car Rentals" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-2", name: "Downtown Cairo" },
      from: "2026-04-10T10:00:00Z",
      to: "2026-04-15T10:00:00Z",
      price: 450,
      status: "Paid"
    },
    {
      _id: "bk-0023",
      car: {
        _id: "car-2",
        name: "Mercedes-Benz C-Class",
        image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80"
      },
      supplier: { _id: "sup-2", fullName: "Luxury Drive" },
      pickupLocation: { _id: "loc-3", name: "Alexandria Port" },
      dropOffLocation: { _id: "loc-3", name: "Alexandria Port" },
      from: "2026-05-01T09:00:00Z",
      to: "2026-05-05T18:00:00Z",
      price: 1200,
      status: "Pending"
    },
    {
      _id: "bk-0033",
      car: {
        _id: "car-3",
        name: "Hyundai Elantra",
        image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80"
      },
      supplier: { _id: "sup-3", fullName: "Safe Travel" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-1", name: "Cairo International Airport" },
      from: "2026-03-20T14:00:00Z",
      to: "2026-03-22T14:00:00Z",
      price: 180,
      status: "Cancelled"
    }, {
      _id: "bk-0014",
      car: {
        _id: "car-14",
        name: "Tesla Model 3",
        image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80"
      },
      supplier: { _id: "sup-1", fullName: "Elite Car Rentals" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-2", name: "Downtown Cairo" },
      from: "2026-04-10T10:00:00Z",
      to: "2026-04-15T10:00:00Z",
      price: 450,
      status: "Paid"
    },
    {
      _id: "bk-0024",
      car: {
        _id: "car-24",
        name: "Mercedes-Benz C-Class",
        image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80"
      },
      supplier: { _id: "sup-2", fullName: "Luxury Drive" },
      pickupLocation: { _id: "loc-3", name: "Alexandria Port" },
      dropOffLocation: { _id: "loc-3", name: "Alexandria Port" },
      from: "2026-05-01T09:00:00Z",
      to: "2026-05-05T18:00:00Z",
      price: 1200,
      status: "Pending"
    },
    {
      _id: "bk-0035",
      car: {
        _id: "car-35",
        name: "Hyundai Elantra",
        image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80"
      },
      supplier: { _id: "sup-3", fullName: "Safe Travel" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-1", name: "Cairo International Airport" },
      from: "2026-03-20T14:00:00Z",
      to: "2026-03-22T14:00:00Z",
      price: 180,
      status: "Cancelled"
    }, {
      _id: "bk-0015",
      car: {
        _id: "car-15",
        name: "Tesla Model 3",
        image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80"
      },
      supplier: { _id: "sup-1", fullName: "Elite Car Rentals" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-2", name: "Downtown Cairo" },
      from: "2026-04-10T10:00:00Z",
      to: "2026-04-15T10:00:00Z",
      price: 450,
      status: "Paid"
    },
    {
      _id: "bk-0026",
      car: {
        _id: "car-26",
        name: "Mercedes-Benz C-Class",
        image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80"
      },
      supplier: { _id: "sup-2", fullName: "Luxury Drive" },
      pickupLocation: { _id: "loc-3", name: "Alexandria Port" },
      dropOffLocation: { _id: "loc-3", name: "Alexandria Port" },
      from: "2026-05-01T09:00:00Z",
      to: "2026-05-05T18:00:00Z",
      price: 1200,
      status: "Pending"
    },
    {
      _id: "bk-0036",
      car: {
        _id: "car-36",
        name: "Hyundai Elantra",
        image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80"
      },
      supplier: { _id: "sup-3", fullName: "Safe Travel" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-1", name: "Cairo International Airport" },
      from: "2026-03-20T14:00:00Z",
      to: "2026-03-22T14:00:00Z",
      price: 180,
      status: "Cancelled"
    }, {
      _id: "bk-0016",
      car: {
        _id: "car-16",
        name: "Tesla Model 3",
        image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80"
      },
      supplier: { _id: "sup-1", fullName: "Elite Car Rentals" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-2", name: "Downtown Cairo" },
      from: "2026-04-10T10:00:00Z",
      to: "2026-04-15T10:00:00Z",
      price: 450,
      status: "Paid"
    },
    {
      _id: "bk-0027",
      car: {
        _id: "car-27",
        name: "Mercedes-Benz C-Class",
        image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80"
      },
      supplier: { _id: "sup-2", fullName: "Luxury Drive" },
      pickupLocation: { _id: "loc-3", name: "Alexandria Port" },
      dropOffLocation: { _id: "loc-3", name: "Alexandria Port" },
      from: "2026-05-01T09:00:00Z",
      to: "2026-05-05T18:00:00Z",
      price: 1200,
      status: "Pending"
    },
    {
      _id: "bk-0037",
      car: {
        _id: "car-3",
        name: "Hyundai Elantra",
        image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80"
      },
      supplier: { _id: "sup-3", fullName: "Safe Travel" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-1", name: "Cairo International Airport" },
      from: "2026-03-20T14:00:00Z",
      to: "2026-03-22T14:00:00Z",
      price: 180,
      status: "Cancelled"
    }, {
      _id: "bk-0018",
      car: {
        _id: "car-18",
        name: "Tesla Model 3",
        image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80"
      },
      supplier: { _id: "sup-1", fullName: "Elite Car Rentals" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-2", name: "Downtown Cairo" },
      from: "2026-04-10T10:00:00Z",
      to: "2026-04-15T10:00:00Z",
      price: 450,
      status: "Paid"
    },
    {
      _id: "bk-0028",
      car: {
        _id: "car-28",
        name: "Mercedes-Benz C-Class",
        image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80"
      },
      supplier: { _id: "sup-2", fullName: "Luxury Drive" },
      pickupLocation: { _id: "loc-3", name: "Alexandria Port" },
      dropOffLocation: { _id: "loc-3", name: "Alexandria Port" },
      from: "2026-05-01T09:00:00Z",
      to: "2026-05-05T18:00:00Z",
      price: 1200,
      status: "Pending"
    },
    {
      _id: "bk-0038",
      car: {
        _id: "car-38",
        name: "Hyundai Elantra",
        image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80"
      },
      supplier: { _id: "sup-3", fullName: "Safe Travel" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-1", name: "Cairo International Airport" },
      from: "2026-03-20T14:00:00Z",
      to: "2026-03-22T14:00:00Z",
      price: 180,
      status: "Cancelled"
    }, {
      _id: "bk-0018",
      car: {
        _id: "car-1",
        name: "Tesla Model 3",
        image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80"
      },
      supplier: { _id: "sup-1", fullName: "Elite Car Rentals" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-2", name: "Downtown Cairo" },
      from: "2026-04-10T10:00:00Z",
      to: "2026-04-15T10:00:00Z",
      price: 450,
      status: "Paid"
    },
    {
      _id: "bk-0092",
      car: {
        _id: "car-92",
        name: "Mercedes-Benz C-Class",
        image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80"
      },
      supplier: { _id: "sup-2", fullName: "Luxury Drive" },
      pickupLocation: { _id: "loc-3", name: "Alexandria Port" },
      dropOffLocation: { _id: "loc-3", name: "Alexandria Port" },
      from: "2026-05-01T09:00:00Z",
      to: "2026-05-05T18:00:00Z",
      price: 1200,
      status: "Pending"
    },
    {
      _id: "bk-0093",
      car: {
        _id: "car-93",
        name: "Hyundai Elantra",
        image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80"
      },
      supplier: { _id: "sup-3", fullName: "Safe Travel" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-1", name: "Cairo International Airport" },
      from: "2026-03-20T14:00:00Z",
      to: "2026-03-22T14:00:00Z",
      price: 180,
      status: "Cancelled"
    }, {
      _id: "bk-0091",
      car: {
        _id: "car-91",
        name: "Tesla Model 3",
        image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80"
      },
      supplier: { _id: "sup-1", fullName: "Elite Car Rentals" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-2", name: "Downtown Cairo" },
      from: "2026-04-10T10:00:00Z",
      to: "2026-04-15T10:00:00Z",
      price: 450,
      status: "Reserved"
    },
    {
      _id: "bk-0202",
      car: {
        _id: "car-452",
        name: "Mercedes-Benz C-Class",
        image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80"
      },
      supplier: { _id: "sup-2", fullName: "Luxury Drive" },
      pickupLocation: { _id: "loc-3", name: "Alexandria Port" },
      dropOffLocation: { _id: "loc-3", name: "Alexandria Port" },
      from: "2026-05-01T09:00:00Z",
      to: "2026-05-05T18:00:00Z",
      price: 1200,
      status: "Pending"
    },
    {
      _id: "bk-00663",
      car: {
        _id: "car-6663",
        name: "Hyundai Elantra",
        image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80"
      },
      supplier: { _id: "sup-3", fullName: "Safe Travel" },
      pickupLocation: { _id: "loc-1", name: "Cairo International Airport" },
      dropOffLocation: { _id: "loc-1", name: "Cairo International Airport" },
      from: "2026-03-20T14:00:00Z",
      to: "2026-03-22T14:00:00Z",
      price: 180,
      status: "Deposit"
    }
  ];

  // تطبيق الفلاتر على الداتا
  const filteredBookings = mockBookings.filter((booking) => {
    // فلتر الحالة
    const isStatusMatch = statuses.length > 0
      ? statuses.includes(booking.status)
      : true;

    // فلتر كلمة البحث
    let isKeywordMatch = true;
    if (keyword) {
      const searchString = `${booking.car.name} ${booking.pickupLocation.name} ${booking.supplier.fullName}`.toLowerCase();
      isKeywordMatch = searchString.includes(keyword);
    }

    return isStatusMatch && isKeywordMatch;
  });

  const response = {
    resultData: filteredBookings,
    pageInfo: [{ totalRecords: filteredBookings.length }]
  };

  // تأخير بسيط لمحاكاة سرعة النت الحقيقية
  await new Promise((resolve) => setTimeout(resolve, 800));

  return NextResponse.json(response);
}