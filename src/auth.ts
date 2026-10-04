import NextAuth, { UserPayload } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { parseAccessToken } from "@/utils/auth.utils";

const API_URL = process.env.API_URL;

// Dictionary lưu trữ các promise đang thực hiện refresh token để tránh gọi API nhiều lần
// Sử dụng refresh_token làm key để phân biệt các user khác nhau trên server Next.js
const refreshTokenPromises: Record<string, Promise<any>> = {};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        isExternal: {},
        access_token: {},
        refresh_token: {},
      },
      async authorize(credentials) {
        if (credentials?.isExternal !== "true") return null;

        const parsed = parseAccessToken(credentials.access_token as string);
        if (!parsed) return null;

        return {
          id: parsed.userPayload.id,
          access_token: credentials.access_token as string,
          refresh_token: credentials.refresh_token as string,
          userPayload: parsed.userPayload,
          expires_at: parsed.expires_at,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.access_token = user.access_token;
        token.refresh_token = user.refresh_token;
        token.expires_at = user.expires_at;
        token.userPayload = user.userPayload;
        return token;
      }

      if (Date.now() < (token.expires_at || 0)) {
        return token;
      }

      const refreshToken = token.refresh_token as string;
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
                  body: JSON.stringify({ refresh_token: refreshToken }),
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
        const parsed = parseAccessToken(body?.data?.access_token);
        
        if (parsed) {
          token.access_token = body.data.access_token;
          token.refresh_token = body.data.refresh_token ?? refreshToken;
          token.expires_at = parsed.expires_at;
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
        session.user = token.userPayload;
        session.access_token = token.access_token;
        session.error = token.error;
      }
      return session;
    },
  },

  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.AUTH_SECRET,
});