import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { User } from '@/app/lib/definitions';

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req): Promise<User | null> {
        const { username, password } = credentials as {
          username: string;
          password: string;
        };

        const user = fetch(process.env.NEXT_PUBLIC_BACKEND_BASE_URL as string + '/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: username, password }),
        })
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error('Erreur serveur', {cause: response});
          }
        })
        .then(json => {
          const user: User = {
            id: json.data.id, // Ensure that 'id' is returned from your backend and added here
            token: json.token,
            username: json.data.username,
            email: json.data.email,
          }
          return user;
        })
        .catch(e => {
          console.error('Une erreur est survenue', e);
          return null;
        })
        ;

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async jwt({ token, user, account, profile, trigger, session  }) {
      if (user) {
        token.email = user.email;
        token.name = user.username;
        token.jwt = user.token;
      }
      return token;
    },
    async session({ session, token, user }) {
      if (token) {
        session.user = {
          name: token.name,
          email: token.email,
          jwt: token.jwt,
        };
      }
        
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST};