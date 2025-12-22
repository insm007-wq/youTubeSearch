/**
 * RapidAPI YT-API 클라이언트
 * - 검색, 트렌딩, 채널 정보 등 모든 기능 제공
 * - 동접 500명 지원 설계
 * - RequestQueue를 통한 동시성 제어
 * - Rate-limiting 헤더 기반 자동 백오프
 * - API 응답 정규화 계층 사용
 * - Pagination 지원
 */

import { RequestQueue } from '@/lib/utils/requestQueue'
import { removeHashtagsFromText } from '@/lib/hashtagUtils'
import {
  normalizeVideo,
  normalizeChannelInfo,
  extractDataArray,
  filterShortsListing,
  normalizePublishedDate,
  NormalizedVideo,
  NormalizedChannelInfo,
} from '@/lib/apiResponseNormalizer'

// ============ 설정 ============
const API_BASE_URL = 'https://yt-api.p.rapidapi.com'
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = 'yt-api.p.rapidapi.com'

// 동접 500명 지원을 위한 설정
const CONFIG = {
  // API 속도 제한 (동접별 요청 큐)
  MAX_CONCURRENT_REQUESTS: 20, // 동시 요청 수
  REQUEST_TIMEOUT: 10000, // 요청 타임아웃 (10초)
  RETRY_COUNT: 3, // 재시도 횟수
  RETRY_DELAY: 500, // 초기 재시도 간격 (500ms, 지수 백오프 적용)

  // 캐싱 설정
  ENABLE_CACHING: true,
  CACHE_TTL: 3600000, // 1시간

  // Rate-limiting 설정
  RATE_LIMIT_DELAY: 2000, // Rate limit 시 기본 대기시간 (2초)
  MAX_RETRIES_ON_RATE_LIMIT: 5, // Rate limit 최대 재시도 횟수
}

// ============ 에러 추적 ============

/**
 * API 에러 클래스 (구조화된 로깅)
 */
class APIError extends Error {
  public headers?: Headers

  constructor(
    message: string,
    public statusCode: number = 500,
    public retryable: boolean = false,
    public context: Record<string, any> = {}
  ) {
    super(message)
    this.name = 'APIError'
  }

  toJSON() {
    return {
      error: this.message,
      statusCode: this.statusCode,
      retryable: this.retryable,
      context: this.context,
    }
  }
}

/**
 * 에러 로거 (구조화된 로깅)
 */
const errorLogger = {
  log: (level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => {
    const timestamp = new Date().toISOString()
    const structured = {
      timestamp,
      level,
      message,
      ...context,
    }
  },

  error: (message: string, error?: Error | APIError, context?: Record<string, any>) => {
    const errorObj = error instanceof APIError ? error.toJSON() : { message: error?.message }
    errorLogger.log('error', message, { error: errorObj, ...context })
  },

  warn: (message: string, context?: Record<string, any>) => {
    errorLogger.log('warn', message, context)
  },

  info: (message: string, context?: Record<string, any>) => {
    errorLogger.log('info', message, context)
  },
}

// ============ 인터페이스 ============

/**
 * ApifyDataItem 형식 (기존과 호환)
 */
export interface ApifyDataItem {
  id: string
  title: string
  description: string
  channelId: string
  channelTitle: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  duration: string
  subscriberCount: number
  thumbnail: string
  tags: string[]
  categoryId: string
  categoryName: string
  categoryIcon: string
  type: 'video' | 'shorts' | 'channel'
  videoCount?: number
  _needsDetailsFetch?: boolean
}

/**
 * 검색 응답 메타데이터
 */
export interface SearchMetadata {
  hasMore: boolean
  continuation?: string
  itemsReturned: number
  rateLimitRemaining?: number
  rateLimitReset?: number
}

// ============ 요청 큐 관리 ============
const requestQueue = new RequestQueue(CONFIG.MAX_CONCURRENT_REQUESTS)

// ============ 언어 감지 ============
/**
 * 검색어에서 언어를 감지하여 적절한 geo, lang을 반환
 */
function detectLanguageFromQuery(query: string): { geo: string; lang: string } {
  // 일본어 문자 범위 확인 (히라가나, 카타카나만 포함)
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/g
  const japaneseMatches = query.match(japaneseRegex) || []

  const queryLength = query.length
  const japaneseRatio = japaneseMatches.length / queryLength

  // 일본어 비율이 30% 이상이면 일본어로 간주
  if (japaneseRatio >= 0.3) {
    return { geo: 'JP', lang: 'ja' }
  }

  // 기본값: 한국어
  return { geo: 'KR', lang: 'ko' }
}

// ============ 채널 정보 캐싱 ============
interface CachedChannelInfo {
  subscriberCount: number
  country: string | null
  timestamp: number
}

const channelCache = new Map<string, CachedChannelInfo>()
const CHANNEL_CACHE_TTL = 15 * 60 * 1000 // 15분

function getCachedChannelInfo(channelId: string): CachedChannelInfo | null {
  const cached = channelCache.get(channelId)
  if (!cached) return null

  const now = Date.now()
  if (now - cached.timestamp > CHANNEL_CACHE_TTL) {
    channelCache.delete(channelId)
    return null
  }

  return cached
}

function setCachedChannelInfo(
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

// ============ Rate-Limiting 헤더 파싱 ============

/**
 * Rate-limiting 정보 추출
 */
function parseRateLimitHeaders(headers: Headers): {
  remaining: number
  reset: number
  limit: number
} {
  const remaining = parseInt(headers.get('x-ratelimit-requests-remaining') || '0', 10)
  const reset = parseInt(headers.get('x-ratelimit-requests-reset') || '0', 10)
  const limit = parseInt(headers.get('x-ratelimit-requests-limit') || '100', 10)

  return {
    remaining: isNaN(remaining) ? 0 : remaining,
    reset: isNaN(reset) ? 0 : reset,
    limit: isNaN(limit) ? 100 : limit,
  }
}

/**
 * 429 응답에서 Retry-After 헤더 추출
 */
function parseRetryAfter(headers: Headers): number {
  const retryAfter = headers.get('retry-after')
  if (!retryAfter) return CONFIG.RATE_LIMIT_DELAY

  // "120" (초) 또는 HTTP-date 형식
  const seconds = parseInt(retryAfter, 10)
  if (!isNaN(seconds)) {
    return seconds * 1000
  }

  // HTTP-date 형식 파싱
  try {
    const retryDate = new Date(retryAfter)
    const delay = retryDate.getTime() - Date.now()
    return Math.max(delay, CONFIG.RATE_LIMIT_DELAY)
  } catch {
    return CONFIG.RATE_LIMIT_DELAY
  }
}

// ============ 재시도 로직 (개선) ============

/**
 * 개선된 재시도 로직 (Rate-limiting 헤더 인식)
 */
async function withRetry<T>(
  fn: () => Promise<{ data: T; headers: Headers; metadata?: SearchMetadata }>,
  retries = CONFIG.RETRY_COUNT,
  delay = CONFIG.RETRY_DELAY,
  context: Record<string, any> = {}
): Promise<{ data: T; metadata?: SearchMetadata }> {
  try {
    return await fn()
  } catch (error: any) {
    if (retries <= 0) {
      errorLogger.error('최대 재시도 횟수 초과', error, {
        ...context,
        remainingRetries: retries,
      })
      throw error
    }

    // 재시도 가능 여부 판단
    const statusCode = error.statusCode || error.status
    const isRateLimitError = statusCode === 429
    const isServerError = statusCode >= 500 && statusCode < 600
    const isTimeout = error.message?.includes('timeout')

    if (!isRateLimitError && !isServerError && !isTimeout) {
      // 재시도 불가능한 에러
      errorLogger.error('재시도 불가능한 에러', error, context)
      throw error
    }

    // 재시도 전 대기
    let waitTime = delay
    if (isRateLimitError && error.headers) {
      waitTime = parseRetryAfter(error.headers)
      errorLogger.warn('Rate limit 감지 - 대기', {
        waitTime,
        retryAfter: error.headers.get('retry-after'),
        ...context,
      })
    } else {
      errorLogger.warn('재시도 예정', {
        statusCode,
        remainingRetries: retries - 1,
        waitTime,
        ...context,
      })
    }

    await new Promise(resolve => setTimeout(resolve, waitTime))

    // 지수 백오프: 다음 재시도는 더 오래 대기
    return withRetry(
      fn,
      retries - 1,
      delay * 2, // 지수 백오프
      { ...context, attemptNumber: CONFIG.RETRY_COUNT - retries + 1 }
    )
  }
}

// ============ API 호출 ============

/**
 * 안전한 fetch 래퍼 (에러 구조화)
 */
async function safeFetch(
  url: string,
  options: RequestInit & { context?: Record<string, any> } = {}
): Promise<{
  response: Response
  data: any
  metadata: SearchMetadata
}> {
  const { context = {}, ...fetchOptions } = options

  try {
    const response = await fetch(url, fetchOptions as RequestInit)

    // Rate-limit 정보 추출
    const rateLimitInfo = parseRateLimitHeaders(response.headers)

    if (!response.ok) {
      const error = new APIError(
        `HTTP ${response.status} ${response.statusText}`,
        response.status,
        response.status === 429 || response.status >= 500,
        { url, rateLimitInfo, ...context }
      )
      error.headers = response.headers
      throw error
    }

    const data = await response.json()

    const metadata: SearchMetadata = {
      hasMore: !!data.continuation,
      continuation: data.continuation,
      itemsReturned: data.itemsReturned || 0,
      rateLimitRemaining: rateLimitInfo.remaining,
      rateLimitReset: rateLimitInfo.reset,
    }

    return { response, data, metadata }
  } catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }

    // 네트워크 에러 등
    const apiError = new APIError(
      error.message || '알 수 없는 에러',
      0,
      true, // 네트워크 에러는 재시도 가능
      { url, originalError: error.message, ...context }
    )
    throw apiError
  }
}

/**
 * YT-API 검색 (Pagination 지원)
 * targetCount개의 영상을 얻을 때까지 여러 번 요청
 *
 * 최적화:
 * - upload_date=year: 최근 1년 이내 영상만 검색
 * - sort_by=relevance: 관련도순 정렬
 * - geo=KR, lang=ko, local=1: 한국 로컬라이제이션
 * - token으로 pagination 지원
 * - type: video, shorts 구분
 */
async function searchWithYTAPI(
  query: string,
  targetCount: number = 40,
  uploadDate: string = 'week', // 'hour' | 'today' | 'week' | 'month' | 'year'
  continuation?: string, // Pagination 토큰
  videoType: 'video' | 'shorts' | 'channel' = 'video', // 비디오 타입
  channel?: string // 채널 필터
): Promise<{
  items: NormalizedVideo[]
  metadata: SearchMetadata
}> {
  if (!RAPIDAPI_KEY) {
    throw new APIError('RapidAPI 키가 설정되지 않았습니다', 500, false)
  }

  const startTime = Date.now()
  const allItems: NormalizedVideo[] = []
  let currentContinuation = continuation
  let pageCount = 0
  let totalFetched = 0

  // 검색어의 언어 감지 (함수 시작 시 한 번만 수행)
  const { geo, lang } = detectLanguageFromQuery(query)

  try {
    // videoType에 따라 검색 타입 결정
    const searchTypes: ('video' | 'shorts' | 'channel')[] = [videoType]

    for (const searchType of searchTypes) {
      errorLogger.info(`🎬 [${searchType.toUpperCase()}] 검색 시작`, {
        query,
        targetCount,
        uploadDate,
        channel,
        detectedGeo: geo,
        detectedLang: lang,
      })

      // Pagination 루프
      while (totalFetched < targetCount && pageCount < 2) {
        pageCount++

        const fetchStart = Date.now()
        const url = new URL(`${API_BASE_URL}/search`)
        url.searchParams.append('query', query)
        url.searchParams.append('type', searchType)
        url.searchParams.append('upload_date', uploadDate)

        if (channel) {
          url.searchParams.append('channel', channel)
        }
        url.searchParams.append('sort_by', 'views')
        url.searchParams.append('geo', geo)
        url.searchParams.append('lang', lang)
        url.searchParams.append('local', '1')

        // 🔍 디버그: 전송될 URL 확인
        console.log(`🔍 RapidAPI 검색 URL (page ${pageCount}):`, url.toString().substring(0, 200))

        // Pagination 토큰
        if (currentContinuation) {
          url.searchParams.append('token', currentContinuation)
          errorLogger.info(`  📄 [${searchType} 페이지 ${pageCount}] 다음 페이지 요청`, {
            token: currentContinuation.substring(0, 20),
          })
        }

        const { data, metadata } = await withRetry(
          async () => {
            const result = await safeFetch(url.toString(), {
              method: 'GET',
              headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST,
              },
              signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT),
              context: { query, searchType, pageCount },
            })

            return {
              data: result.data,
              headers: result.response.headers,
              metadata: result.metadata,
            }
          },
          CONFIG.RETRY_COUNT,
          CONFIG.RETRY_DELAY,
          { query, searchType, pageCount }
        )

        const fetchTime = Date.now() - fetchStart

        // 응답에서 데이터 배열 추출
        let items: any[] = extractDataArray(data)

        console.log(`🔍 [검색/${searchType}] 페이지 ${pageCount}`)
        console.log(`🔍 extractDataArray 입력 (data):`, Object.keys(data))
        console.log(`🔍 extractDataArray 결과: ${items.length}개`)
        if (items.length > 0) {
          console.log(`🔍 첫 항목 구조:`, Object.keys(items[0]))
          console.log(`🔍 첫 항목 데이터:`, {
            type: items[0].type,
            videoId: items[0].videoId,
            title: items[0].title?.substring(0, 50),
          })
        }

        // Shorts listing 필터링
        items = filterShortsListing(items)

        // 정규화
        const normalizedItems = items
          .map((item, idx) => {
            try {
              // 🔍 첫 3개 항목의 상세 로깅
              if (idx < 3) {
                errorLogger.info(`📍 [${searchType} 항목 ${idx}] 정규화 전`, {
                  rawType: item.type,
                  rawIsShorts: item.isShorts,
                  rawTitle: item.title?.substring(0, 50),
                  rawDuration: item.duration,
                  rawLengthText: item.lengthText,
                })
              }

              const normalized = normalizeVideo(item)

              // 정규화 후 type 확인
              if (idx < 3) {
                errorLogger.info(`📍 [${searchType} 항목 ${idx}] 정규화 후`, {
                  normalizedType: normalized.type,
                  normalizedTitle: normalized.title.substring(0, 50),
                  normalizedDuration: normalized.duration,
                  publishedAt: normalized.publishedAt,
                })
              }

              return normalized
            } catch (error) {
              errorLogger.warn('비디오 정규화 실패', {
                error: error instanceof Error ? error.message : String(error),
                title: item.title?.substring(0, 30),
              })
              return null
            }
          })
          .filter((item): item is NormalizedVideo => item !== null)
          // ✅ 요청한 타입과 일치하는 항목만 필터링 (클라이언트 사이드 검증)
          .filter(item => {
            const matches =
              (searchType === 'video' && item.type === 'video') ||
              (searchType === 'shorts' && item.type === 'shorts') ||
              (searchType === 'channel' && item.type === 'channel')

            // 필터 실패한 항목 로깅
            if (!matches) {
              errorLogger.warn(`타입 필터 불일치`, {
                searchType,
                itemType: item.type,
                title: item.title.substring(0, 40),
              })
            }

            return matches
          })

        allItems.push(...normalizedItems)
        totalFetched += normalizedItems.length

        errorLogger.info(`  ✅ [${searchType} 페이지 ${pageCount}] ${normalizedItems.length}개 조회`, {
          fetchTime,
          totalFetched,
          rateLimitRemaining: metadata?.rateLimitRemaining,
        })

        // 다음 페이지 토큰 업데이트
        currentContinuation = metadata?.continuation
        if (!currentContinuation) {
          errorLogger.info(`  ⏹️  [${searchType}] 더 이상의 페이지 없음`, {
            totalPages: pageCount,
            itemsFetched: totalFetched,
          })
          break
        }

        // Rate limit 체크
        if (
          metadata?.rateLimitRemaining !== undefined &&
          metadata?.rateLimitRemaining < 5
        ) {
          errorLogger.warn('Rate limit 부족 - 검색 중단', {
            remaining: metadata?.rateLimitRemaining,
            itemsFetched: totalFetched,
          })
          break
        }

        // 충분히 수집했으면 중단
        if (totalFetched >= targetCount) {
          break
        }
      }
    }

    const totalTime = Date.now() - startTime

    errorLogger.info(`✅ YT-API 검색 완료`, {
      query,
      itemsReturned: allItems.length,
      pagesRequested: pageCount,
      totalTime,
      continuation: currentContinuation,
    })

    return {
      items: allItems.slice(0, targetCount),
      metadata: {
        hasMore: !!currentContinuation,
        continuation: currentContinuation,
        itemsReturned: allItems.length,
      },
    }
  } catch (error) {
    errorLogger.error('❌ YT-API 검색 실패', error as Error, {
      query,
      pageCount,
      itemsFetched: totalFetched,
    })
    throw error
  }
}

/**
 * Shorts 데이터 보강 (부족한 필드 채우기)
 * shorts는 최소한의 정보만 포함되므로, VideoCard에서 동적으로 로드할 필드는 빈 값 유지
 */
function enrichShortsData(normalized: NormalizedVideo): NormalizedVideo {
  // Shorts는 /api/shorts-info에서 정확한 모든 데이터를 가져오므로
  // 빈 값을 기본값으로 채우지 않음 (이렇게 하면 API 조회가 트리거되지 않음)
  // publishedAt, duration, channelTitle이 빈 값이면 VideoCard에서 API로 조회

  return normalized
}

/**
 * 내부 형식으로 변환 (기존 호환성 유지)
 */
function normalizedToApifyItem(normalized: NormalizedVideo): ApifyDataItem {
  // Shorts 데이터 보강
  if (normalized.type === 'shorts') {
    normalized = enrichShortsData(normalized)
  }

  // 제목에서 해시태그 제거
  const titleWithoutHashtags = removeHashtagsFromText(normalized.title)

  // 발행 시간 포맷 (한국어)
  // ✅ publishedAt이 빈 값이면 비워둠 (VideoCard에서 API 업데이트 후 계산)
  let categoryName = ''

  if (normalized.publishedAt && normalized.publishedAt.trim() !== '') {
    const publishedDate = new Date(normalized.publishedAt)
    const now = new Date()
    const isValidDate = !isNaN(publishedDate.getTime())

    if (isValidDate) {
      // 미래 날짜는 "최근" 또는 "오늘"로 표시 (API 오류나 시간대 차이 대비)
      if (publishedDate > now) {
        categoryName = '최근'
      } else {
        const daysOld = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysOld === 0) {
          categoryName = '오늘'
        } else if (daysOld === 1) {
          categoryName = '어제'
        } else if (daysOld < 7) {
          categoryName = `${daysOld}일 전`
        } else if (daysOld < 30) {
          const weeks = Math.floor(daysOld / 7)
          categoryName = `${weeks}주 전`
        } else if (daysOld < 365) {
          const months = Math.floor(daysOld / 30)
          categoryName = `${months}개월 전`
        } else {
          const years = Math.floor(daysOld / 365)
          categoryName = `${years}년 전`
        }
      }
    }
  }

  return {
    id: normalized.type === 'channel' ? normalized.channelId : normalized.videoId,
    title: titleWithoutHashtags,
    description: normalized.description,
    channelId: normalized.channelId,
    channelTitle: normalized.channelTitle,
    publishedAt: normalized.publishedAt,
    viewCount: normalized.viewCount,
    likeCount: normalized.likeCount,
    commentCount: normalized.commentCount,
    duration: normalized.duration,
    subscriberCount: normalized.subscriberCount,
    thumbnail: normalized.thumbnail,
    tags: normalized.keywords,
    categoryId: '',
    categoryName,
    categoryIcon: 'Video',
    type: normalized.type,
    videoCount: normalized.videoCount,
  }
}

// ============ 내보내기 ============

/**
 * YouTube 검색 (YT-API 사용 + Pagination + 비디오 타입 필터링)
 * targetCount개의 영상 반환 (기본 50개)
 *
 * videoType:
 * - 'video': 일반 비디오만
 * - 'shorts': 쇼츠만
 * - 'channel': 채널만
 */
export async function searchYouTubeWithRapidAPI(
  query: string,
  targetCount: number = 40,
  uploadDate: string = 'week', // 'hour' | 'today' | 'week' | 'month' | 'year'
  channel?: string, // 채널 필터
  videoType: 'video' | 'shorts' | 'channel' = 'video' // 비디오 타입
): Promise<ApifyDataItem[]> {
  try {
    const { items } = await searchWithYTAPI(query, targetCount, uploadDate, undefined, videoType, channel)

    // ✅ RapidAPI의 upload_date 필터가 제대로 작동하지 않아 클라이언트 필터링은 스킵
    // VideoCard에서 API 호출 시 정확한 publishedAt을 받으므로 거기서 시간 표시는 정확함
    // 검색 필터는 VideoCard의 업로드 시간 계산과 별개로 진행

    console.log(`📊 검색 결과: ${items.length}개 반환 (upload_date: ${uploadDate} - RapidAPI 필터 사용)`)

    return items.map(normalizedToApifyItem)
  } catch (error) {
    errorLogger.error('❌ YouTube 검색 실패', error as Error, { query })
    throw error
  }
}

/**
 * YouTube 트렌딩 영상 조회 (YT-API)
 * @param section - 트렌딩 타입 (now, music, games, movies)
 * @param geo - 국가 코드 (KR, JP, US)
 */
export async function getTrendingVideos(
  section: string = 'now',
  geo: string = 'KR'
): Promise<ApifyDataItem[]> {
  if (!RAPIDAPI_KEY) {
    throw new APIError('RapidAPI 키가 설정되지 않았습니다', 500, false)
  }

  const startTime = Date.now()

  try {
    const { data, metadata } = await withRetry(
      async () => {
        const url = new URL(`${API_BASE_URL}/trending`)

        // geo 파라미터 설정
        url.searchParams.append('geo', geo)

        // lang 파라미터 국가별 매핑
        const langMap: Record<string, string> = {
          'KR': 'ko',
          'JP': 'ja',
          'US': 'en',
          'GB': 'en',
          'DE': 'de',
          'VN': 'vi'
        }
        const lang = langMap[geo] || 'ko'
        url.searchParams.append('lang', lang)

        // type은 optional (기본값: now), 다른 타입을 선택할 때만 추가
        if (section.toLowerCase() !== 'now') {
          url.searchParams.append('type', section.toLowerCase())
        }

        const result = await safeFetch(url.toString(), {
          method: 'GET',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': RAPIDAPI_HOST,
          },
          signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT),
          context: { section },
        })

        return {
          data: result.data,
          headers: result.response.headers,
          metadata: result.metadata,
        }
      },
      CONFIG.RETRY_COUNT,
      CONFIG.RETRY_DELAY,
      { section }
    )

    // 🔍 API 응답 구조 확인
    console.log(`🔍 [트렌딩 API 응답] 최상위 키:`, Object.keys(data))
    console.log(`🔍 [트렌딩 API 응답] 전체 데이터:`, data)

    const rawItems = extractDataArray(data)
    console.log(`🔍 [트렌딩] extractDataArray 결과 아이템 수:`, rawItems.length)
    console.log(`🔍 [트렌딩] 첫 3개 항목:`, rawItems.slice(0, 3).map(item => ({
      title: item.title?.substring(0, 30),
      type: item.type,
      isShorts: item.isShorts,
    })))

    const normalizedItems = rawItems
      .map((item, idx) => {
        try {
          const normalized = normalizeVideo(item)
          if (idx < 3) {
            console.log(`📊 [트렌딩 ${idx}] 정규화 후:`, {
              title: normalized.title.substring(0, 30),
              type: normalized.type,
            })
          }
          return normalized
        } catch (error) {
          errorLogger.warn('트렌딩 비디오 정규화 실패', {
            error: error instanceof Error ? error.message : String(error),
          })
          return null
        }
      })
      .filter((item): item is NormalizedVideo => item !== null)

    console.log(`✅ [트렌딩] 정규화 완료: ${rawItems.length}개 → ${normalizedItems.length}개`)

    const totalTime = Date.now() - startTime

    errorLogger.info(`✅ 트렌딩 조회 완료`, {
      section,
      rawItemsCount: rawItems.length,
      itemsReturned: normalizedItems.length,
      totalTime,
      rateLimitRemaining: metadata?.rateLimitRemaining,
    })

    return normalizedItems.map(normalizedToApifyItem)
  } catch (error) {
    errorLogger.error('❌ 트렌딩 조회 실패', error as Error, { section })
    throw error
  }
}

/**
 * YouTube 채널 정보 조회 (YT-API /channel/about)
 */
export async function getChannelInfo(
  channelId: string
): Promise<NormalizedChannelInfo> {
  try {
    const url = new URL(`${API_BASE_URL}/channel/about`)
    url.searchParams.append('id', channelId)

    const result = await withRetry(
      async () => {
        const fetchResult = await safeFetch(url.toString(), {
          method: 'GET',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY || '',
            'x-rapidapi-host': RAPIDAPI_HOST,
          },
          signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT),
          context: { channelId },
        })

        return {
          data: fetchResult.data,
          headers: fetchResult.response.headers,
          metadata: fetchResult.metadata,
        }
      },
      CONFIG.RETRY_COUNT,
      CONFIG.RETRY_DELAY,
      { channelId }
    )

    errorLogger.info(`📍 채널 정보 조회 성공`, {
      channelId,
      rateLimitRemaining: result.metadata?.rateLimitRemaining,
    })

    return normalizeChannelInfo(result.data)
  } catch (error) {
    errorLogger.warn(`⚠️  채널 정보 조회 실패`, {
      channelId,
      error: error instanceof Error ? error.message : String(error),
    })

    // Graceful degradation: 빈 채널 정보 반환
    return {
      channelId,
      title: '',
      description: '',
      subscriberCount: 0,
      videoCount: 0,
      viewCount: 0,
      thumbnail: '',
      banner: '',
      country: null,
      verified: false,
      channelHandle: '',
    }
  }
}

/**
 * 여러 채널 정보 조회 (배치 + 캐싱)
 */
export async function getChannelsInfo(
  channelIds: string[]
): Promise<Map<string, { subscriberCount: number; country: string | null }>> {
  if (channelIds.length === 0) {
    return new Map()
  }

  const result = new Map<string, { subscriberCount: number; country: string | null }>()
  const uncachedIds: string[] = []
  let cacheHits = 0

  // 캐시에서 조회
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

  // 캐시 미스 항목만 병렬 API 요청
  if (uncachedIds.length > 0) {
    try {
      const results = await Promise.all(
        uncachedIds.map(id => getChannelInfo(id))
      )

      results.forEach((channel, index) => {
        const channelId = uncachedIds[index]
        result.set(channelId, {
          subscriberCount: channel.subscriberCount,
          country: channel.country,
        })
        setCachedChannelInfo(channelId, channel.subscriberCount, channel.country)
      })

      errorLogger.info(`📊 구독자 조회 완료`, {
        cacheHits,
        apiRequests: uncachedIds.length,
        total: result.size,
      })
    } catch (error) {
      errorLogger.error(`❌ 채널 정보 배치 조회 실패`, error as Error, {
        requestedCount: uncachedIds.length,
      })
    }
  }

  return result
}

/**
 * 쇼츠 상세 정보 조회 (YT-API /video/info)
 * Shorts도 /video/info로 모든 메타데이터 조회 가능
 * - channelId, channelTitle, publishedAt, lengthSeconds (duration) 등
 */
export async function getShortsInfo(videoId: string): Promise<{
  channelId: string
  channelTitle: string
  publishedAt: string
  duration: string
}> {
  try {
    // ✅ Shorts도 /video/info 사용 (더 많은 정보 제공)
    let url = new URL(`${API_BASE_URL}/video/info`)
    url.searchParams.append('id', videoId)

    const result = await withRetry(
      async () => {
        const fetchResult = await safeFetch(url.toString(), {
          method: 'GET',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY || '',
            'x-rapidapi-host': RAPIDAPI_HOST,
          },
          signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT),
          context: { videoId },
        })

        return {
          data: fetchResult.data,
          headers: fetchResult.response.headers,
          metadata: fetchResult.metadata,
        }
      },
      CONFIG.RETRY_COUNT,
      CONFIG.RETRY_DELAY,
      { videoId }
    )

    const data = result.data

    // lengthSeconds를 ISO 8601 duration 형식으로 변환
    let duration = ''
    if (data?.lengthSeconds) {
      const seconds = parseInt(data.lengthSeconds, 10)
      if (!isNaN(seconds)) {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        let durationStr = 'PT'
        if (hours > 0) durationStr += `${hours}H`
        if (minutes > 0) durationStr += `${minutes}M`
        if (secs > 0 || durationStr === 'PT') durationStr += `${secs}S`

        duration = durationStr
      }
    }

    const channelId = data?.channelId || ''
    const channelTitle = data?.channelTitle || ''
    const publishedAt = data?.publishedAt || ''

    return {
      channelId,
      channelTitle,
      publishedAt,
      duration,
    }
  } catch (error) {
    console.error(`❌ /video/info 호출 실패 (shorts):`, {
      videoId,
      error: error instanceof Error ? error.message : String(error),
    })

    // 폴백 로직은 더 이상 필요 없음 (필요시 다른 엔드포인트 추가 가능)
    try {
      const url = new URL(`${API_BASE_URL}/video/info`)
      url.searchParams.append('id', videoId)

      const result = await withRetry(
        async () => {
          const fetchResult = await safeFetch(url.toString(), {
            method: 'GET',
            headers: {
              'x-rapidapi-key': RAPIDAPI_KEY || '',
              'x-rapidapi-host': RAPIDAPI_HOST,
            },
            signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT),
            context: { videoId },
          })

          return {
            data: fetchResult.data,
            headers: fetchResult.response.headers,
            metadata: fetchResult.metadata,
          }
        },
        CONFIG.RETRY_COUNT,
        CONFIG.RETRY_DELAY,
        { videoId }
      )

      const data = result.data.meta || result.data.data?.[0] || result.data
      const normalized = normalizeVideo(data)

      return {
        channelId: data?.channelId || normalized.channelId || '',
        channelTitle: data?.channelTitle || normalized.channelTitle || '',
        publishedAt: data?.publishedAt || normalized.publishedAt || '',
        duration: data?.duration || normalized.duration || '',
      }
    } catch (fallbackError) {
      console.error(`❌ /video/info 폴백도 실패`, {
        videoId,
        error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
      })

      errorLogger.warn(`⚠️  쇼츠 정보 조회 완전 실패`, {
        videoId,
        error: error instanceof Error ? error.message : String(error),
      })

      return {
        channelId: '',
        channelTitle: '',
        publishedAt: '',
        duration: '',
      }
    }
  }
}

/**
 * 개별 비디오 정보 조회 (YT-API /video/info)
 */
export async function getVideoInfo(videoId: string): Promise<{
  languageCode: string | null
  keywords: string[]
  duration: string
  publishedAt: string
  channelTitle: string
  channelId: string
}> {
  try {
    const url = new URL(`${API_BASE_URL}/video/info`)
    url.searchParams.append('id', videoId)

    const result = await withRetry(
      async () => {
        const fetchResult = await safeFetch(url.toString(), {
          method: 'GET',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY || '',
            'x-rapidapi-host': RAPIDAPI_HOST,
          },
          signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT),
          context: { videoId },
        })

        return {
          data: fetchResult.data,
          headers: fetchResult.response.headers,
          metadata: fetchResult.metadata,
        }
      },
      CONFIG.RETRY_COUNT,
      CONFIG.RETRY_DELAY,
      { videoId }
    )

    const data = result.data.meta || result.data.data?.[0] || result.data

    return {
      languageCode: data.defaultVideoLanguageCode || null,
      keywords: data.keywords || [],
      duration: data.duration || '',
      publishedAt: data.publishedAt || '',
      channelTitle: data.channelTitle || '',
      channelId: data.channelId || '',
    }
  } catch (error) {
    errorLogger.warn(`⚠️  비디오 정보 조회 실패`, {
      videoId,
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      languageCode: null,
      keywords: [],
      duration: '',
      publishedAt: '',
      channelTitle: '',
      channelId: '',
    }
  }
}

/**
 * 요청 큐 상태 조회
 */
export function getQueueStatus() {
  return requestQueue.getStatus()
}

/**
 * 설정 조회
 */
export function getConfig() {
  return CONFIG
}

/**
 * 에러 로거 조회 (테스트용)
 */
export function getErrorLogger() {
  return errorLogger
}
