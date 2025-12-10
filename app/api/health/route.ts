import { NextRequest, NextResponse } from 'next/server'
import { getQueueStatus, getConfig } from '@/lib/rapidApiClient'

/**
 * API 상태 및 모니터링 엔드포인트
 * 동접 상태, 큐 길이 등 모니터링에 사용
 */
export async function GET(request: NextRequest) {
  try {
    const queueStatus = getQueueStatus()
    const config = getConfig()

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      api: {
        queue: queueStatus,
        config: {
          maxConcurrentRequests: config.MAX_CONCURRENT_REQUESTS,
          requestTimeout: config.REQUEST_TIMEOUT,
          retryCount: config.RETRY_COUNT,
          shortsBatchSize: config.SHORTS_BATCH_SIZE,
        },
        health: {
          activeRequests: queueStatus.activeRequests,
          queuedRequests: queueStatus.queuedRequests,
          utilizationPercent: Math.round(
            (queueStatus.activeRequests / queueStatus.maxConcurrent) * 100
          ),
          readiness:
            queueStatus.activeRequests < queueStatus.maxConcurrent
              ? 'ready'
              : 'busy',
        },
      },
    }

    return NextResponse.json(health)
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
