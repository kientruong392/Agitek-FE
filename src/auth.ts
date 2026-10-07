import NextAuth, { AuthCredentials } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { parseAccessToken } from "@/utils/auth.utils";

const API_URL = process.env.API_URL;

// Dictionary lưu trữ các promise đang thực hiện refresh token để tránh gọi API nhiều lần
// Sử dụng refreshToken làm key để phân biệt các user khác nhau trên server Next.js
const refreshTokenPromises: Record<string, Promise<import("next-auth").RefreshResponse>> = {};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        isExternal: {},
        accessToken: {},
        refreshToken: {},
      },
      async authorize(credentials) {
        console.log("Authorize called with credentials:", credentials);
        const authCredentials = credentials as AuthCredentials;
        if (authCredentials?.isExternal !== "true") return null;

        const parsed = parseAccessToken(authCredentials.accessToken as string);
        if (!parsed) return null;
        console.log("Parsed access token:", parsed);
        return {
          id: parsed.userPayload.id,
          accessToken: authCredentials.accessToken as string,
          refreshToken: authCredentials.refreshToken as string,
          userPayload: parsed.userPayload,
          expiresAt: parsed.expiresAt,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.expiresAt = user.expiresAt;
        token.userPayload = user.userPayload;
        return token;
      }

      if (Date.now() < (token.expiresAt || 0)) {
        return token;
      }

      const refreshToken = token.refreshToken as string;
      if (!refreshToken) {
        token.error = "RefreshAccessTokenError-1";
        return token;
      }
      // Mutex lock
      if (!refreshTokenPromises[refreshToken]) {
        refreshTokenPromises[refreshToken] = (async () => {
          try {
              const res = await fetch(`${API_URL}/auth/refresh`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ refreshToken }),
              });

              if (!res.ok) throw new Error("RefreshAccessTokenError-2");
              return await res.json();
          } finally {
              delete refreshTokenPromises[refreshToken];
          }
        })();
      }
      try {
        const body = await refreshTokenPromises[refreshToken];
        const parsed = body?.data?.accessToken ? parseAccessToken(body.data.accessToken) : null;
        
        if (parsed) {
          token.accessToken = body.data?.accessToken;
          token.refreshToken = body.data?.refreshToken ?? refreshToken;
          token.expiresAt = parsed.expiresAt;
          token.userPayload = parsed.userPayload;
          delete token.error;
        } else {
          token.error = "RefreshAccessTokenError-3";
        }
      } catch {
        token.error = "RefreshAccessTokenError-4";
      }

      return token;
    },

    async session({ session, token }) {
      session.error = token.error;
      if (token.userPayload) {
        session.user = token.userPayload as never;
        session.accessToken = token.accessToken;
        session.error = token.error;
      }
      return session;
    },
  },

  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.AUTH_SECRET,
});
