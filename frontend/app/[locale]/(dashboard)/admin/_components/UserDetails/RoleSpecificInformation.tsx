import React from "react";
import { User, DriverDetails, SupplierDetails } from "@/api-clients/users/users";
import DriverInformationCard from "./DriverInformationCard";
import SupplierInformationCard from "./SupplierInformationCard";
import { UserType } from "../UserDetailsView";

interface RoleSpecificInformationProps {
  userType: UserType;
  roles?: string[];
  driverDetails?: DriverDetails | null;
  supplierDetails?: SupplierDetails | null;
  t: (key: string) => string;
}

export default function RoleSpecificInformation({
  userType,
  roles,
  driverDetails,
  supplierDetails,
  t,
}: RoleSpecificInformationProps) {
  const isDriver = userType === "driver" || roles?.some(r => r.toLowerCase() === "driver");
  const isSupplier = userType === "supplier" || roles?.some(r => r.toLowerCase() === "supplier");

  if (isDriver) {
    return <DriverInformationCard driverDetails={driverDetails} t={t} />;
  }

  if (isSupplier) {
    return <SupplierInformationCard supplierDetails={supplierDetails} t={t} />;
  }

  // Future expansion: CustomerInformationCard, InspectorInformationCard
  return null;
}
