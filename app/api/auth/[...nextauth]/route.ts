import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { User } from "@/app/lib/definitions";
import * as jose from "jose";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req): Promise<User | null> {
        const { username, password } = credentials as {
          username: string;
          password: string;
        };

        try {
          const response = await fetch(
            (process.env.NEXT_PUBLIC_BACKEND_BASE_URL as string) + "/auth",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email: username, password }),
            }
          );

          if (response.ok) {
            const json = await response.json();

            const claims = jose.decodeJwt(json.token);
            const user: User = {
              id: claims.id as string, // Ensure that 'id' is returned from your backend and added here
              accessToken: json.token,
              accessTokenExpires: claims.exp * 1000,
              refreshToken: json.refresh_token,
              name: claims.nickname as string,
              email: claims.email as string,
            };
            return user;
          } else {
            throw new Error("Erreur serveur", { cause: response });
          }
        } catch (err) {
          console.error("Une erreur est survenue", err);
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    // async redirect({ url, baseUrl }) {
    //   // Allows relative callback URLs
    //   if (url.startsWith("/")) return `${baseUrl}${url}`
    //   // Allows callback URLs on the same origin
    //   else if (new URL(url).origin === baseUrl) return url
    //   return baseUrl
    // },
    async jwt({ token, user, account, profile, trigger, session }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          user,
          accessToken: user.accessToken,
          accessTokenExpires: user.accessTokenExpires,
          refreshToken: user.refreshToken,
        };
      }

      // Return previous token if the access token has not expired yet
      // if (Date.now() < token.accessTokenExpires) {
      //   return token
      // }

      // Access token has expired, try to update it
      //return refreshAccessToken(token)
      return token;
    },
    async session({ session, token, user }) {
      if (token) {
        session.user = token.user as User;
        session.accessToken = token.accessToken as string;
        session.accessTokenExpires = token.accessTokenExpires as Number;
        session.refreshToken = token.refreshToken as string;
        //session.error = token.error;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
