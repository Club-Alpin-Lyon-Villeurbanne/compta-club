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
            
            // Décoder le token JWT pour obtenir les informations
            const claims = jose.decodeJwt(json.token);
            
            const user: User = {
              id: claims.id as string,
              accessToken: json.token,
              accessTokenExpires: claims.exp ? claims.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000,
              refreshToken: json.refresh_token,
              name: claims.nickname as string,
              email: claims.email as string,
            };
            return user;
          } else {
            throw new Error("Identifiants incorrects");
          }
        } catch (err) {
          console.error("Une erreur est survenue", err);
          throw err;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/",
    error: "/", // Rediriger vers la page de login en cas d'erreur
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Si l'URL est relative, on la combine avec baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Si l'URL est sur le même domaine, on la garde telle quelle
      else if (new URL(url).origin === baseUrl) return url
      // Sinon, on redirige vers la page d'accueil
      return baseUrl
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        const typedUser = user as User;
        return {
          ...token,
          user: typedUser,
          accessToken: typedUser.accessToken,
          accessTokenExpires: typedUser.accessTokenExpires,
          refreshToken: typedUser.refreshToken,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to refresh it
      try {
        const response = await fetch(
          (process.env.NEXT_PUBLIC_BACKEND_BASE_URL as string) + "/auth/refresh",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              refresh_token: token.refreshToken,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to refresh token");
        }

        const tokens = await response.json();
        const claims = jose.decodeJwt(tokens.token);

        return {
          ...token,
          accessToken: tokens.token,
          accessTokenExpires: claims.exp ? claims.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000,
          refreshToken: tokens.refresh_token ?? token.refreshToken,
        };
      } catch (error) {
        console.error("Error refreshing access token", error);
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
    async session({ session, token }) {
      if (token) {
        session.user = token.user as User;
        session.accessToken = token.accessToken as string;
        session.accessTokenExpires = token.accessTokenExpires as Number;
        session.refreshToken = token.refreshToken as string;
      }

      return session;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("Connexion réussie", user);
    },
    async signOut({ session, token }) {
      console.log("Déconnexion", session);
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
