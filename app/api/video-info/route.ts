import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkApiUsage } from '@/lib/apiUsage'
import { getVideoInfo } from '@/lib/rapidApiClient'

/**
 * 비디오 정보 조회 엔드포인트 (국가 정보 포함)
 * RapidAPI YT-API /video/info 사용
 */
export async function GET(request: NextRequest) {
  // ✅ 인증 확인 및 비활성화 체크
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json(
      { error: '인증이 필요합니다. 로그인해주세요.' },
      { status: 401 }
    )
  }

  const userEmail = session.user.email || 'unknown@example.com'

  // ✅ 비활성화 사용자 체크
  try {
    const usageCheck = await checkApiUsage(userEmail)
    if (!usageCheck.allowed && usageCheck.limit === 0) {
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
    console.error('❌ 비활성화 체크 에러:', error)
    // 에러가 발생해도 진행
  }

  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')?.trim()

  // ✅ 입력값 검증
  if (!videoId || videoId.length < 1 || videoId.length > 50) {
    return NextResponse.json(
      { error: '올바른 비디오 ID가 필요합니다' },
      { status: 400 }
    )
  }

  try {
    // ✅ RapidAPI로 비디오 정보 조회
    console.log(`🎥 비디오 정보 조회: ${videoId}`)
    const videoInfo = await getVideoInfo(videoId)

    // ✅ 응답 반환
    return NextResponse.json({
      country: videoInfo.country,
    })
  } catch (error) {
    console.error('❌ 비디오 조회 오류:', error)
    return NextResponse.json(
      { error: '비디오 정보 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
