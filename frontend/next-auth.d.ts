import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

// 1. تعريف المتغيرات الجديدة جوه الـ Session والـ User
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      roles: string[];
      /** ApplicationUser.Status — "Pending" | "Active" | "Blocked" | null. */
      status?: string | null;
      phone?: string | null;
    } & DefaultSession["user"];
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    error?: string;
  }

  interface User {
    id: string;
    firstName: string;
    lastName: string;
    roles: string[];
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    /** ApplicationUser.Status — "Pending" | "Active" | "Blocked" | null. */
    status?: string | null;
    phone?: string | null;
  }
}

// 2. تعريف المتغيرات الجديدة جوه التوكن المشفر
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    firstName: string;
    lastName: string;
    roles: string[];
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    error?: string;
    /** ApplicationUser.Status — "Pending" | "Active" | "Blocked" | null. */
    status?: string | null;
    phone?: string | null;
  }
}
