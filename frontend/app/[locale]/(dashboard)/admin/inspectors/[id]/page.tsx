import InspectorDetailsClient from "./_components/InspectorDetailsClient";

export default async function InspectorDetailsPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InspectorDetailsClient inspectorId={id} />;
}
