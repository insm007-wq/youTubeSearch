import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkApiUsage, incrementApiUsage } from '@/lib/apiUsage'
import { getRelatedVideos } from '@/lib/rapidApiClient'

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
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId 파라미터가 필요합니다' },
        { status: 400 }
      )
    }

    console.log(`🎬 관련 영상 조회 시작: videoId=${videoId}`)

    // ✅ RapidAPI /related 엔드포인트 사용
    let items
    try {
      const relatedStartTime = Date.now()

      items = await getRelatedVideos(videoId)
      console.log(`📊 RapidAPI /related 응답: ${items.length}개 항목`)

      // 조회수 기준 내림차순 정렬
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

      const relatedTime = Date.now() - relatedStartTime

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

      // 비동기로 API 사용량 증가 (응답은 즉시 반환)
      incrementApiUsage(userEmail, `related:${videoId}`)
        .catch(() => {
          // API 사용량 증가 실패 시 무시
        })

      return NextResponse.json({
        items,
        totalResults: items.length,
        videoId,
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
          error: 'RELATED_VIDEOS_FAILED',
          message: error instanceof Error ? error.message : '관련 영상 조회 중 오류 발생',
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
