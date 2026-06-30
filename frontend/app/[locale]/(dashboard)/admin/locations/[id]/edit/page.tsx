"use client";

import { useParams } from "next/navigation";
import LocationForm from "../../_components/LocationForm";

export default function AdminEditLocationPage() {
  const params = useParams();
  const id = params.id as string;

  return <LocationForm mode="edit" locationId={id} />;
}
