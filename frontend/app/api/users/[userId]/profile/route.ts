import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const resolvedParams = await params;
  const userId = resolvedParams.userId;

  // داتا البروفايل الوهمية
  const userProfile = {
    userId: userId,
    firstName: "Mohamed",
    lastName: "Elshinawy",
    email: "elshinawy83824964mo@gmail.com",
    emailVerified: true,
    phone: "+20 100 000 0000",
    phoneVerified: false,
    dateOfBirth: "2000-01-01",
    profilePhotoUrl: "", // سيبناها فاضية عشان يعرض أول حرف من اسمك
    address: {
      street: "Al-Azhar St.",
      city: "Damanhour",
      state: "Beheira",
      postalCode: "22511",
      country: "Egypt"
    },
    emergencyContact: {
      name: "Ahmed",
      phone: "+20 111 111 1111",
      relationship: "Brother"
    },
    languagePreference: "en",
    currencyPreference: "EGP",
    profileCompleteness: 75,
    verificationStatus: {
      email: true,
      phone: false,
      driverLicense: false,
      kyc: "basic"
    }
  };

  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json(userProfile);
}