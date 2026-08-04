import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

// Supabase admin client — will be activated when DB is ready
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Initialize only when env vars are present
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const DEVELOPERS = [
  "javiersiliacay12@gmail.com",
  "siliacay.javier@gmail.com",
];

const OWNERS: string[] = [
  // Add ALK Trucking owner emails here
];

const MANAGERS: string[] = [
  // Add ALK Trucking manager emails here
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const isDeveloper = DEVELOPERS.includes(user.email);
      const isOwner = OWNERS.includes(user.email);
      const isManager = MANAGERS.includes(user.email);

      // If DB is configured, check pre-registered users
      if (supabase) {
        const { data: dbUser } = await supabase
          .from("users")
          .select("id, role")
          .eq("email", user.email)
          .single();

        if (!isDeveloper && !isOwner && !isManager && !dbUser) {
          console.warn(`Unauthorized login attempt blocked: ${user.email}`);
          return false;
        }

        let computedRole = "staff";
        if (isDeveloper) computedRole = "developer";
        else if (isOwner) computedRole = "owner";
        else if (isManager) computedRole = "manager";
        else if (dbUser) computedRole = dbUser.role;

        await supabase.from("users").upsert(
          {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: computedRole,
          },
          { onConflict: "email", ignoreDuplicates: false }
        );
      } else {
        // DB not configured — allow developers only
        if (!isDeveloper) return false;
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;

        if (supabase) {
          const { data } = await supabase
            .from("users")
            .select("role, image")
            .eq("email", session.user.email)
            .single();

          if (data) {
            (session.user as any).role = data.role;
            (session.user as any).image = data.image || session.user.image;
          }
        } else {
          // Fallback role assignment when DB not ready
          const isDeveloper = DEVELOPERS.includes(session.user.email || "");
          (session.user as any).role = isDeveloper ? "developer" : "guest";
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
});
