import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const maxResults = searchParams.get('maxResults') || '20'
    const uploadPeriod = searchParams.get('uploadPeriod') || 'any'
    const videoDuration = searchParams.get('videoDuration') || 'any'

    // 검증
    if (!query) {
      return NextResponse.json(
        { error: '검색어를 입력해주세요' },
        { status: 400 }
      )
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다' },
        { status: 500 }
      )
    }

    // 기간 필터 변환
    const publishedAfterMap: Record<string, Date> = {
      all: new Date('2005-01-01'),
      '1month': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      '2months': new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      '6months': new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      '1year': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    }

    const publishedAfter = publishedAfterMap[uploadPeriod as keyof typeof publishedAfterMap]?.toISOString()

    // YouTube API 호출
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.append('key', apiKey)
    url.searchParams.append('q', query)
    url.searchParams.append('type', 'video')
    url.searchParams.append('part', 'snippet')
    url.searchParams.append('maxResults', maxResults)
    url.searchParams.append('order', 'relevance')

    if (publishedAfter) {
      url.searchParams.append('publishedAfter', publishedAfter)
    }

    if (videoDuration !== 'any') {
      url.searchParams.append('videoDuration', videoDuration)
    }

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

    // 비디오 상세 정보 조회 (조회수, 좋아요 등)
    const videoDetailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    videoDetailsUrl.searchParams.append('key', apiKey)
    videoDetailsUrl.searchParams.append('id', videoIds)
    videoDetailsUrl.searchParams.append('part', 'statistics,contentDetails,snippet')

    const videoDetailsResponse = await fetch(videoDetailsUrl.toString())
    const videoDetailsData = await videoDetailsResponse.json()

    // 채널 정보 조회 (구독자 수 등)
    const channelIds = videoDetailsData.items?.map((item: any) => item.snippet.channelId).join(',') || ''
    let channelData: any = { items: [] }

    if (channelIds) {
      const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels')
      channelUrl.searchParams.append('key', apiKey)
      channelUrl.searchParams.append('id', channelIds)
      channelUrl.searchParams.append('part', 'statistics')

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
