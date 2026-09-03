import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";

const googleClientId =
  process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || "";

const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || "";

const authSecret =
  process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

const googleFlag = process.env.PAYGATE_AUTH_GOOGLE_ENABLED;

const googleEnabled =
  (googleFlag == null ? "true" : googleFlag) === "true" &&
  !!googleClientId &&
  !!googleClientSecret;

const appleEnabled =
  process.env.PAYGATE_AUTH_APPLE_ENABLED === "true" &&
  !!process.env.APPLE_ID &&
  !!process.env.APPLE_TEAM_ID &&
  !!process.env.APPLE_PRIVATE_KEY &&
  !!process.env.APPLE_KEY_ID;

const providers = [];

if (googleEnabled) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

if (appleEnabled) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: {
        appleId: process.env.APPLE_ID,
        teamId: process.env.APPLE_TEAM_ID,
        privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        keyId: process.env.APPLE_KEY_ID,
      },
    })
  );
}

export const authOptions = {
  providers,
  secret: authSecret,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.provider = account.provider;
      }

      if (profile?.email) {
        token.email = profile.email;
      }

      return token;
    },

    async session({ session, token }) {
      if (token?.provider) {
        session.provider = token.provider;
      }

      return session;
    },
  },
};

export default NextAuth(authOptions);
