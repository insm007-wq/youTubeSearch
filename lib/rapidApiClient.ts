/**
 * RapidAPI YouTube V2 클라이언트 (최적화 버전)
 * 동접 500명 지원 설계
 */

// ============ 설정 ============
const API_BASE_URL = 'https://youtube-v2.p.rapidapi.com'
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST

// 동접 500명 지원을 위한 설정
const CONFIG = {
  // API 속도 제한 (동접별 요청 큐)
  MAX_CONCURRENT_REQUESTS: 10, // 동시 요청 수
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
class RequestQueue {
  private activeRequests = 0
  private queue: Array<() => Promise<any>> = []
  private maxConcurrent = CONFIG.MAX_CONCURRENT_REQUESTS

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        this.activeRequests++
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.activeRequests--
          this.processQueue()
        }
      }

      if (this.activeRequests < this.maxConcurrent) {
        this.activeRequests++
        fn()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this.activeRequests--
            this.processQueue()
          })
      } else {
        this.queue.push(task)
      }
    })
  }

  private processQueue() {
    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const task = this.queue.shift()
      if (task) {
        this.activeRequests++
        task()
          .then()
          .catch()
          .finally(() => {
            this.activeRequests--
            this.processQueue()
          })
      }
    }
  }

  getStatus() {
    return {
      activeRequests: this.activeRequests,
      queuedRequests: this.queue.length,
      maxConcurrent: this.maxConcurrent,
    }
  }
}

const requestQueue = new RequestQueue()

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
 */
function convertRelativeTimeToISO8601(relativeTime: string): string {
  if (!relativeTime) return new Date().toISOString()

  const now = new Date()
  const match = relativeTime.match(
    /^(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/
  )

  if (match) {
    const value = parseInt(match[1], 10)
    const unit = match[2]
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

  return now.toISOString()
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
 * RapidAPI 검색
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
    url.searchParams.append('lang', 'en')
    url.searchParams.append('country', 'us')

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
 * 데이터 변환
 */
function transformRapidAPIData(items: RapidAPIVideo[]): ApifyDataItem[] {
  return items.map((item) => ({
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
    categoryName: '기타',
    categoryIcon: 'Video',
    _needsDetailsFetch: item.video_length === 'SHORTS',
  }))
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

  const allDurations: string[] = []
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const durations = await Promise.all(
      batch.map((video) => getVideoDetails(video.id))
    )
    allDurations.push(...durations)

    // 배치 간 딜레이
    if (i < batches.length - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, CONFIG.SHORTS_REQUEST_DELAY)
      )
    }
  }

  // 결과 병합
  const updatedItems = items.map((item) => {
    const { _needsDetailsFetch, ...baseItem } = item as any

    if (item._needsDetailsFetch) {
      const detailIndex = shortVideos.findIndex((v) => v.id === item.id)
      const actualDuration = allDurations[detailIndex]

      if (actualDuration && actualDuration !== 'SHORTS') {
        return {
          ...baseItem,
          duration: convertDurationToISO8601(actualDuration),
        }
      }
    }

    return baseItem
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

    console.log(
      `✅ YouTube 검색 성공 - ${transformedItems.length}개${shortsCount > 0 ? ` (쇼츠 ${shortsCount}개)` : ''}`
    )
    return transformedItems
  } catch (error) {
    console.error('❌ YouTube 검색 실패:', error)
    throw error
  }
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
