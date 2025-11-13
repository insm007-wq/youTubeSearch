import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // ✅ 인증: 미들웨어에서 이미 확인됨 (이중 체크 제거)

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    let maxResults = parseInt(searchParams.get('maxResults') || '20')

    // ✅ 입력값 검증
    if (!query || query.length < 1 || query.length > 100) {
      return NextResponse.json(
        { error: '검색어는 1-100자 사이여야 합니다' },
        { status: 400 }
      )
    }

    // ✅ maxResults 범위 검증 (1-50)
    if (isNaN(maxResults) || maxResults < 1 || maxResults > 50) {
      maxResults = 20
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다' },
        { status: 500 }
      )
    }

    // ✅ YouTube API 호출 (URL 순서 개선: 매개변수를 먼저 설정하고 key는 마지막에)
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.append('part', 'snippet')
    url.searchParams.append('q', query)
    url.searchParams.append('type', 'video')
    url.searchParams.append('maxResults', maxResults.toString())
    url.searchParams.append('order', 'relevance')
    url.searchParams.append('key', apiKey)

    const response = await fetch(url.toString())

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.error?.message || 'YouTube API 오류' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // 비디오 ID 추출
    const videoIds = data.items?.map((item: any) => item.id.videoId).join(',') || ''

    if (!videoIds) {
      return NextResponse.json({
        items: [],
        totalResults: 0,
      })
    }

    // ✅ 비디오 상세 정보 조회 (조회수, 좋아요 등)
    const videoDetailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    videoDetailsUrl.searchParams.append('part', 'statistics,contentDetails,snippet')
    videoDetailsUrl.searchParams.append('id', videoIds)
    videoDetailsUrl.searchParams.append('key', apiKey)

    const videoDetailsResponse = await fetch(videoDetailsUrl.toString())
    const videoDetailsData = await videoDetailsResponse.json()

    // 채널 정보 조회 (구독자 수 등)
    const channelIds = videoDetailsData.items?.map((item: any) => item.snippet.channelId).join(',') || ''
    let channelData: any = { items: [] }

    if (channelIds) {
      const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels')
      channelUrl.searchParams.append('part', 'statistics')
      channelUrl.searchParams.append('id', channelIds)
      channelUrl.searchParams.append('key', apiKey)

      const channelResponse = await fetch(channelUrl.toString())
      channelData = await channelResponse.json()
    }

    // 데이터 병합
    const items = videoDetailsData.items?.map((video: any) => {
      const channelInfo = channelData.items?.find((ch: any) => ch.id === video.snippet.channelId)
      const subscriberCount = parseInt(channelInfo?.statistics?.subscriberCount || '0')
      const viewCount = parseInt(video.statistics?.viewCount || '0')
      const likeCount = parseInt(video.statistics?.likeCount || '0')

      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        viewCount,
        likeCount,
        duration: video.contentDetails?.duration,
        subscriberCount,
        thumbnail: video.snippet.thumbnails?.medium?.url,
        tags: video.snippet?.tags || [],
      }
    }) || []

    return NextResponse.json({
      items,
      totalResults: data.pageInfo?.totalResults || 0,
    })
  } catch (error) {
    console.error('YouTube API 에러:', error)
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다' },
      { status: 500 }
    )
  }
}
