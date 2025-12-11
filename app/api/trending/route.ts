import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkApiUsage, incrementApiUsage } from '@/lib/apiUsage'
import { searchYouTubeWithRapidAPI } from '@/lib/rapidApiClient'
import { getChannelsInfo } from '@/lib/youtubeChannelsClient'

export async function GET(request: NextRequest) {
  const requestStartTime = Date.now()

  try {
    // ✅ 인증 확인
    let session
    try {
      session = await auth()
    } catch (authError) {
      console.error('❌ auth() 호출 실패:', authError)
      return NextResponse.json(
        { error: '인증 처리 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }

    if (!session?.user) {
      console.log('⚠️  세션 없음 - 로그인 필요')
      return NextResponse.json(
        { error: '인증이 필요합니다. 로그인해주세요.' },
        { status: 401 }
      )
    }

    const userEmail = session.user.email || 'unknown@example.com'
    console.log(`🔥 트렌딩 API 호출 - email: ${userEmail}`)

    // ✅ API 사용량 확인
    let usageCheck
    try {
      usageCheck = await checkApiUsage(userEmail)
    } catch (usageError) {
      console.error('❌ checkApiUsage 호출 실패:', usageError)
      return NextResponse.json(
        { error: 'API 사용량 확인 중 오류 발생' },
        { status: 500 }
      )
    }

    if (!usageCheck.allowed) {
      console.log(`❌ 트렌딩 거부 - allowed: ${usageCheck.allowed}`)
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

    console.log(`✅ 트렌딩 허용 - used: ${usageCheck.used}/${usageCheck.limit}`)

    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') || 'Now'

    // ✅ 조회수가 높은 트렌딩 영상 조회 (최근 7일 이내)
    let items
    try {
      const trendingStartTime = Date.now()
      console.log(`🔥 트렌딩 조회 시작 - section: ${section}`)

      // 섹션별 검색어 매핑
      const sectionQueryMap: Record<string, string> = {
        'Now': '유튜브',
        'Music': '음악',
        'Gaming': '게임',
        'Movies': '영화',
        'News': '뉴스',
        'Sports': '스포츠',
        'Education': '교육',
        'Technology': '기술',
        'Arts': '예술',
        'Food': '음식',
        'Fitness': '피트니스'
      }
      const query = sectionQueryMap[section] || '유튜브'

      // 조회수가 높은 영상들을 검색 (조회수 기준 내림차순)
      items = await searchYouTubeWithRapidAPI(query, 50)

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

      console.log(`✅ 트렌딩 조회 완료 - query: ${query}, ${items.length}개 (최근 7일 이내, 조회수 기준 정렬, 중복 제거)`)
      const trendingTime = Date.now() - trendingStartTime
      console.log(`⏱️  [1단계] 트렌딩 영상: ${trendingTime}ms (${items.length}개)`)

      if (!items || items.length === 0) {
        console.log(`⚠️  트렌딩 결과 없음`)
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
      console.log(`⏱️  [2단계] 채널 추출: ${channelExtractTime}ms (${channelIds.length}개)`)

      // 3️⃣ 채널 정보 조회
      let channelInfoMap = new Map<string, { subscriberCount: number; country: string | null }>()
      const channelsStartTime = Date.now()
      if (channelIds.length > 0) {
        try {
          channelInfoMap = await getChannelsInfo(channelIds)
          const channelsTime = Date.now() - channelsStartTime
          console.log(`⏱️  [3단계] 채널 정보: ${channelsTime}ms (${channelInfoMap.size}/${channelIds.length}개)`)
        } catch (channelsError) {
          const channelsTime = Date.now() - channelsStartTime
          console.warn(`⚠️  [3단계] 채널 정보 조회 실패 (${channelsTime}ms):`, channelsError)
        }
      } else {
        console.log(`⏱️  [3단계] 채널 정보: 0ms (채널 없음)`)
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
      const mergeTime = Date.now() - mergeStart
      console.log(`⏱️  [4단계] 병합: ${mergeTime}ms (${items.length}개)`)

      const totalTime = Date.now() - requestStartTime
      console.log(`✅ 트렌딩 완료 - 최종 ${items.length}개 (총 ${totalTime}ms)`)

      // 비동기로 API 사용량 증가 (응답은 즉시 반환)
      incrementApiUsage(userEmail, `trending:${section}`)
        .catch((error) => {
          console.warn(`⚠️  API 사용량 증가 실패:`, error)
        })

      return NextResponse.json({
        items,
        totalResults: items.length,
        section,
        apiUsageToday: {
          used: usageCheck.used,
          limit: usageCheck.limit,
          remaining: usageCheck.remaining,
        },
        resetTime: usageCheck.resetTime,
      })
    } catch (error) {
      const totalTime = Date.now() - requestStartTime
      console.error(`❌ 트렌딩 실패 (${totalTime}ms):`, error)
      return NextResponse.json(
        {
          error: 'TRENDING_FAILED',
          message: error instanceof Error ? error.message : '트렌딩 조회 중 오류 발생',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ 트렌딩 API 에러:', error)
    return NextResponse.json(
      {
        error: '서버 에러가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 에러',
      },
      { status: 500 }
    )
  }
}
