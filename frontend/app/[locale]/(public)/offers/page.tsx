import OffersPageContent from "./_components/OffersPageContent";

export default async function OffersPage({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  await params;
  return <OffersPageContent />;
}
