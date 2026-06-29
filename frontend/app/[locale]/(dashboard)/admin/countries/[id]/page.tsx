import CountryDetailsClient from "./_components/CountryDetailsClient";

export const metadata = {
  title: "Country Details | ARES Admin",
  description: "Detailed information for a single country.",
};

export default async function AdminCountryDetailPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <CountryDetailsClient countryId={resolvedParams.id} />;
}
