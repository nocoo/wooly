import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedEmails = (process.env.AUTH_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    signIn({ profile }) {
      if (!profile?.email) return false;
      const email = profile.email.toLowerCase();
      // Deny access if not in the whitelist
      if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
        return false;
      }
      return true;
    },
  },
});
