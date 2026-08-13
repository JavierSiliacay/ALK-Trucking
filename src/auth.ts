import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const DEVELOPERS = [
  "siliacay.javier@gmail.com"
  //"javiersiliacaysiliacay1234@gmail.com"
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/access-denied',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const isDeveloper = DEVELOPERS.includes(user.email);

      // Check if user exists in the database
      const dbUsers = await db.select().from(users).where(eq(users.email, user.email));
      const dbUser = dbUsers[0];

      if (!isDeveloper && !dbUser) {
        console.warn(`Unauthorized login attempt blocked: ${user.email}`);
        return false; // Deny access (Auth.js will redirect to error page)
      }

      // If they exist in DB (or developer), update their name if needed
      if (dbUser || isDeveloper) {
        await db.insert(users).values({
          email: user.email,
          name: user.name || "",
          role: "ADMIN"
        }).onConflictDoUpdate({
          target: users.email,
          set: {
            name: user.name || "",
          }
        });
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        
        // Always set role to ADMIN since that's our RBAC structure for now
        (session.user as any).role = "ADMIN";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  session: { strategy: "jwt" },
});
