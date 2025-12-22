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

    // ✅ 할당량이 없거나 제한된 경우
    if (!usageCheck.allowed) {

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

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    let targetCount = parseInt(searchParams.get('count') || '40')
    const uploadDate = searchParams.get('upload_date') || 'week'
    const channel = searchParams.get('channel') || undefined

    // 비디오 길이 필터 (short → shorts, long → video, channel → channel)
    const videoLengthParam = searchParams.get('video_length') || 'long'
    const videoTypeMap: Record<string, 'video' | 'shorts' | 'channel'> = {
      'short': 'shorts',
      'long': 'video',
      'channel': 'channel',
    }
    const videoType = videoTypeMap[videoLengthParam] || 'video'

    if (!query || query.length < 1 || query.length > 100) {
      return NextResponse.json(
        { error: '검색어는 1-100자 사이여야 합니다' },
        { status: 400 }
      )
    }

    if (isNaN(targetCount) || targetCount < 1 || targetCount > 100) {
      targetCount = 40
    }

    let items
    let searchTime = 0
    try {
      const searchStartTime = Date.now()

      // 검색 API 호출 (비디오 타입, 채널 파라미터 전달)
      items = await searchYouTubeWithRapidAPI(query, targetCount, uploadDate, channel, videoType)

      searchTime = Date.now() - searchStartTime

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

      const uniqueIds = new Set<string>()
      let duplicateCount = 0
      items = items.filter((video) => {
        if (uniqueIds.has(video.id)) {
          duplicateCount++
          return false
        }
        uniqueIds.add(video.id)
        return true
      })

      const channelIds = [...new Set(items.map((v) => v.channelId).filter(Boolean))]

      let channelInfoMap = new Map<string, { subscriberCount: number }>()
      if (channelIds.length > 0) {
        try {
          channelInfoMap = await getChannelsInfo(channelIds)
        } catch (channelsError) {
          // 채널 정보 조회 실패 시 계속 진행
        }
      }
      items = items.map((item) => {
        const channelInfo = channelInfoMap.get(item.channelId) || { subscriberCount: 0 }
        const finalSubscriberCount = channelInfo.subscriberCount > 0
          ? channelInfo.subscriberCount
          : item.subscriberCount

        return {
          ...item,
          subscriberCount: finalSubscriberCount,
        }
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '검색 중 오류 발생'

      // APIError 인 경우 상태 코드 확인
      const statusCode = (error as any).statusCode || 500
      const isRateLimitError = statusCode === 429
      const isAuthError = statusCode === 401 || statusCode === 403

      // 429 에러: 이미 API에서 처리함
      if (isRateLimitError) {
        return NextResponse.json(
          {
            error: 'SEARCH_RATE_LIMITED',
            message: 'API 호출이 제한되었습니다. 잠시 후 다시 시도해주세요.',
          },
          { status: 429 }
        )
      }

      // 401/403 에러
      if (isAuthError) {
        return NextResponse.json(
          {
            error: 'SEARCH_AUTH_ERROR',
            message: '인증 오류가 발생했습니다. 다시 로그인해주세요.',
          },
          { status: statusCode }
        )
      }

      // 기타 에러
      return NextResponse.json(
        {
          error: 'SEARCH_FAILED',
          message: errorMessage,
        },
        { status: statusCode }
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
      .catch(() => {
        // API 사용량 증가 실패 시 무시
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
    return NextResponse.json(
      {
        error: '서버 에러가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 에러'
      },
      { status: 500 }
    )
  }
}
