import { NextRequest, NextResponse } from 'next/server'

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3'

export async function GET(request: NextRequest) {
  // ✅ 인증: 미들웨어에서 이미 확인됨 (이중 체크 제거)

  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channelId')?.trim()
  const apiKey = process.env.YOUTUBE_API_KEY

  // ✅ 입력값 검증
  if (!channelId || channelId.length < 1 || channelId.length > 50) {
    return NextResponse.json(
      { error: '올바른 채널 ID가 필요합니다' },
      { status: 400 }
    )
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API 키가 설정되지 않았습니다' },
      { status: 500 }
    )
  }

  try {
    // ✅ URLSearchParams 사용 (API 키 안전하게 처리)
    const url = new URL(`${YOUTUBE_API_URL}/channels`)
    url.searchParams.append('part', 'snippet,statistics,brandingSettings')
    url.searchParams.append('id', channelId)
    url.searchParams.append('key', apiKey)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: '채널 정보를 불러올 수 없습니다' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const channel = data.items[0]

    if (!channel) {
      return NextResponse.json(
        { error: '채널을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const stats = channel.statistics
    const snippet = channel.snippet

    return NextResponse.json({
      title: snippet.title,
      description: snippet.description || '설명 없음',
      viewCount: parseInt(stats.viewCount) || 0,
      subscriberCount: parseInt(stats.subscriberCount) || 0,
      hiddenSubscriberCount: stats.hiddenSubscriberCount || false,
      videoCount: parseInt(stats.videoCount) || 0,
      customUrl: snippet.customUrl || 'N/A',
      thumbnail: snippet.thumbnails?.medium?.url || '',
    })
  } catch (error) {
    console.error('채널 조회 오류:', error)
    return NextResponse.json(
      { error: '채널 정보 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
