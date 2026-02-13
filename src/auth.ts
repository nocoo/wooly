import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { parseEmailWhitelist, isEmailAllowed } from "@/lib/auth";

const allowedEmails = parseEmailWhitelist(
  process.env.AUTH_ALLOWED_EMAILS ?? "",
);

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
      return isEmailAllowed(profile?.email, allowedEmails);
    },
  },
});
