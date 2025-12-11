import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkApiUsage } from '@/lib/apiUsage'
import { getChannelInfo } from '@/lib/youtubeChannelsClient'

/**
 * YouTube 채널 상세 정보 조회 엔드포인트
 * RapidAPI YouTube V2 /channel/details 사용
 * (이전: Google YouTube Data API v3)
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
  const channelId = searchParams.get('channelId')?.trim()

  // ✅ 입력값 검증
  if (!channelId || channelId.length < 1 || channelId.length > 50) {
    return NextResponse.json(
      { error: '올바른 채널 ID가 필요합니다' },
      { status: 400 }
    )
  }

  try {
    // ✅ RapidAPI로 채널 정보 조회
    console.log(`📺 채널 상세 정보 조회: ${channelId}`)
    const channel = await getChannelInfo(channelId)

    if (!channel) {
      return NextResponse.json(
        { error: '채널을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // ✅ 응답 형식 (기존 호환)
    return NextResponse.json({
      title: channel.title,
      description: channel.description,
      viewCount: channel.viewCount,
      subscriberCount: channel.subscriberCount,
      hiddenSubscriberCount: false, // RapidAPI 미지원
      videoCount: channel.videoCount,
      customUrl: 'N/A', // RapidAPI 미지원
      thumbnail: channel.thumbnail,
      banner: channel.banner,
      country: channel.country,
      verified: channel.verified,
    })
  } catch (error) {
    console.error('❌ 채널 조회 오류:', error)
    return NextResponse.json(
      { error: '채널 정보 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
