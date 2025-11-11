import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Edge Runtime에서는 auth를 직접 호출할 수 없으므로
  // 세션 쿠키 존재 여부로 간단히 확인
  const sessionToken = req.cookies.get('authjs.session-token')?.value ||
                      req.cookies.get('__Secure-authjs.session-token')?.value

  if (!sessionToken && req.nextUrl.pathname === '/dashboard') {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: ['/dashboard/:path*'],
}
