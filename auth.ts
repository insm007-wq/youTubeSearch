import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Kakao from 'next-auth/providers/kakao'
import Naver from 'next-auth/providers/naver'
import { upsertUser } from './lib/userLimits'

export const runtime = 'nodejs'

const secret = process.env.NEXTAUTH_SECRET

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: secret,
  trustHost: true,
  basePath: '/api/auth',
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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      // OAuth provider의 영구적인 고유 ID 사용 (로그인할 때마다 동일)
      if (account?.providerAccountId) {
        token.id = `${account.provider}:${account.providerAccountId}`

        // 로그인 시 사용자 정보를 MongoDB에 저장
        try {
          // OAuth 제공자별로 추가 정보 수집
          let emailVerified: boolean | undefined
          let locale: string | undefined

          // Google OAuth에서 이메일 인증 여부 가져오기
          if (account.provider === 'google') {
            emailVerified = user.email_verified ?? false
            locale = user.locale ?? 'ko'
          }
          // Kakao OAuth에서 정보 가져오기
          else if (account.provider === 'kakao') {
            emailVerified = user.kakao_account?.is_email_verified ?? false
            locale = user.properties?.locale ?? 'ko'
          }
          // Naver OAuth에서 정보 가져오기
          else if (account.provider === 'naver') {
            emailVerified = true // Naver는 기본적으로 인증된 이메일 제공
            locale = 'ko' // Naver는 한국 서비스이므로 기본값 'ko'
          }

          // 제공자별 이메일 추출
          let email = user.email || ''
          if (account.provider === 'kakao' && !email) {
            email = user.kakao_account?.email || user.kakao_account?.account_email || ''
          }

          await upsertUser(
            email,
            user.name,
            user.image,
            account.provider,
            account.providerAccountId
          )
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('사용자 정보 저장 실패:', error instanceof Error ? error.message : error)
          }
          // 저장 실패해도 로그인은 진행
        }
      }
      if (user) {
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
        // provider 정보 추가 (OAuth 제공자별 색상 표시용)
        session.user.provider = token.id?.split(':')[0] || undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
