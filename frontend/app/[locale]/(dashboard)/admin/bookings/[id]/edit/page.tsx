import EditBookingClient from "./_components/EditBookingClient";

// 1. خلينا الفانكشن async
export default async function EditBookingPage({ params }: { readonly params: Promise<{ id: string }> }) {
  // 2. عملنا await للـ params عشان نفك الـ Promise وناخد الـ id الحقيقي
  const resolvedParams = await params;

  // 3. بنبعت الـ id الحقيقي للكلاينت
  return <EditBookingClient bookingId={resolvedParams.id} />;
}
