import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const session = await getServerSession(authOptions);

  return <HeaderClient session={session} />;
}
