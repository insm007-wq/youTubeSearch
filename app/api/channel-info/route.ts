import { NextRequest, NextResponse } from 'next/server'
import { getChannelInfo } from '@/lib/rapidApiClient'

/**
 * 채널 정보 조회 API
 * GET /api/channel-info?channelId=UCxxxxx
 *
 * 응답:
 * {
 *   subscriberCount: number,
 *   country: string | null,
 *   title: string
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId 파라미터가 필요합니다' },
        { status: 400 }
      )
    }

    const channelInfo = await getChannelInfo(channelId)

    return NextResponse.json({
      subscriberCount: channelInfo.subscriberCount,
      country: channelInfo.country,
      title: channelInfo.title,
      verified: channelInfo.verified,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: '채널 정보 조회 중 오류 발생',
        details: error instanceof Error ? error.message : '알 수 없는 에러',
      },
      { status: 500 }
    )
  }
}
