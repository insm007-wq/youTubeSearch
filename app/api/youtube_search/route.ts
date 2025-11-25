import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkApiUsage, incrementApiUsage } from '@/lib/apiUsage'

// YouTube 카테고리 ID 매핑 (lucide-react 아이콘명)
const YOUTUBE_CATEGORIES: Record<string, { name: string; icon: string }> = {
  '1': { name: '영화', icon: 'Film' },
  '2': { name: '자동차', icon: 'Car' },
  '10': { name: '음악', icon: 'Music' },
  '15': { name: '애완동물', icon: 'PawPrint' },
  '17': { name: '스포츠', icon: 'Trophy' },
  '18': { name: '단편영화', icon: 'Film' },
  '19': { name: '여행', icon: 'Plane' },
  '20': { name: '게임', icon: 'Gamepad2' },
  '21': { name: '블로깅', icon: 'Video' },
  '22': { name: '내용', icon: 'Tv' },
  '23': { name: '광고', icon: 'Megaphone' },
  '24': { name: '클래식', icon: 'Music' },
  '25': { name: '코미디', icon: 'Smile' },
  '26': { name: '뉴스', icon: 'Newspaper' },
  '27': { name: '쇼핑', icon: 'ShoppingBag' },
  '28': { name: '기술', icon: 'Cpu' },
  '29': { name: 'B-영화', icon: 'Film' },
  '30': { name: '뮤직비디오', icon: 'Music' },
  '31': { name: '영화 예고편', icon: 'Clapperboard' },
  '32': { name: '이벤트', icon: 'Calendar' },
  '33': { name: '영상', icon: 'Video' },
  '34': { name: '영상', icon: 'Video' },
  '35': { name: '영상', icon: 'Video' },
  '36': { name: '영상', icon: 'Video' },
  '37': { name: '영상', icon: 'Video' },
  '38': { name: '영상', icon: 'Video' },
  '39': { name: '영상', icon: 'Video' },
  '40': { name: '영상', icon: 'Video' },
  '41': { name: '교육', icon: 'BookOpen' },
  '42': { name: '과학기술', icon: 'Microscope' },
  '43': { name: '소재', icon: 'Palette' },
  '44': { name: '단편영화', icon: 'Film' },
  '45': { name: '트레일러', icon: 'PlayCircle' },
  '46': { name: '팟캐스트', icon: 'Mic2' },
}

function getCategoryInfo(categoryId: string) {
  return YOUTUBE_CATEGORIES[categoryId] || { name: '기타', icon: 'Video' }
}

export async function GET(request: NextRequest) {
  try {
    // ✅ 인증 확인 및 사용자 정보 추출
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다. 로그인해주세요.' },
        { status: 401 }
      )
    }

    const userEmail = session.user.email || 'unknown@example.com'

    console.log(`🔍 검색 API 호출 - email: ${userEmail}`)

    // ✅ API 사용량 확인
    const usageCheck = await checkApiUsage(userEmail)
    console.log(`📊 사용량 확인 - used: ${usageCheck.used}, limit: ${usageCheck.limit}, allowed: ${usageCheck.allowed}`)

    // ✅ 할당량이 없거나 제한된 경우
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: '검색할 수 없습니다',
          message: usageCheck.limit === 0
            ? '계정이 비활성화되었습니다. 관리자에게 문의하세요.'
            : `오늘 검색 가능한 횟수(${usageCheck.limit}회)를 모두 사용했습니다`,
          apiUsageToday: {
            used: usageCheck.used,
            limit: usageCheck.limit,
            remaining: usageCheck.remaining
          },
          resetTime: usageCheck.resetTime
        },
        { status: usageCheck.limit === 0 ? 403 : 429 }
      )
    }


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

    // ✅ 비디오 상세 정보 조회 (조회수, 좋아요, 카테고리 등)
    const videoDetailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    videoDetailsUrl.searchParams.append('part', 'statistics,contentDetails,snippet,topicDetails')
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
      const categoryId = video.snippet?.categoryId || ''
      const categoryInfo = getCategoryInfo(categoryId)

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
        categoryId,
        categoryName: categoryInfo.name,
        categoryIcon: categoryInfo.icon,
      }
    }) || []

    // ✅ API 사용량 증가
    const updatedUsage = await incrementApiUsage(userEmail, query)

    return NextResponse.json({
      items,
      totalResults: data.pageInfo?.totalResults || 0,
      apiUsageToday: {
        used: updatedUsage.used,
        limit: updatedUsage.limit,
        remaining: updatedUsage.remaining
      },
      resetTime: updatedUsage.resetTime
    })
  } catch (error) {
    console.error('❌ YouTube 검색 API 에러:', error)

    // 상세 에러 로깅
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message)
      console.error('에러 스택:', error.stack)
    }

    return NextResponse.json(
      {
        error: '서버 에러가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 에러'
      },
      { status: 500 }
    )
  }
}
