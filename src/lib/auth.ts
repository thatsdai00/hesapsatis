import CredentialsProvider from 'next-auth/providers/credentials';
import { getServerSession, type NextAuthOptions } from 'next-auth';
import prisma from '@/lib/prisma';
import { verifyPassword } from './server-utils';

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    }
  }
  
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Auth: Missing email or password");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user || !user.password) {
            console.error(`Auth: User not found or missing password: ${credentials.email}`);
            return null;
          }

          const isValidPassword = await verifyPassword(credentials.password, user.password);

          if (!isValidPassword) {
            console.error(`Auth: Invalid password for user: ${credentials.email}`);
            return null;
          }

          console.log(`Auth: User authenticated successfully: ${user.email}, Role: ${user.role}`);
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/login',
    newUser: '/auth/register'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as string;
        console.log("JWT callback:", { id: token.id, role: token.role });
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        console.log("Session callback:", { id: session.user.id, role: session.user.role });
      }
      return session;
    }
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  logger: {
    error(code, metadata) {
      console.error(`NextAuth error [${code}]:`, metadata);
    },
    warn(code) {
      console.warn(`NextAuth warning [${code}]`);
    },
    debug(code, metadata) {
      console.log(`NextAuth debug [${code}]:`, metadata);
    }
  }
};

export const getAuthSession = () => getServerSession(authOptions); 