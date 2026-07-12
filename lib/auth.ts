import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [Google],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    authorized({ auth }) {
      return Boolean(auth?.user)
    },

    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }

      return session
    },
  },
})
