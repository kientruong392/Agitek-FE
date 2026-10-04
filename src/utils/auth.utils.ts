import { jwtDecode } from "jwt-decode";
import { UserPayload } from "next-auth";
import { JWTPayload } from "next-auth/jwt";

export function getJwtPayload(token: string): JWTPayload | null {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch {
    return null;
  }
}

export function parseAccessToken(accessToken: string) {
  try {
    const decoded = jwtDecode<JWTPayload>(accessToken);
    return {
      userPayload: {
        id: decoded.sub,
        username: decoded.username,
        email: decoded.email,
        isVerified: decoded.isVerified,
        isActive: decoded.isActive,
        role: decoded.role,
        avatarUrl: decoded.avatarUrl,
      } as UserPayload,
      expires_at: (decoded.exp ?? 0) * 1000,
    };
  } catch {
    return null;
  }
}

export function getDefaultError(error: any) {
  // Throw NEXT_REDIRECT error
  if (error && typeof error === "object" && error.message === "NEXT_REDIRECT") {
    throw error;
  }
  
  return {
    success: false,
    statusCode: 500,
    errorCode: "INTERNAL_SERVER_ERROR",
    message: error?.message || "Internal Server Error",
    timestamp: new Date().toISOString()
  };
}
