import { Metadata } from "next";
import SupplierVehiclesClient from "./SupplierVehiclesClient";

export const metadata: Metadata = {
  title: "My Vehicles | ARES Supplier",
  description: "Manage your fleet — add, edit, delete, and toggle availability.",
};

export default function SupplierVehiclesPage() {
  return <SupplierVehiclesClient />;
}
