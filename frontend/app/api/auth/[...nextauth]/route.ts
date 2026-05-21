import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getApiBaseUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

// Validate NEXTAUTH_SECRET at build time
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set in environment variables");
}

type AuthResponse = {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    emailVerified: boolean;
  };
  token?: string;
  message?: string;
};

async function performLogin(credentials: Record<string, string>, baseUrl: string): Promise<Response> {
  if (credentials.demoRole) {
    return fetch(`${baseUrl}/api/auth/demo-login`, {
      method: "POST",
      body: JSON.stringify({ role: credentials.demoRole }),
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!credentials.email || !credentials.password) {
    throw new Error("Missing credentials");
  }

  return fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
      stayConnected: credentials.stayConnected === "true",
    }),
    headers: { "Content-Type": "application/json" },
  });
}

function handleAuthError(res: Response, data: AuthResponse): never {
  if (res.status === 401) throw new Error("Invalid email or password");
  if (res.status === 403) throw new Error(data.message || "Account suspended or locked");
  if (res.status === 429) throw new Error("Too many attempts. Try again later");
  throw new Error(data.message || "An unexpected error occurred");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        stayConnected: { label: "Stay Connected", type: "text" },
        demoRole: { label: "Demo Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new Error("Missing credentials");
        }

        const baseUrl = getApiBaseUrl();

        try {
          const res = await performLogin(credentials, baseUrl);
          const data = (await res.json()) as AuthResponse;

          if (res.ok && data.user && data.token) {
            return {
              id: data.user.id,
              email: data.user.email,
              firstName: data.user.firstName,
              lastName: data.user.lastName,
              roles: data.user.roles,
              emailVerified: data.user.emailVerified,
              accessToken: data.token,
            };
          }

          handleAuthError(res, data);
        } catch (error) {
          logger.error("NextAuth authorize error:", error);
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("Network error. Please check your connection.", { cause: error });
        }
      },
    }),
  ],
  callbacks: {
    // 1. نقل الداتا من الباك إند للتوكن المشفر بتاع NextAuth
    jwt({ token, user }) {
      const u = user as typeof user | undefined;
      if (u) {
        token.id = u.id;
        token.firstName = u.firstName;
        token.lastName = u.lastName;
        token.roles = u.roles;
        token.accessToken = u.accessToken;
      }
      return token;
    },
    // 2. نقل الداتا من التوكن للـ Session عشان الفرونت إند يعرف يقرأها
    session({ session, token }) {
      session.user.id = token.id;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.user.roles = token.roles;
      session.accessToken = token.accessToken;

      return session;
    },
  },
  pages: {
    signIn: "/sign-in", // Updated to match your actual sign-in page path
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // الجلسة تفضل شغالة 30 يوم
  },
  // Downgrade NextAuth's own console.error spam to warn-level for the one
  // recoverable case we already catch in <Header />: a stale session cookie
  // encrypted with a previous NEXTAUTH_SECRET. The user is auto-treated as
  // anonymous and re-signs in normally, so the dev-mode error overlay this
  // would otherwise produce is just noise.
  logger: {
    error(code, metadata) {
      if (code === "JWT_SESSION_ERROR") {
        logger.warn("Stale next-auth session cookie ignored", { code, metadata });
        return;
      }
      logger.error(`[next-auth] ${code}`, metadata);
    },
    warn(code) {
      logger.warn(`[next-auth] ${code}`);
    },
    debug(code, metadata) {
      logger.info(`[next-auth] ${code}`, metadata);
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
