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

        fetch(process.env.BACKEND_LOGIN_CHECK as string, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
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
        })
        ;

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token, user }) {
      session.user = {
        name: user.name,
        email: user.email,
      };
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };