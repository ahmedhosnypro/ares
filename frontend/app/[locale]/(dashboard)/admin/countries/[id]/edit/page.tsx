import EditCountryClient from "./_components/EditCountryClient";

export const metadata = {
  title: "Edit Country | ARES Admin",
  description: "Edit country localization details.",
};

export default async function AdminEditCountryPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <EditCountryClient countryId={resolvedParams.id} />;
}
