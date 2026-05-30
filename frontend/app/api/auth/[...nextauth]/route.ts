import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
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
    /** ApplicationUser.Status — surfaced so the frontend can route a
     *  freshly-registered "Pending" user to /complete-profile. */
    status?: string | null;
  };
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  message?: string;
};

async function performLogin(credentials: Record<string, string>, baseUrl: string): Promise<Response> {
  // Google ID-token flow — the client fetched an ID token via Google
  // Identity Services and we forward it to the backend, which validates
  // the token and returns the same shape as /api/auth/login.
  if (credentials.googleIdToken) {
    if (!credentials.googleRole) {
      throw new Error("Missing role for Google sign-in");
    }
    return fetch(`${baseUrl}/api/auth/google`, {
      method: "POST",
      body: JSON.stringify({
        idToken: credentials.googleIdToken,
        role: credentials.googleRole,
        stayConnected: credentials.stayConnected === "true",
      }),
      headers: { "Content-Type": "application/json" },
    });
  }

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
  // Prefer the backend's message when present so Google-flow specific
  // errors (e.g. "Invalid Google credentials.") surface verbatim.
  if (res.status === 401) throw new Error(data.message || "Invalid email or password");
  if (res.status === 403) throw new Error(data.message || "Account suspended or locked");
  if (res.status === 429) throw new Error("Too many attempts. Try again later");
  throw new Error(data.message || "An unexpected error occurred");
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    const refreshedTokens = (await response.json()) as AuthResponse;

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.token ?? token.accessToken,
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
      accessTokenExpires: refreshedTokens.expiresAt
        ? new Date(refreshedTokens.expiresAt).getTime()
        : token.accessTokenExpires,
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
        // Google ID token + selected role (Customer | Supplier | Driver).
        // The backend cryptographically validates the token; the role is
        // re-validated server-side as well.
        googleIdToken: { label: "Google ID Token", type: "text" },
        googleRole: { label: "Google Role", type: "text" },
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
              status: data.user.status ?? null,
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
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (trigger === "signIn") {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.roles = user.roles;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = new Date(user.expiresAt).getTime();
        token.status = user.status ?? null;
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to refresh it
      const refreshedToken = await refreshAccessToken(token);

      // If refresh failed, return error to force re-login
      if (refreshedToken.error) {
        return { ...token, error: "RefreshAccessTokenError" };
      }

      return refreshedToken;
    },
    // 2. نقل الداتا من التوكن للـ Session عشان الفرونت إند يعرف يقرأها
    session({ session, token }) {
      // If token refresh failed, propagate error to client
      if (token.error) {
        session.error = token.error;
      }

      session.user.id = token.id;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.user.roles = token.roles;
      session.user.status = token.status ?? null;
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

const handler = NextAuth(authOptions) as (req: Request) => Promise<Response>;

export { handler as GET, handler as POST };
