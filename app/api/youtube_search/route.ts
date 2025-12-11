import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkApiUsage, incrementApiUsage } from '@/lib/apiUsage'
import { searchYouTubeWithRapidAPI } from '@/lib/rapidApiClient'
import { getChannelsInfo } from '@/lib/youtubeChannelsClient'

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
    let maxResults = parseInt(searchParams.get('maxResults') || '50')  // 기본값: 50개

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

    // ✅ RapidAPI + Google을 통한 YouTube 검색
    let items
    try {
      const searchStartTime = Date.now()
      console.log(`🔍 RapidAPI 검색 시작 - query: ${query}`)

      // 1️⃣ RapidAPI로 검색
      items = await searchYouTubeWithRapidAPI(query, maxResults)

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

      // 2️⃣ 고유 채널 ID 추출
      const channelIds = [...new Set(items.map((v) => v.channelId).filter(Boolean))]
      console.log(`📊 고유 채널: ${channelIds.length}개`)

      // 3️⃣ 채널 정보 조회 (구독자 수, 국가 등) (실패해도 무시)
      let channelInfoMap = new Map<string, { subscriberCount: number; country: string | null }>()
      if (channelIds.length > 0) {
        const channelsStartTime = Date.now()
        try {
          channelInfoMap = await getChannelsInfo(channelIds)
          const channelsTime = Date.now() - channelsStartTime
          console.log(`✅ 채널 정보 조회 완료 (${channelsTime}ms) - ${channelInfoMap.size}개`)
        } catch (channelsError) {
          console.warn(`⚠️  채널 정보 조회 실패:`, channelsError)
          // 실패해도 계속 진행
        }
      }

      // 4️⃣ 데이터 병합 (구독자 수, 국가 추가)
      items = items.map((item) => {
        const channelInfo = channelInfoMap.get(item.channelId) || { subscriberCount: 0, country: null }
        return {
          ...item,
          subscriberCount: channelInfo.subscriberCount,
          channelCountry: channelInfo.country,
        }
      })

      // 5️⃣ 중복 제거 (같은 videoId 제거)
      const seenIds = new Set<string>()
      items = items.filter((item) => {
        if (seenIds.has(item.id)) {
          return false
        }
        seenIds.add(item.id)
        return true
      })

      const searchTime = Date.now() - searchStartTime
      console.log(`✅ 검색 완료 - 결과: ${items.length}개 (${searchTime}ms)`)
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

    // ✅ API 사용량 증가
    const usageStartTime = Date.now()
    const updatedUsage = await incrementApiUsage(userEmail, query)
    const usageTime = Date.now() - usageStartTime

    return NextResponse.json({
      items,
      totalResults: items.length,
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
