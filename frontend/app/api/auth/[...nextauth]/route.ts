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
  refreshToken?: string;
  expiresAt?: string;
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

async function refreshAccessToken(token: any) {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.token,
      refreshToken: refreshedTokens.refreshToken,
      accessTokenExpires: new Date(refreshedTokens.expiresAt).getTime(),
    };
  } catch (error) {
    logger.error("Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
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
              refreshToken: data.refreshToken || "",
              expiresAt: data.expiresAt || "",
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
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.roles = user.roles;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = new Date(user.expiresAt).getTime();
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to refresh it
      return await refreshAccessToken(token);
    },
    // 2. نقل الداتا من التوكن للـ Session عشان الفرونت إند يعرف يقرأها
    session({ session, token }) {
      session.user.id = token.id;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.user.roles = token.roles;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.accessTokenExpires = token.accessTokenExpires;

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
