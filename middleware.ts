import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // ✅ NextAuth 세션 쿠키 확인 (edge runtime compatible)
  // authjs.session-token은 NextAuth가 생성한 JWT 토큰으로, 유효하지 않거나 만료된 토큰은 자동으로 제거됨
  const sessionToken = req.cookies.get('authjs.session-token')?.value ||
                      req.cookies.get('__Secure-authjs.session-token')?.value

  const isAuthenticated = !!sessionToken
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')
  const isAPI = req.nextUrl.pathname.startsWith('/api/youtube')

  // ✅ 대시보드 접근 차단
  if (!isAuthenticated && isDashboard) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // ✅ API 접근 차단 (youtube API만)
  if (!isAuthenticated && isAPI) {
    return NextResponse.json(
      { error: '인증이 필요합니다. 로그인해주세요.' },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

// ✅ 미들웨어가 실행될 경로 설정
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/youtube_search',
    '/api/youtube_channel',
    '/api/youtube_comments',
  ],
}
