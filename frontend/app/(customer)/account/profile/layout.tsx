import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AdminLayout from "@/app/(dashboard)/admin/layout";
import SupplierLayout from "@/app/(dashboard)/supplier/layout";

export default async function ProfileLayout({ children }: { readonly children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  const roles = session?.user?.roles || [];
  const isAdmin = roles.includes("Admin");
  const isSupplier = roles.includes("Supplier");

  // Dynamic layout injection based on user role
  if (isAdmin) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  if (isSupplier) {
    return <SupplierLayout>{children}</SupplierLayout>;
  }

  // Default layout (User/Public)
  return <>{children}</>;
}
