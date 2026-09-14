import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          throw new Error("Credenciales inválidas");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
          throw new Error("Credenciales inválidas");
        }

        if (!user.active) {
          throw new Error(
            "Tu cuenta está desactivada, contacta a un administrador",
          );
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.active = user.active;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.active = token.active;
      }

      return session;
    },
  },
};