import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db/prisma';
import { getOAuthProviders } from './providers';
import { verifyPassword } from './password';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...getOAuthProviders(),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          return null;
        }

        // If user has a password hash, verify it
        if (user.passwordHash) {
          const isValid = await verifyPassword(credentials.password, user.passwordHash);
          if (!isValid) {
            return null;
          }
        } else {
          // User exists but has no password (OAuth only user)
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
          role: user.role,
          academicProfile: user.academicProfile,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/signin',
    signOut: '/signout',
    error: '/error',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.bio = user.bio;
        token.avatar = user.avatar;
        token.role = user.role;
        token.academicProfile = (user as any).academicProfile;
      }
      // Handle session update from client
      if (trigger === 'update' && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.bio !== undefined) token.bio = session.bio;
        if ((session as any).academicProfile !== undefined) {
          token.academicProfile = (session as any).academicProfile;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string | null;
        session.user.bio = token.bio as string | null;
        session.user.avatar = token.avatar as string | null;
        session.user.role = token.role ?? 'USER';
        (session.user as any).academicProfile = token.academicProfile;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
