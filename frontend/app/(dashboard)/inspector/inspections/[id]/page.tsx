import InspectionDetailsClient from "./_components/InspectionDetailsClient";

export default async function InspectionDetailsPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InspectionDetailsClient inspectionId={id} />;
}
