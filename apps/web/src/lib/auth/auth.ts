import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      firstName: string;
      lastName: string;
      locale: string;
    };
  }
  interface User {
    id: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    locale: string;
  }
}

interface AppTokenFields {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  locale: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          locale: user.locale,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as typeof token & Partial<AppTokenFields>;
      if (user) {
        const u = user as typeof user & AppTokenFields;
        t.id = u.id;
        t.role = u.role;
        t.firstName = u.firstName;
        t.lastName = u.lastName;
        t.locale = u.locale;
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as typeof token & AppTokenFields;
      session.user.id = t.id;
      session.user.role = t.role;
      session.user.firstName = t.firstName;
      session.user.lastName = t.lastName;
      session.user.locale = t.locale;
      return session;
    },
  },
});
