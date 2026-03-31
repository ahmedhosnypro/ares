import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        stayConnected: { label: "Stay Connected", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
        
        // بنبعت الداتا للـ API بتاعك زي ما اتفقنا مع الباك إند
        const res = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            stayConnected: credentials.stayConnected === "true",
          }),
          headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();

        // لو الباك إند رد بنجاح (200 OK)
        if (res.ok && data.user && data.token) {
          return {
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            roles: data.user.roles,
            emailVerified: data.user.emailVerified,
            accessToken: data.token // التوكن اللي هنحتاجه بعدين في الـ fetch
          } as any;
        } else {
          // معالجة الإيرورز عشان تظهر في صفحة اللوجين
          if (res.status === 401) throw new Error("Invalid email or password");
          if (res.status === 403) throw new Error("Account suspended or locked");
          if (res.status === 429) throw new Error("Too many attempts. Try again later");
          throw new Error(data.message || "An unexpected error occurred");
        }
      }
    })
  ],
  callbacks: {
    // 1. نقل الداتا من الباك إند للتوكن المشفر بتاع NextAuth
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.roles = user.roles;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    // 2. نقل الداتا من التوكن للـ Session عشان الفرونت إند يعرف يقرأها
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).firstName = token.firstName;
        (session.user as any).lastName = token.lastName;
        (session.user as any).roles = token.roles;
        (session as any).accessToken = token.accessToken;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', // بنعرفه إن دي صفحة اللوجين بتاعتنا
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // الجلسة تفضل شغالة 30 يوم
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };