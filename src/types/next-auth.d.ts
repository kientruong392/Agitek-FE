import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface User {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    error?: string;
    userPayload?: UserPayload;
  }

  interface UserPayload {
    id: string;
    username: string;
    email: string;
    isVerified: boolean;
    isActive: boolean;
    role: string;
    avatarUrl?: string;
    exp?: number;
  }

  interface Session {
    userPayload?: UserPayload;
    access_token?: string;
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    error?: string;
    userPayload?: UserPayload;
  }

  interface JWTPayload {
    sub: string;
    username: string;
    email: string;
    isVerified: boolean;
    isActive: boolean;
    role: string;
    avatarUrl: string;
    exp?: number;
  }
}
