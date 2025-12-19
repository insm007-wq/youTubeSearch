import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkApiUsage, incrementApiUsage } from '@/lib/apiUsage'
import { getTrendingVideos, getChannelsInfo } from '@/lib/rapidApiClient'

export async function GET(request: NextRequest) {
  const requestStartTime = Date.now()

  try {
    // ✅ 인증 확인
    let session
    try {
      session = await auth()
    } catch (authError) {
      return NextResponse.json(
        { error: '인증 처리 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }

    if (!session?.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다. 로그인해주세요.' },
        { status: 401 }
      )
    }

    const userEmail = session.user.email || 'unknown@example.com'

    // ✅ API 사용량 확인
    let usageCheck
    try {
      usageCheck = await checkApiUsage(userEmail)
    } catch (usageError) {
      return NextResponse.json(
        { error: 'API 사용량 확인 중 오류 발생' },
        { status: 500 }
      )
    }

    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: 'QUOTA_EXCEEDED',
          message: `오늘 검색 가능한 횟수(${usageCheck.limit}회)를 모두 사용했습니다`,
          apiUsageToday: {
            used: usageCheck.used,
            limit: usageCheck.limit,
            remaining: usageCheck.remaining,
          },
          resetTime: usageCheck.resetTime,
        },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sectionParam = searchParams.get('section') || 'now-kr'

    // section 파싱: "now-kr" → type="now", geo="KR"
    const [type, geo] = sectionParam.split('-')

    // ✅ RapidAPI /trending 엔드포인트 사용
    let items
    try {
      const trendingStartTime = Date.now()

      // RapidAPI /trending 엔드포인트로 조회
      items = await getTrendingVideos(type, geo.toUpperCase())

      // 최근 7일 이내의 영상만 필터링
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      items = items.filter((video) => {
        const publishDate = new Date(video.publishedAt || '')
        return publishDate >= sevenDaysAgo
      })

      // 조회수 기준 내림차순 정렬 (높은 조회수가 먼저)
      items.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))

      // 중복 제거 (같은 video.id가 있으면 제거)
      const uniqueIds = new Set<string>()
      items = items.filter((video) => {
        if (uniqueIds.has(video.id)) {
          return false
        }
        uniqueIds.add(video.id)
        return true
      })

      const trendingTime = Date.now() - trendingStartTime

      if (!items || items.length === 0) {
        return NextResponse.json({
          items: [],
          totalResults: 0,
          apiUsageToday: {
            used: usageCheck.used,
            limit: usageCheck.limit,
            remaining: usageCheck.remaining,
          },
          resetTime: usageCheck.resetTime,
        })
      }

      // 2️⃣ 고유 채널 ID 추출
      const channelStart = Date.now()
      const channelIds = [...new Set(items.map((v) => v.channelId).filter(Boolean))]
      const channelExtractTime = Date.now() - channelStart

      // 3️⃣ 채널 정보 조회
      let channelInfoMap = new Map<string, { subscriberCount: number; country: string | null }>()
      const channelsStartTime = Date.now()
      if (channelIds.length > 0) {
        try {
          channelInfoMap = await getChannelsInfo(channelIds)
        } catch (channelsError) {
          // 채널 정보 조회 실패 시 계속 진행
        }
      }

      // 4️⃣ 데이터 병합
      const mergeStart = Date.now()
      items = items.map((item) => {
        const channelInfo = channelInfoMap.get(item.channelId) || { subscriberCount: 0, country: null }
        return {
          ...item,
          subscriberCount: channelInfo.subscriberCount,
          channelCountry: channelInfo.country,
        }
      })

      // 비동기로 API 사용량 증가 (응답은 즉시 반환)
      incrementApiUsage(userEmail, `trending:${sectionParam}`)
        .catch(() => {
          // API 사용량 증가 실패 시 무시
        })

      return NextResponse.json({
        items,
        totalResults: items.length,
        section: sectionParam,
        apiUsageToday: {
          used: usageCheck.used,
          limit: usageCheck.limit,
          remaining: usageCheck.remaining,
        },
        resetTime: usageCheck.resetTime,
      })
    } catch (error) {
      return NextResponse.json(
        {
          error: 'TRENDING_FAILED',
          message: error instanceof Error ? error.message : '트렌딩 조회 중 오류 발생',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: '서버 에러가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 에러',
      },
      { status: 500 }
    )
  }
}
