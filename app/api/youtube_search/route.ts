import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkApiUsage, incrementApiUsage } from '@/lib/apiUsage'
import { searchYouTubeWithRapidAPI, getChannelsInfo } from '@/lib/rapidApiClient'

export async function GET(request: NextRequest) {
  const requestStartTime = Date.now()

  try {
    // ✅ 인증 확인 및 사용자 정보 추출
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
    console.log(`🔍 검색 API 호출 - email: ${userEmail}`)

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
    console.log(`📊 사용량 확인:`, {
      email: userEmail,
      used: usageCheck.used,
      limit: usageCheck.limit,
      remaining: usageCheck.remaining,
      allowed: usageCheck.allowed
    })

    // ✅ 할당량이 없거나 제한된 경우
    if (!usageCheck.allowed) {
      console.log(`❌ 검색 거부 - allowed: ${usageCheck.allowed}, limit: ${usageCheck.limit}`)

      let statusCode: number
      let errorType: string
      let message: string

      // ✅ limit 값으로 에러 타입 구분
      if (usageCheck.limit === -1) {
        // 사용자 없음 (자동 복구 실패)
        statusCode = 401
        errorType = 'USER_NOT_FOUND'
        message = '사용자 정보를 확인할 수 없습니다. 로그아웃 후 다시 로그인해주세요.'
      } else if (usageCheck.limit === 0) {
        // 비활성화/차단
        statusCode = 403
        errorType = 'ACCOUNT_DEACTIVATED'
        message = '계정이 비활성화되었습니다. 관리자에게 문의하세요.'
      } else {
        // 할당량 소진
        statusCode = 429
        errorType = 'QUOTA_EXCEEDED'
        message = `오늘 검색 가능한 횟수(${usageCheck.limit}회)를 모두 사용했습니다`
      }

      console.log(`  → Status: ${statusCode}, Type: ${errorType}, Message: ${message}`)

      return NextResponse.json(
        {
          error: errorType,
          message,
          apiUsageToday: {
            used: usageCheck.used,
            limit: usageCheck.limit,
            remaining: usageCheck.remaining
          },
          resetTime: usageCheck.resetTime
        },
        { status: statusCode }
      )
    }

    console.log(`✅ 검색 허용 - used: ${usageCheck.used}/${usageCheck.limit}`)


    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    let targetCount = parseInt(searchParams.get('count') || '40')  // 기본값: 40개 (YT-API Pagination)

    // ✅ 입력값 검증
    if (!query || query.length < 1 || query.length > 100) {
      return NextResponse.json(
        { error: '검색어는 1-100자 사이여야 합니다' },
        { status: 400 }
      )
    }

    // ✅ count 범위 검증 (1-100)
    if (isNaN(targetCount) || targetCount < 1 || targetCount > 100) {
      targetCount = 40
    }

    // ✅ RapidAPI + Google을 통한 YouTube 검색 (병렬 처리)
    let items
    try {
      const searchStartTime = Date.now()
      console.log(`🔍 RapidAPI 검색 시작 - query: ${query}`)

      // 1️⃣ RapidAPI로 검색 (Pagination으로 targetCount개 확보)
      const rapidApiStart = Date.now()
      items = await searchYouTubeWithRapidAPI(query, targetCount)
      const rapidApiTime = Date.now() - rapidApiStart
      console.log(`⏱️  [1단계] RapidAPI: ${rapidApiTime}ms (${items.length}개, targetCount: ${targetCount})`)

      if (!items || items.length === 0) {
        console.log(`⚠️  검색 결과 없음`)
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

      // 1-1️⃣ 중복 제거 (같은 video.id가 있으면 제거)
      const uniqueIds = new Set<string>()
      items = items.filter((video) => {
        if (uniqueIds.has(video.id)) {
          return false
        }
        uniqueIds.add(video.id)
        return true
      })
      console.log(`✅ 중복 제거 완료 - 최종 ${items.length}개`)

      // 2️⃣ 고유 채널 ID 추출 (빠름)
      const channelStart = Date.now()
      const channelIds = [...new Set(items.map((v) => v.channelId).filter(Boolean))]
      const channelExtractTime = Date.now() - channelStart
      console.log(`⏱️  [2단계] 채널 추출: ${channelExtractTime}ms (${channelIds.length}개)`)

      // 3️⃣ 채널 정보 조회 (구독자 수, 국가 등) - 동시에 모든 채널 요청
      let channelInfoMap = new Map<string, { subscriberCount: number; country: string | null }>()
      const channelsStartTime = Date.now()
      if (channelIds.length > 0) {
        try {
          // getChannelsInfo 내부에서 Promise.all로 모든 채널을 동시에 요청
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

      // 4️⃣ 데이터 병합 (구독자 수, 국가 추가)
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
      console.log(`⏱️  [4단계] 병합: ${mergeTime}ms (${items.length}개) (중복 제거 후)`)

      const searchTime = Date.now() - searchStartTime
      console.log(`✅ 검색 완료 - 최종 ${items.length}개 (총 ${searchTime}ms)`)
      console.log(`📊 최적화: getChannelsInfo 내부에서 Promise.all로 ${channelIds.length}개 채널 동시 요청`)
    } catch (error) {
      const searchTime = Date.now() - requestStartTime
      console.error(`❌ 검색 실패 (${searchTime}ms):`, error)
      return NextResponse.json(
        {
          error: 'SEARCH_FAILED',
          message: error instanceof Error ? error.message : '검색 중 오류 발생',
        },
        { status: 500 }
      )
    }

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

    // ✅ API 사용량 증가 (비동기 처리 - await 제거)
    // incrementApiUsage를 비동기로 처리하여 응답 시간 단축
    incrementApiUsage(userEmail, query)
      .catch((error) => {
        console.warn(`⚠️  API 사용량 증가 실패:`, error)
      })

    // 현재 사용량 정보 반환 (checkApiUsage에서 이미 조회함)
    // 실제 증가는 DB에서 비동기로 처리됨
    const projectedUsage = {
      used: usageCheck.used + 1,
      limit: usageCheck.limit,
      remaining: usageCheck.remaining - 1
    }

    return NextResponse.json({
      items,
      totalResults: items.length,
      apiUsageToday: projectedUsage,
      resetTime: usageCheck.resetTime
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
