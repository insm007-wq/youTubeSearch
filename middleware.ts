import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'

export async function middleware(req: NextRequest) {
  // ✅ 세션 쿠키 존재 여부 확인 (로그인 상태 확인)
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

  // ✅ 비활성화 사용자 체크 (API 요청)
  if (isAuthenticated && isAPI) {
    try {
      const session = await auth()
      if (!session?.user) {
        return NextResponse.json(
          { error: '인증이 필요합니다. 로그인해주세요.' },
          { status: 401 }
        )
      }

      // 사용자의 비활성화 상태를 확인하기 위해 DB 조회
      const userId = session.user.id || session.user.email || 'unknown'

      // 동적으로 checkApiUsage 임포트하여 비활성화 상태 확인
      const { checkApiUsage } = await import('@/lib/apiUsage')
      const userEmail = session.user.email || 'unknown@example.com'
      const usageCheck = await checkApiUsage(userId, userEmail)

      // 비활성화된 사용자 차단
      if (usageCheck.deactivated) {
        return NextResponse.json(
          {
            error: '계정이 비활성화되었습니다',
            message: '더 이상 서비스를 이용할 수 없습니다. 관리자에게 문의하세요.',
            deactivated: true
          },
          { status: 403 }
        )
      }
    } catch (error) {
      console.error('❌ 미들웨어 비활성화 체크 에러:', error)
      // 에러가 발생해도 API는 진행하도록 (DB 연결 실패 등의 경우)
    }
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
