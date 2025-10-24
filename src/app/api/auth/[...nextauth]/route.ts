import NextAuth, { NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        await connectDB();

        // Check if user exists by email
        let existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          // Create new user if doesn't exist
          existingUser = await User.create({
            email: user.email!,
            name: user.name,
            image: user.image,
          });
        }

        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async session({ session }) {
      try {
        await connectDB();

        if (session.user?.email) {
          const user = await User.findOne({ email: session.user.email });
          if (user) {
            (session.user as { id: string }).id = user._id.toString();
          }
        }

        return session;
      } catch (error) {
        console.error('Error in session callback:', error);
        return session;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 365 * 24 * 60 * 60, // 365 days in seconds
  },
  jwt: {
    maxAge: 365 * 24 * 60 * 60, // 365 days in seconds
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
