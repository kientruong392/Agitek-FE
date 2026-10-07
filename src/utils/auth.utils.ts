import { jwtDecode } from "jwt-decode";
import type { UserPayload } from "next-auth";
import type { JWTPayload } from "next-auth/jwt";

export function getJwtPayload(token: string): JWTPayload | null {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch {
    return null;
  }
}

function parseBooleanClaim(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return undefined;
}

export function parseAccessToken(accessToken: string) {
  try {
    const decoded = jwtDecode<JWTPayload>(accessToken);
    if (!decoded.sub || !decoded.email || !decoded.username) return null;

    return {
      userPayload: {
        id: decoded.sub,
        username: decoded.username,
        email: decoded.email,
        name: decoded.name,
        isVerified: parseBooleanClaim(decoded.isVerified),
        isActive: parseBooleanClaim(decoded.isActive),
        role: decoded.role,
        ...(decoded.avatarUrl ? { avatarUrl: decoded.avatarUrl } : {}),
      } as UserPayload,
      expiresAt: (decoded.exp ?? 0) * 1000,
    };
  } catch {
    return null;
  }
}

export function getDefaultError(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
  // Throw NEXT_REDIRECT error
  if (error instanceof Error && error.message === "NEXT_REDIRECT") {
    throw error;
  }
  
  return {
    success: false,
    statusCode: 500,
    errorCode: "INTERNAL_SERVER_ERROR",
    message: errorMessage,
    timestamp: new Date().toISOString()
  };
}
