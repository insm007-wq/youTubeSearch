/**
 * RapidAPI YouTube V2 Channel Details 클라이언트 (Google API 대체)
 * 구독자 수 및 채널 정보 조회
 *
 * 기존 Google YouTube Data API에서 RapidAPI로 완전 전환
 * 인터페이스는 유지하여 호출부 변경 최소화
 */

import { RequestQueue } from '@/lib/utils/requestQueue'

const RAPIDAPI_BASE_URL = 'https://youtube-v2.p.rapidapi.com'
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST

// Phase 1 테스트 결과 확정 값들
const SUBSCRIBER_FIELD_NAME = 'subscriber_count' // 필드명 확정
const PARSE_FROM_STRING = true // 문자열에서 파싱 필요 ("454M subscribers" → 454000000)

// 동시성 제어 및 최적화 설정
const CONFIG = {
  MAX_CONCURRENT_REQUESTS: 20, // 동시 요청 수 (2배 증가)
  REQUEST_TIMEOUT: 15000, // 15초
  RETRY_COUNT: 2,
  RETRY_DELAY: 1000, // 1초
  RATE_LIMIT_DELAY: 100, // 요청 간 최소 간격
}

// ============ 인터페이스 정의 ============

interface YouTubeChannel {
  id: string
  title: string
  subscriberCount: number
  viewCount: number
  videoCount: number
  description: string
  thumbnail: string
  banner: string
  country: string | null
  verified: boolean
}

interface RapidAPIChannelDetailsResponse {
  channel_id: string
  title: string | null
  description: string | null
  subscriber_count: string | null // "454M subscribers" 형식
  video_count: string | null // "929 videos" 형식
  view_count: string | null // "102,990,519,473 views" 형식
  avatar: Array<{ url: string; width?: number; height?: number }> | null
  banner: Array<{ url: string; width?: number; height?: number }> | null
  verified: boolean
  has_business_email: boolean
  links: Array<{ name: string; endpoint: string }> | null
  country: string | null
  creation_date: string | null
}

// ============ RequestQueue 클래스 (동시성 제어) ============

const requestQueue = new RequestQueue(CONFIG.MAX_CONCURRENT_REQUESTS)

// ============ 채널 정보 캐싱 (In-Memory) ============

interface CacheEntry {
  subscriberCount: number
  country: string | null
  timestamp: number
}

const channelCache = new Map<string, CacheEntry>()
const CACHE_TTL = 15 * 60 * 1000 // 15분

function getCachedChannelInfo(channelId: string): CacheEntry | null {
  const cached = channelCache.get(channelId)
  if (!cached) return null

  const now = Date.now()
  if (now - cached.timestamp > CACHE_TTL) {
    // 캐시 만료됨
    channelCache.delete(channelId)
    return null
  }

  return cached
}

function setCacheChannelInfo(
  channelId: string,
  subscriberCount: number,
  country: string | null
): void {
  channelCache.set(channelId, {
    subscriberCount,
    country,
    timestamp: Date.now(),
  })
}

// ============ 재시도 로직 ============

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = CONFIG.RETRY_COUNT,
  delay = CONFIG.RETRY_DELAY
): Promise<T> {
  try {
    return await fn()
  } catch (error: any) {
    if (retries <= 0) throw error

    // 429 또는 5xx 에러만 재시도
    const shouldRetry =
      error.status === 429 || (error.status >= 500 && error.status < 600)

    if (shouldRetry) {
      console.warn(`⚠️  재시도 (${retries}회 남음): ${error.message}`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return withRetry(fn, retries - 1, delay * 2)
    }

    throw error
  }
}

// ============ 구독자 수 파싱 함수 ============

/**
 * "454M subscribers" 형식의 문자열을 숫자로 변환
 * 예: "454M subscribers" → 454000000
 *     "110M subscribers" → 110000000
 *     "4.6K videos" → 4600
 */
function parseSubscriberCount(raw: string | null | undefined): number {
  if (!raw || typeof raw !== 'string') {
    return 0
  }

  // 숫자만 추출
  const match = raw.match(/^([\d.]+)/)
  if (!match || !match[1]) {
    return 0
  }

  const num = parseFloat(match[1])

  // 단위 추출 (M, K, B)
  const unit = raw.match(/([MKB])/)?.[1]?.toUpperCase()

  switch (unit) {
    case 'B': // Billion
      return Math.round(num * 1000000000)
    case 'M': // Million
      return Math.round(num * 1000000)
    case 'K': // Thousand
      return Math.round(num * 1000)
    default:
      return Math.round(num)
  }
}

function parseVideoCount(raw: string | null | undefined): number {
  if (!raw || typeof raw !== 'string') {
    return 0
  }

  const match = raw.match(/^([\d.]+)/)
  if (!match || !match[1]) {
    return 0
  }

  const num = parseFloat(match[1])
  const unit = raw.match(/([MKB])/)?.[1]?.toUpperCase()

  switch (unit) {
    case 'B':
      return Math.round(num * 1000000000)
    case 'M':
      return Math.round(num * 1000000)
    case 'K':
      return Math.round(num * 1000)
    default:
      return Math.round(num)
  }
}

function parseViewCount(raw: string | null | undefined): number {
  if (!raw || typeof raw !== 'string') {
    return 0
  }

  // "102,990,519,473 views" 형식에서 숫자만 추출
  const num = raw.replace(/[^0-9.]/g, '')
  return parseInt(num, 10) || 0
}

// ============ 핵심 함수 ============

/**
 * 단일 채널 상세 정보 조회 (RapidAPI)
 */
async function fetchChannelDetails(
  channelId: string
): Promise<YouTubeChannel | null> {
  return requestQueue.enqueue(async () => {
    try {
      const url = new URL(`${RAPIDAPI_BASE_URL}/channel/details`)
      url.searchParams.append('channel_id', channelId)

      const response = await withRetry(async () => {
        const res = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY || '',
            'x-rapidapi-host': RAPIDAPI_HOST || '',
          },
          signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT),
        })

        // RapidAPI는 200으로 에러도 반환하므로 응답 내용 확인
        if (!res.ok) {
          const error: any = new Error(`HTTP ${res.status}`)
          error.status = res.status
          throw error
        }

        return res
      })

      const data: RapidAPIChannelDetailsResponse = await response.json()

      // 채널이 없거나 데이터가 없으면 null 반환
      if (!data.channel_id || data.title === null) {
        console.warn(`⚠️  채널 데이터 없음 (${channelId})`)
        return null
      }

      // 구독자 수 파싱
      const subscriberCount = parseSubscriberCount(data.subscriber_count)
      const videoCount = parseVideoCount(data.video_count)
      const viewCount = parseViewCount(data.view_count)

      // 썸네일 추출 (중간 크기 우선, 없으면 첫 번째)
      const thumbnail =
        data.avatar?.[1]?.url || data.avatar?.[0]?.url || ''

      // 배너 추출 (첫 번째)
      const banner = data.banner?.[0]?.url || ''

      return {
        id: data.channel_id,
        title: data.title || '',
        subscriberCount,
        viewCount,
        videoCount,
        description: data.description || '',
        thumbnail,
        banner,
        country: data.country || null,
        verified: data.verified || false,
      }
    } catch (error) {
      console.warn(`⚠️  채널 조회 실패 (${channelId}):`, error)
      // 부분 실패 허용: null 반환 (검색 전체 실패 방지)
      return null
    }
  })
}

/**
 * 여러 채널 구독자 수 조회 (Google API 호환 인터페이스)
 * @param channelIds 채널 ID 배열
 * @returns 채널 ID -> 구독자 수 Map
 */
export async function getChannelsSubscriberCounts(
  channelIds: string[]
): Promise<Map<string, number>> {
  const startTime = Date.now()

  if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
    console.warn(
      '⚠️  RAPIDAPI_KEY 또는 RAPIDAPI_HOST가 설정되지 않았습니다'
    )
    return new Map()
  }

  if (channelIds.length === 0) {
    return new Map()
  }

  console.log(
    `📊 RapidAPI로 ${channelIds.length}개 채널 구독자 수 조회 중...`
  )

  try {
    // Promise.all로 동시 요청 (RequestQueue가 동시성 제어)
    const results = await Promise.all(
      channelIds.map(id => fetchChannelDetails(id))
    )

    // Map 생성
    const map = new Map<string, number>()
    results.forEach((channel, index) => {
      if (channel) {
        map.set(channelIds[index], channel.subscriberCount)
      } else {
        // 실패한 채널도 맵에 추가 (구독자 수 0)
        map.set(channelIds[index], 0)
      }
    })

    const elapsedTime = Date.now() - startTime
    const successCount = results.filter(r => r !== null).length
    console.log(
      `✅ 구독자 수 조회 완료 (${elapsedTime}ms) - ${successCount}/${channelIds.length}개 성공`
    )

    return map
  } catch (error) {
    console.error(`❌ RapidAPI 채널 조회 실패:`, error)
    // 빈 Map 반환 (검색 자체는 계속 진행)
    return new Map()
  }
}

/**
 * 여러 채널 정보 조회 (구독자 수, 국가 등) - 캐싱 지원
 * @param channelIds 채널 ID 배열
 * @returns 채널 ID -> 채널 정보 Map
 */
export async function getChannelsInfo(
  channelIds: string[]
): Promise<Map<string, { subscriberCount: number; country: string | null }>> {
  const startTime = Date.now()

  if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
    console.warn(
      '⚠️  RAPIDAPI_KEY 또는 RAPIDAPI_HOST가 설정되지 않았습니다'
    )
    return new Map()
  }

  if (channelIds.length === 0) {
    return new Map()
  }

  // 1단계: 캐시에서 조회
  const result = new Map<string, { subscriberCount: number; country: string | null }>()
  const uncachedIds: string[] = []
  let cacheHits = 0

  channelIds.forEach(id => {
    const cached = getCachedChannelInfo(id)
    if (cached) {
      result.set(id, {
        subscriberCount: cached.subscriberCount,
        country: cached.country,
      })
      cacheHits++
    } else {
      uncachedIds.push(id)
    }
  })

  console.log(`📊 채널 정보 조회 시작 - 캐시: ${cacheHits}/${channelIds.length}개 히트, API 요청: ${uncachedIds.length}개`)

  // 2단계: 캐시 미스 항목만 API 요청
  if (uncachedIds.length > 0) {
    try {
      // Promise.all로 동시 요청 (RequestQueue가 동시성 제어)
      const results = await Promise.all(
        uncachedIds.map(id => fetchChannelDetails(id))
      )

      // 결과 병합 및 캐시 저장
      results.forEach((channel, index) => {
        const channelId = uncachedIds[index]
        if (channel) {
          result.set(channelId, {
            subscriberCount: channel.subscriberCount,
            country: channel.country,
          })
          // 캐시에 저장
          setCacheChannelInfo(channelId, channel.subscriberCount, channel.country)
        } else {
          // 실패한 채널도 맵에 추가
          result.set(channelId, {
            subscriberCount: 0,
            country: null,
          })
          // 실패한 항목도 캐시 (0 구독자)
          setCacheChannelInfo(channelId, 0, null)
        }
      })

      const apiTime = Date.now() - startTime
      const successCount = results.filter(r => r !== null).length
      console.log(
        `✅ 채널 정보 조회 완료 (${apiTime}ms) - API 요청: ${successCount}/${uncachedIds.length}개 성공, 캐시 히트: ${cacheHits}개`
      )
    } catch (error) {
      console.error(`❌ RapidAPI 채널 조회 실패:`, error)
    }
  } else {
    const cacheTime = Date.now() - startTime
    console.log(`✅ 채널 정보 조회 완료 (${cacheTime}ms) - 캐시만 사용 (모두 히트)`)
  }

  return result
}

/**
 * 단일 채널 상세 정보 조회 (Google API 호환 인터페이스)
 */
export async function getChannelInfo(
  channelId: string
): Promise<YouTubeChannel | null> {
  if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
    throw new Error(
      'RAPIDAPI_KEY 또는 RAPIDAPI_HOST가 설정되지 않았습니다'
    )
  }

  console.log(`📊 RapidAPI로 채널 정보 조회: ${channelId}`)

  try {
    const channel = await fetchChannelDetails(channelId)
    return channel
  } catch (error) {
    console.error(`❌ 채널 조회 실패 (${channelId}):`, error)
    return null
  }
}

// ============ 유틸리티 함수 (테스트용) ============

/**
 * 동시 요청 수 조정 (성능 최적화)
 */
export function setMaxConcurrentRequests(max: number) {
  CONFIG.MAX_CONCURRENT_REQUESTS = max
  console.log(`⚙️  동시 요청 수 변경: ${max}`)
}

/**
 * 구독자 수 파싱 테스트 (개발용)
 */
export function testParseSubscriberCount(input: string): number {
  return parseSubscriberCount(input)
}
