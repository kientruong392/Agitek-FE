import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface AuthCredentials {
    isExternal?: string | boolean;
    accessToken?: string;
    refreshToken?: string;
  }

  interface RefreshResponse {
    success?: boolean;
    data?: {
      accessToken?: string;
      refreshToken?: string;
    };
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    userPayload?: UserPayload;
  }

  interface UserPayload {
    id: string;
    username: string;
    email: string;
    isVerified?: boolean;
    isActive?: boolean;
    role?: string;
    avatarUrl?: string;
    name?: string;
  }

  interface Session {
    user?: UserPayload;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    userPayload?: UserPayload;
  }

  interface JWTPayload {
    sub?: string;
    email?: string;
    username?: string;
    name?: string;
    isVerified?: boolean | string;
    isActive?: boolean | string;
    role?: string;
    avatarUrl?: string;
    exp?: number;
    iat?: number;
    jti?: string;
  }
}
