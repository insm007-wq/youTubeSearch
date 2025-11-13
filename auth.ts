import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Kakao from 'next-auth/providers/kakao'
import Naver from 'next-auth/providers/naver'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import clientPromise from './lib/db'

export const runtime = 'nodejs'

// Vercel 빌드 타임에 adapter를 포함하지 않고, 런타임에만 포함
const authConfig: any = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID,
      clientSecret: process.env.AUTH_KAKAO_SECRET,
    }),
    Naver({
      clientId: process.env.AUTH_NAVER_ID,
      clientSecret: process.env.AUTH_NAVER_SECRET,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: 'authjs.session-token',
      options: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.image = token.image as string
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  trustHost: true,
}

// MongoDB Adapter를 런타임에만 추가
if (process.env.MONGODB_URI) {
  authConfig.adapter = MongoDBAdapter(clientPromise)
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
