/**
 * RapidAPI YouTube V2 클라이언트 (최적화 버전)
 * 동접 500명 지원 설계
 */

import { RequestQueue } from '@/lib/utils/requestQueue'

// ============ 설정 ============
const API_BASE_URL = 'https://youtube-v2.p.rapidapi.com'
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST

// 동접 500명 지원을 위한 설정
const CONFIG = {
  // API 속도 제한 (동접별 요청 큐)
  MAX_CONCURRENT_REQUESTS: 20, // 동시 요청 수 (2배 증가)
  REQUEST_TIMEOUT: 15000, // 요청 타임아웃 (15초)
  RETRY_COUNT: 2, // 재시도 횟수
  RETRY_DELAY: 1000, // 재시도 간격 (1초)

  // 쇼츠 상세 조회 설정
  SHORTS_BATCH_SIZE: 5, // 한 번에 조회할 쇼츠 개수
  SHORTS_REQUEST_DELAY: 100, // 쇼츠 요청 간 딜레이 (100ms)

  // 응답 캐싱 (선택사항)
  ENABLE_CACHING: true,
  CACHE_TTL: 3600000, // 1시간
}

// ============ 인터페이스 ============
interface RapidAPIVideo {
  video_id: string
  title: string
  description: string
  author: string
  channel_id: string
  number_of_views: number
  video_length: string
  published_time: string
  thumbnails: Array<{
    url: string
    width: number
    height: number
  }>
}

interface ApifyDataItem {
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
  _needsDetailsFetch?: boolean
}

// ============ 요청 큐 관리 (동접 제어) ============
const requestQueue = new RequestQueue(CONFIG.MAX_CONCURRENT_REQUESTS)

// ============ 재시도 로직 ============
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = CONFIG.RETRY_COUNT,
  delay = CONFIG.RETRY_DELAY
): Promise<T> {
  try {
    return await fn()
  } catch (error: any) {
    if (retries <= 0) {
      throw error
    }

    // 429 Too Many Requests나 5xx 에러만 재시도
    if (
      error.status === 429 ||
      (error.status >= 500 && error.status < 600)
    ) {
      console.warn(`⚠️  재시도 예정 (남은 시도: ${retries - 1})...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return withRetry(fn, retries - 1, delay * 2)
    }

    throw error
  }
}

// ============ 유틸리티 함수 ============

/**
 * 상대 시간을 ISO 8601 날짜로 변환
 * "2 days ago" → "2024-12-08T10:30:00Z"
 * 정규식 매치 실패 시 합리적인 fallback 처리
 */
function convertRelativeTimeToISO8601(relativeTime: string): string {
  if (!relativeTime) {
    // 데이터 없으면 안전하게 1일 전으로 설정 (VPH 계산 안정성 확보)
    const date = new Date()
    date.setDate(date.getDate() - 1)
    return date.toISOString()
  }

  const now = new Date()

  // 1단계: "N [unit] ago" 형식 매칭
  const match = relativeTime.match(
    /^(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i
  )

  if (match) {
    const value = parseInt(match[1], 10)
    const unit = match[2].toLowerCase()
    const date = new Date(now)

    switch (unit) {
      case 'second':
        date.setSeconds(date.getSeconds() - value)
        break
      case 'minute':
        date.setMinutes(date.getMinutes() - value)
        break
      case 'hour':
        date.setHours(date.getHours() - value)
        break
      case 'day':
        date.setDate(date.getDate() - value)
        break
      case 'week':
        date.setDate(date.getDate() - value * 7)
        break
      case 'month':
        date.setMonth(date.getMonth() - value)
        break
      case 'year':
        date.setFullYear(date.getFullYear() - value)
        break
    }

    return date.toISOString()
  }

  // 2단계: 특수 키워드 처리 (RECENTLY, TODAY 등)
  const lowerRelativeTime = relativeTime.toLowerCase().trim()
  const date = new Date(now)

  switch (lowerRelativeTime) {
    case 'recently':
    case 'just now':
    case 'now':
      // "최근" → 2시간 전으로 설정 (합리적인 시간)
      date.setHours(date.getHours() - 2)
      return date.toISOString()
    case 'today':
      // "오늘" → 12시간 전으로 설정
      date.setHours(date.getHours() - 12)
      return date.toISOString()
    case 'yesterday':
      // "어제" → 1일 전
      date.setDate(date.getDate() - 1)
      return date.toISOString()
  }

  // 3단계: 정규식/키워드 모두 매칭 실패 시 로그 및 안전한 기본값 반환
  console.warn(
    `⚠️  publishedAt 형식 인식 불가: "${relativeTime}" → 기본값(1일 전) 사용`
  )
  date.setDate(date.getDate() - 1)
  return date.toISOString()
}

/**
 * Duration을 ISO 8601 형식으로 변환
 */
function convertDurationToISO8601(durationStr: string): string {
  if (!durationStr) return ''

  // 쇼츠 처리
  if (durationStr.toUpperCase() === 'SHORTS') {
    return 'PT60S'
  }

  let hours = 0
  let minutes = 0
  let seconds = 0

  // 단순 숫자 (초)
  if (!durationStr.includes(':')) {
    const totalSeconds = parseInt(durationStr, 10)
    if (isNaN(totalSeconds) || totalSeconds === 0) return ''

    hours = Math.floor(totalSeconds / 3600)
    minutes = Math.floor((totalSeconds % 3600) / 60)
    seconds = totalSeconds % 60
  } else {
    // "MM:SS" 또는 "HH:MM:SS"
    const parts = durationStr.split(':').map((p) => parseInt(p, 10))

    if (parts.length === 2) {
      minutes = parts[0]
      seconds = parts[1]
    } else if (parts.length === 3) {
      hours = parts[0]
      minutes = parts[1]
      seconds = parts[2]
    }
  }

  let iso = 'PT'
  if (hours > 0) iso += `${hours}H`
  if (minutes > 0) iso += `${minutes}M`
  if (seconds > 0) iso += `${seconds}S`

  return iso === 'PT' ? '' : iso
}

// ============ API 호출 ============

/**
 * RapidAPI Video Details로 정확한 duration 조회
 */
async function getVideoDetails(videoId: string): Promise<string> {
  return requestQueue.enqueue(async () => {
    try {
      const url = new URL(`${API_BASE_URL}/video/details`)
      url.searchParams.append('video_id', videoId)

      const response = await withRetry(async () => {
        const res = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY || '',
            'x-rapidapi-host': RAPIDAPI_HOST || '',
          },
          signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT),
        })

        if (!res.ok) {
          const error: any = new Error(`HTTP ${res.status}`)
          error.status = res.status
          throw error
        }

        return res
      })

      const data = await response.json()
      return data.video_length || ''
    } catch (error) {
      console.warn(`⚠️  Video Details 조회 실패 - ${videoId}:`, error)
      return ''
    }
  })
}

/**
 * RapidAPI 검색 (1회 요청 최대한 많이)
 */
async function searchWithRapidAPI(
  query: string,
  maxResults: number = 50
): Promise<RapidAPIVideo[]> {
  if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
    throw new Error('RapidAPI 키 또는 Host가 설정되지 않았습니다')
  }

  const startTime = Date.now()

  return withRetry(async () => {
    const url = new URL(`${API_BASE_URL}/search/`)
    url.searchParams.append('query', query)
    url.searchParams.append('lang', 'ko')
    url.searchParams.append('country', 'kr')
    url.searchParams.append('maxResults', maxResults.toString())

    const fetchStart = Date.now()
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
      signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT),
    })
    const fetchTime = Date.now() - fetchStart

    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}`)
      error.status = response.status
      throw error
    }

    const data = await response.json()
    const items = data.videos || []
    const totalTime = Date.now() - startTime

    console.log(`✅ RapidAPI 요청 완료 - ${items.length}개 (${totalTime}ms)`)

    return items
  })
}

/**
 * 상대 시간을 사람 친화적인 형식으로 변환
 * "2 days ago" → "2일 전"
 */
function formatRelativeTime(relativeTime: string): string {
  if (!relativeTime) return ''

  const match = relativeTime.match(
    /^(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/
  )

  if (!match) return ''

  const value = parseInt(match[1], 10)
  const unit = match[2]

  const unitMap: Record<string, string> = {
    'second': '초 전',
    'minute': '분 전',
    'hour': '시간 전',
    'day': '일 전',
    'week': '주 전',
    'month': '달 전',
    'year': '년 전',
  }

  return `${value}${unitMap[unit] || ''}`
}

/**
 * 데이터 변환
 */
function transformRapidAPIData(items: RapidAPIVideo[]): ApifyDataItem[] {
  return items.map((item) => {
    // 조회수가 0이거나 없으면 경고 로그
    if (!item.number_of_views || item.number_of_views === 0) {
      console.warn(`⚠️  조회수 0 - 제목: ${item.title}, video_id: ${item.video_id}`)
    }

    return {
      id: item.video_id,
      title: item.title,
      description: item.description || '',
      channelId: item.channel_id || '',
      channelTitle: item.author,
      publishedAt: convertRelativeTimeToISO8601(item.published_time || ''),
      viewCount: item.number_of_views || 0,
      likeCount: 0,
      commentCount: 0,
      duration: convertDurationToISO8601(item.video_length || ''),
      subscriberCount: 0,
      thumbnail:
        item.thumbnails && item.thumbnails.length > 0
          ? item.thumbnails[item.thumbnails.length - 1].url
          : '',
      tags: [],
      categoryId: '',
      categoryName: formatRelativeTime(item.published_time || ''),
      categoryIcon: 'Video',
      _needsDetailsFetch: item.video_length === 'SHORTS',
    }
  })
}

/**
 * 쇼츠 상세 정보 배치 조회
 */
async function fetchShortsDetails(
  items: ApifyDataItem[]
): Promise<ApifyDataItem[]> {
  const shortVideos = items.filter((item) => item._needsDetailsFetch)

  if (shortVideos.length === 0) {
    return items
  }

  console.log(`📹 쇼츠 ${shortVideos.length}개의 정확한 시간 조회 중...`)

  // 배치 처리로 API 부하 감소
  const batches = []
  for (let i = 0; i < shortVideos.length; i += CONFIG.SHORTS_BATCH_SIZE) {
    batches.push(shortVideos.slice(i, i + CONFIG.SHORTS_BATCH_SIZE))
  }

  // 모든 배치를 동시에 실행 (RequestQueue가 동시성 제어)
  // 배치 간 딜레이 제거 (RequestQueue가 rate limit 관리)
  const allBatchDurations = await Promise.all(
    batches.map((batch) =>
      Promise.all(batch.map((video) => getVideoDetails(video.id)))
    )
  )

  // 결과 평탄화
  const allDurations = allBatchDurations.flat()

  // 결과 병합
  const updatedItems = items.map((item) => {
    if (item._needsDetailsFetch) {
      const detailIndex = shortVideos.findIndex((v) => v.id === item.id)
      const actualDuration = allDurations[detailIndex]

      if (actualDuration && actualDuration !== 'SHORTS') {
        return {
          ...item,
          duration: convertDurationToISO8601(actualDuration),
          _needsDetailsFetch: undefined,
        } as ApifyDataItem
      }
    }

    return item
  })

  console.log(`✅ 쇼츠 상세 정보 조회 완료`)
  return updatedItems
}

// ============ 내보내기 ============

/**
 * YouTube 검색 (RapidAPI 사용)
 */
export async function searchYouTubeWithRapidAPI(
  query: string,
  maxResults: number = 50
): Promise<ApifyDataItem[]> {
  try {
    const items = await searchWithRapidAPI(query, maxResults)
    let transformedItems = transformRapidAPIData(items)

    const shortsCount = transformedItems.filter(
      (item: any) => item._needsDetailsFetch
    ).length

    if (shortsCount > 0) {
      transformedItems = await fetchShortsDetails(transformedItems)
    }

    return transformedItems
  } catch (error) {
    console.error('❌ YouTube 검색 실패:', error)
    throw error
  }
}

/**
 * YouTube 트렌딩 영상 조회 (RapidAPI)
 */
export async function getTrendingVideos(
  section: string = 'Now'
): Promise<ApifyDataItem[]> {
  if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
    throw new Error('RapidAPI 키 또는 Host가 설정되지 않았습니다')
  }

  const startTime = Date.now()

  return withRetry(async () => {
    const url = new URL(`${API_BASE_URL}/trending/`)
    url.searchParams.append('country', 'KR')
    url.searchParams.append('section', section)
    url.searchParams.append('lang', 'ko')

    const fetchStart = Date.now()
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
      signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT),
    })
    const fetchTime = Date.now() - fetchStart

    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}`)
      error.status = response.status
      throw error
    }

    const data = await response.json()
    const items = data.videos || []
    const totalTime = Date.now() - startTime

    console.log(`✅ RapidAPI 트렌딩 요청 완료 - section: ${section}, ${items.length}개 (${totalTime}ms)`)

    // 데이터 변환
    let transformedItems = transformRapidAPIData(items)

    const shortsCount = transformedItems.filter(
      (item: any) => item._needsDetailsFetch
    ).length

    if (shortsCount > 0) {
      transformedItems = await fetchShortsDetails(transformedItems)
    }

    return transformedItems
  })
}

/**
 * 비디오 정보 조회
 */
export function getVideoInfo(item: ApifyDataItem) {
  return item
}

/**
 * 채널 정보 조회
 */
export function getChannelInfo(item: ApifyDataItem) {
  return {
    id: item.channelId,
    title: item.channelTitle,
    subscriberCount: item.subscriberCount,
    viewCount: 0,
    videoCount: 0,
  }
}

/**
 * API 큐 상태 조회 (모니터링용)
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
