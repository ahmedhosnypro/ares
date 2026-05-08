import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import HeaderClient from "./HeaderClient";
import { logger } from "@/utils/logger";

export default async function Header() {
  // getServerSession can throw JWT_SESSION_ERROR (decryption operation failed)
  // when the browser still holds a session cookie that was encrypted with an
  // older NEXTAUTH_SECRET. Treat that as an anonymous session instead of
  // crashing the whole page render -- the stale cookie will be replaced the
  // next time the user signs in.
  const session = await getServerSession(authOptions).catch((error: unknown) => {
    logger.warn("Failed to read session in Header, falling back to anonymous", error);
    return null;
  });

  return <HeaderClient session={session} />;
}
