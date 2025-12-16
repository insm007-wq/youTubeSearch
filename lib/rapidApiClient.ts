/**
 * RapidAPI YT-API 클라이언트 (고속 버전)
 * 동접 500명 지원 설계
 * YouTube V2 대비 3-5배 빠른 응답 속도
 */

import { RequestQueue } from '@/lib/utils/requestQueue'
import { extractHashtagsFromTitle } from '@/lib/hashtagUtils'

// ============ 설정 ============
const API_BASE_URL = 'https://yt-api.p.rapidapi.com'
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = 'yt-api.p.rapidapi.com'

// 동접 500명 지원을 위한 설정
const CONFIG = {
  // API 속도 제한 (동접별 요청 큐)
  MAX_CONCURRENT_REQUESTS: 20, // 동시 요청 수
  REQUEST_TIMEOUT: 10000, // 요청 타임아웃 (10초 - 더 빠른 API)
  RETRY_COUNT: 2, // 재시도 횟수
  RETRY_DELAY: 500, // 재시도 간격 (500ms)

  // 캐싱 설정
  ENABLE_CACHING: true,
  CACHE_TTL: 3600000, // 1시간
}

// ============ 인터페이스 ============

/**
 * YT-API 검색 응답 구조
 */
interface YTAPIVideo {
  id: string
  title: string
  description?: string
  channel: {
    id: string
    name: string
    subscribers?: string
    avatar?: string
    url?: string
  }
  duration?: string
  views?: string | number
  uploaded?: string
  publishedText?: string
  keywords?: string[]
  tags?: string[]
  thumbnail?: string
  thumbnails?: Array<{ url: string; width?: number; height?: number }>
  url?: string
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
 * 구독자 수 문자열 파싱 ("1.5M" → 1500000)
 */
function parseSubscriberCount(subscriberStr?: string): number {
  if (!subscriberStr || typeof subscriberStr !== 'string') {
    return 0
  }

  const cleaned = subscriberStr.trim().toUpperCase()

  // "1.5M" → 1500000
  if (cleaned.includes('M')) {
    const num = parseFloat(cleaned.replace('M', '')) * 1000000
    return isNaN(num) ? 0 : Math.floor(num)
  }

  // "150K" → 150000
  if (cleaned.includes('K')) {
    const num = parseFloat(cleaned.replace('K', '')) * 1000
    return isNaN(num) ? 0 : Math.floor(num)
  }

  // "150B" → 150000000000 (억 단위)
  if (cleaned.includes('B')) {
    const num = parseFloat(cleaned.replace('B', '')) * 1000000000
    return isNaN(num) ? 0 : Math.floor(num)
  }

  // 순수 숫자
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? 0 : num
}

/**
 * 조회수 문자열 파싱 ("1.5M views" → 1500000)
 */
function parseViewCount(viewStr?: string | number): number {
  if (!viewStr) {
    return 0
  }

  if (typeof viewStr === 'number') {
    return viewStr
  }

  const cleaned = String(viewStr).trim().toUpperCase().replace(/VIEWS?/, '')

  // "1.5M" → 1500000
  if (cleaned.includes('M')) {
    const num = parseFloat(cleaned.replace('M', '')) * 1000000
    return isNaN(num) ? 0 : Math.floor(num)
  }

  // "150K" → 150000
  if (cleaned.includes('K')) {
    const num = parseFloat(cleaned.replace('K', '')) * 1000
    return isNaN(num) ? 0 : Math.floor(num)
  }

  // "150B" → 150000000000
  if (cleaned.includes('B')) {
    const num = parseFloat(cleaned.replace('B', '')) * 1000000000
    return isNaN(num) ? 0 : Math.floor(num)
  }

  // 순수 숫자
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? 0 : num
}

/**
 * 상대 시간을 ISO 8601 형식으로 변환
 * "2 days ago" / "2일 전" → "2024-12-14T00:00:00Z"
 */
function convertRelativeTimeToISO8601(relativeTime: string): string {
  if (!relativeTime) return new Date().toISOString()

  // 정규식으로 숫자와 시간 단위 추출
  const match = relativeTime.match(/(\d+)\s*(second|minute|hour|day|week|month|year|초|분|시간|일|주|달|년)/)

  if (!match) {
    return new Date().toISOString()
  }

  const value = parseInt(match[1], 10)
  const unit = match[2].toLowerCase()

  const now = new Date()

  if (unit.includes('second') || unit === '초') {
    now.setSeconds(now.getSeconds() - value)
  } else if (unit.includes('minute') || unit === '분') {
    now.setMinutes(now.getMinutes() - value)
  } else if (unit.includes('hour') || unit === '시간') {
    now.setHours(now.getHours() - value)
  } else if (unit.includes('day') || unit === '일') {
    now.setDate(now.getDate() - value)
  } else if (unit.includes('week') || unit === '주') {
    now.setDate(now.getDate() - value * 7)
  } else if (unit.includes('month') || unit === '달') {
    now.setMonth(now.getMonth() - value)
  } else if (unit.includes('year') || unit === '년') {
    now.setFullYear(now.getFullYear() - value)
  }

  return now.toISOString()
}

/**
 * Duration을 ISO 8601 형식으로 변환
 * "12:34" → "PT12M34S"
 * "1:23:45" → "PT1H23M45S"
 */
function convertDurationToISO8601(durationStr: string | number): string {
  if (!durationStr || durationStr === 'SHORTS') {
    return 'PT0S'
  }

  const str = String(durationStr).trim()

  // 이미 ISO 8601 형식이면 그대로 반환
  if (str.startsWith('PT')) {
    return str
  }

  const parts = str.split(':').map((p) => parseInt(p, 10))

  let hours = 0
  let minutes = 0
  let seconds = 0

  if (parts.length === 3) {
    [hours, minutes, seconds] = parts
  } else if (parts.length === 2) {
    [minutes, seconds] = parts
  } else if (parts.length === 1) {
    [seconds] = parts
  }

  let iso = 'PT'
  if (hours > 0) iso += `${hours}H`
  if (minutes > 0) iso += `${minutes}M`
  if (seconds > 0) iso += `${seconds}S`

  return iso === 'PT' ? 'PT0S' : iso
}

/**
 * 격식 있는 시간 포맷 (카테고리용)
 * "2 days ago" → "2일 전"
 */
function formatRelativeTime(relativeTime: string): string {
  if (!relativeTime) return '시간 불명'

  // 1단계: 숫자와 시간 단위 추출
  const match = relativeTime.match(
    /^(\d+)\s+(second|minute|hour|day|week|month|year|초|분|시간|일|주|달|년)s?\s+(ago)?$/i
  )

  if (match) {
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
      '초': '초 전',
      '분': '분 전',
      '시간': '시간 전',
      '일': '일 전',
      '주': '주 전',
      '달': '달 전',
      '년': '년 전',
    }

    return `${value}${unitMap[unit] || ''}`
  }

  // 2단계: "스트리밍 시간: 7시간 전" 형식 처리
  const streamingMatch = relativeTime.match(/(\d+)(초|분|시간|일|주|달|년)\s*전/)
  if (streamingMatch) {
    return `${streamingMatch[1]}${streamingMatch[2]} 전`
  }

  // 3단계: 그 외 형식은 그대로 표시
  return relativeTime
}

// ============ API 호출 ============

/**
 * YT-API 검색
 */
async function searchWithYTAPI(
  query: string,
  maxResults: number = 50
): Promise<YTAPIVideo[]> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RapidAPI 키가 설정되지 않았습니다')
  }

  const startTime = Date.now()

  return withRetry(async () => {
    const url = new URL(`${API_BASE_URL}/search`)
    url.searchParams.append('query', query)
    url.searchParams.append('type', 'video')
    url.searchParams.append('gl', 'KR')
    url.searchParams.append('hl', 'ko')

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
    const items = data.data || data.contents || []
    const totalTime = Date.now() - startTime

    console.log(
      `✅ YT-API 요청 완료 - ${items.length}개 (${fetchTime}ms 조회, ${totalTime}ms 총시간)`
    )

    return items.slice(0, maxResults)
  })
}

/**
 * YT-API 응답을 내부 형식으로 변환
 */
function transformYTAPIData(items: YTAPIVideo[]): ApifyDataItem[] {
  return items.map((item) => {
    const viewCount = parseViewCount(item.views)

    // 조회수가 0이거나 없으면 경고
    if (!viewCount || viewCount === 0) {
      console.warn(
        `⚠️  조회수 0 - 제목: ${item.title}, videoId: ${item.id}`
      )
    }

    return {
      id: item.id,
      title: item.title,
      description: item.description || '',
      channelId: item.channel?.id || '',
      channelTitle: item.channel?.name || '',
      publishedAt: convertRelativeTimeToISO8601(
        item.uploaded || item.publishedText || ''
      ),
      viewCount,
      likeCount: 0, // YT-API는 좋아요 수 미제공
      commentCount: 0, // YT-API는 댓글 수 미제공
      duration: convertDurationToISO8601(item.duration || ''),
      subscriberCount: parseSubscriberCount(item.channel?.subscribers),
      thumbnail:
        item.thumbnail ||
        (item.thumbnails && item.thumbnails.length > 0
          ? item.thumbnails[item.thumbnails.length - 1].url
          : ''),
      // 키워드 또는 제목에서 추출
      tags:
        item.keywords ||
        item.tags ||
        extractHashtagsFromTitle(item.title),
      categoryId: '',
      categoryName: formatRelativeTime(item.uploaded || item.publishedText || ''),
      categoryIcon: 'Video',
    }
  })
}

// ============ 내보내기 ============

/**
 * YouTube 검색 (YT-API 사용)
 */
export async function searchYouTubeWithRapidAPI(
  query: string,
  maxResults: number = 50
): Promise<ApifyDataItem[]> {
  try {
    const items = await searchWithYTAPI(query, maxResults)
    const transformedItems = transformYTAPIData(items)

    return transformedItems
  } catch (error) {
    console.error('❌ YouTube 검색 실패:', error)
    throw error
  }
}

/**
 * YouTube 트렌딩 영상 조회 (YT-API)
 */
export async function getTrendingVideos(
  section: string = 'NOW'
): Promise<ApifyDataItem[]> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RapidAPI 키가 설정되지 않았습니다')
  }

  const startTime = Date.now()

  return withRetry(async () => {
    const url = new URL(`${API_BASE_URL}/trending`)
    url.searchParams.append('gl', 'KR')
    url.searchParams.append('hl', 'ko')

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
    const items = data.data || data.contents || []
    const totalTime = Date.now() - startTime

    console.log(
      `✅ 트렌딩 조회 완료 - ${items.length}개 (${fetchTime}ms 조회, ${totalTime}ms 총시간)`
    )

    const transformed = transformYTAPIData(items)
    return transformed
  })
}

/**
 * YouTube 채널 정보 조회 (RapidAPI YouTube Channels API)
 * YT-API는 채널 정보가 검색에 포함되므로 별도 호출 불필요
 */
export async function getChannelInfo(
  channelId: string
): Promise<{
  subscriberCount: number
  country?: string
  viewCount?: number
  videoCount?: number
  verified?: boolean
}> {
  try {
    const url = new URL(`${API_BASE_URL}/channel/info`)
    url.searchParams.append('channel_id', channelId)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
      signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT),
    })

    if (!response.ok) {
      return { subscriberCount: 0 }
    }

    const data = await response.json()

    return {
      subscriberCount: parseSubscriberCount(data.subscribers),
      country: data.country,
      viewCount: data.views ? parseViewCount(data.views) : 0,
      videoCount: data.videoCount || 0,
      verified: data.verified || false,
    }
  } catch (error) {
    console.warn(`⚠️  채널 정보 조회 실패 - ${channelId}:`, error)
    return { subscriberCount: 0 }
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
