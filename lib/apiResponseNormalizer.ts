/**
 * RapidAPI YT-API 응답 정규화 계층
 * - 일관성 없는 필드명을 표준화
 * - Fallback 체인을 체계화
 * - 타입 안정성 제공
 */

/**
 * 정규화된 비디오 객체
 */
export interface NormalizedVideo {
  videoId: string
  title: string
  description: string
  channelId: string
  channelTitle: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  duration: string // ISO 8601 (PT12M34S)
  subscriberCount: number
  thumbnail: string
  keywords: string[]
  type: 'video' | 'shorts'
}

/**
 * 정규화된 채널 정보
 */
export interface NormalizedChannelInfo {
  channelId: string
  title: string
  description: string
  subscriberCount: number
  videoCount: number
  viewCount: number
  thumbnail: string
  banner: string
  country: string | null
  verified: boolean
  channelHandle: string
}

/**
 * YT-API 응답의 일관성 없는 필드명
 */
interface RawYTAPIVideo {
  [key: string]: any
}

/**
 * 안전한 필드 추출기 (Null-safe getter)
 */
class FieldExtractor {
  constructor(private data: any = {}) {}

  /**
   * 여러 필드명 시도하여 첫 번째 유효한 값 반환
   */
  getString(...fields: string[]): string {
    for (const field of fields) {
      const value = this.getNestedValue(field)
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }
    return ''
  }

  /**
   * 숫자로 변환 (실패 시 0 반환)
   */
  getNumber(...fields: string[]): number {
    for (const field of fields) {
      const value = this.getNestedValue(field)
      if (typeof value === 'number' && !isNaN(value)) {
        return value
      }
    }
    return 0
  }

  /**
   * 배열 반환 (실패 시 빈 배열)
   */
  getArray(...fields: string[]): any[] {
    for (const field of fields) {
      const value = this.getNestedValue(field)
      if (Array.isArray(value)) {
        return value
      }
    }
    return []
  }

  /**
   * 불린 반환 (실패 시 false)
   */
  getBoolean(...fields: string[]): boolean {
    for (const field of fields) {
      const value = this.getNestedValue(field)
      if (typeof value === 'boolean') {
        return value
      }
    }
    return false
  }

  /**
   * 중첩된 경로 안전하게 추출 ("channel.name" → data.channel.name)
   */
  private getNestedValue(path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], this.data)
  }
}

/**
 * 재생시간 파싱 (YT-API 형식 정규화)
 * Input: "PT12M34S" | "12:34" | "1:23:45" | "SHORTS"
 * Output: "PT12M34S"
 */
export function normalizeDuration(durationStr: string | number | undefined): string {
  if (!durationStr || durationStr === 'SHORTS') {
    return 'PT0S'
  }

  const str = String(durationStr).trim()

  // 이미 ISO 8601 형식
  if (str.startsWith('PT')) {
    return str
  }

  // MM:SS 또는 H:MM:SS 형식 변환
  const parts = str.split(':').map(p => parseInt(p, 10)).filter(n => !isNaN(n))

  let hours = 0,
    minutes = 0,
    seconds = 0

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
 * 상대 시간을 ISO 8601로 변환
 * "2 days ago" / "2일 전" → ISO 8601
 */
export function normalizePublishedDate(
  relativeTime: string | undefined,
  isoDate: string | undefined
): string {
  if (isoDate) {
    try {
      // 이미 ISO 8601이면 유효성 검사
      new Date(isoDate).toISOString()
      return isoDate
    } catch {
      // 유효하지 않으면 상대 시간 처리
    }
  }

  if (!relativeTime) {
    return new Date().toISOString()
  }

  const match = relativeTime.match(
    /(\d+)\s*(second|minute|hour|day|week|month|year|초|분|시간|일|주|달|년)s?\s*(?:ago)?/i
  )

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
 * 숫자 문자열 파싱 ("1.5M" → 1500000)
 */
export function parseNumberString(value: string | number | undefined): number {
  if (!value) return 0

  if (typeof value === 'number') {
    return isNaN(value) ? 0 : Math.floor(value)
  }

  const cleaned = String(value)
    .trim()
    .toUpperCase()
    .replace(/[^0-9.KMBT]/g, '') // 숫자, 점, K, M, B, T만 유지

  // "1.5M" → 1500000
  if (cleaned.includes('M')) {
    const num = parseFloat(cleaned.replace('M', '')) * 1_000_000
    return isNaN(num) ? 0 : Math.floor(num)
  }

  // "150K" → 150000
  if (cleaned.includes('K')) {
    const num = parseFloat(cleaned.replace('K', '')) * 1_000
    return isNaN(num) ? 0 : Math.floor(num)
  }

  // "150B" → 150000000000
  if (cleaned.includes('B')) {
    const num = parseFloat(cleaned.replace('B', '')) * 1_000_000_000
    return isNaN(num) ? 0 : Math.floor(num)
  }

  // "150T" → 150000000000000
  if (cleaned.includes('T')) {
    const num = parseFloat(cleaned.replace('T', '')) * 1_000_000_000_000
    return isNaN(num) ? 0 : Math.floor(num)
  }

  // 순수 숫자
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? 0 : num
}

/**
 * 썸네일 URL 추출
 * YT-API는 배열로 여러 해상도 제공, 마지막이 가장 고해상도
 */
export function extractThumbnail(data: any): string {
  const extractor = new FieldExtractor(data)

  // 배열의 마지막 항목 (고해상도)
  const thumbnailArray = extractor.getArray('thumbnail', 'thumbnails', 'richThumbnail')
  if (thumbnailArray.length > 0) {
    const lastItem = thumbnailArray[thumbnailArray.length - 1]
    if (typeof lastItem === 'object' && lastItem.url) {
      return lastItem.url
    }
  }

  // 문자열 직접 제공
  const stringThumb = extractor.getString('thumbnail', 'image', 'imgUrl', 'poster', 'thumb')
  if (stringThumb) {
    return stringThumb
  }

  return ''
}

/**
 * 비디오 정보 정규화
 */
export function normalizeVideo(raw: RawYTAPIVideo): NormalizedVideo {
  const extractor = new FieldExtractor(raw)

  // 비디오 ID 추출 (우선순위 중요!)
  let videoId =
    extractor.getString('videoId') ||
    extractor.getString('id') ||
    extractor.getString('vid')

  // URL에서 추출 (마지막 수단)
  if (!videoId) {
    const url = extractor.getString('url', 'link')
    const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
    videoId = match?.[1] || ''
  }

  // 채널 ID 추출
  let channelId = extractor.getString('channelId')
  if (!channelId && raw.channel) {
    const channelExtractor = new FieldExtractor(raw.channel)
    channelId = channelExtractor.getString('id', 'channelId')
  }

  // 조회수 (3가지 형식 지원)
  const viewCount = parseNumberString(
    extractor.getString('viewCountText') ||
      extractor.getString('viewCount') ||
      extractor.getNumber('views')
  )

  // 좋아요 수
  const likeCount = parseNumberString(extractor.getString('likeCount') || extractor.getNumber('likeCount'))

  // 댓글 수
  const commentCount = extractor.getNumber('commentCount')

  // 구독자 수
  let subscriberCount = parseNumberString(
    extractor.getString('subscriberCount') || extractor.getNumber('subscriberCount')
  )

  // 채널 객체에서도 시도
  if (!subscriberCount && raw.channel) {
    const channelExtractor = new FieldExtractor(raw.channel)
    subscriberCount = parseNumberString(
      channelExtractor.getString('subscribers') ||
        channelExtractor.getNumber('subscriberCount')
    )
  }

  // 제목
  const title = extractor.getString('title')

  // 설명
  const description = extractor.getString('description')

  // 채널명
  const channelTitle =
    extractor.getString('channelTitle') ||
    (raw.channel ? new FieldExtractor(raw.channel).getString('name') : '')

  // 발행 시간 (우선순위: ISO > 상대시간)
  const publishedAt = normalizePublishedDate(
    extractor.getString('publishedTimeText', 'publishedText', 'uploaded'),
    extractor.getString('publishedAt', 'publishDate')
  )

  // 재생시간
  const duration = normalizeDuration(
    extractor.getString('lengthText', 'duration')
  )

  // 썸네일
  const thumbnail = extractThumbnail(raw)

  // 키워드/태그
  const keywords = extractor.getArray('keywords', 'tags')

  // 타입 (기본: video)
  const type = (extractor.getString('type') === 'shorts' ? 'shorts' : 'video') as 'video' | 'shorts'

  // 로깅 (첫 항목만)
  if (process.env.DEBUG_NORMALIZATION === 'true') {
    console.log('[정규화] 비디오:', {
      videoId: videoId.substring(0, 5),
      title: title.substring(0, 30),
      viewCount,
      subscriberCount,
      duration,
    })
  }

  return {
    videoId,
    title,
    description,
    channelId,
    channelTitle,
    publishedAt,
    viewCount,
    likeCount,
    commentCount,
    duration,
    subscriberCount,
    thumbnail,
    keywords,
    type,
  }
}

/**
 * 채널 정보 정규화
 * YT-API는 /channel/about에서 응답을 meta 필드에 래핑
 */
export function normalizeChannelInfo(raw: any): NormalizedChannelInfo {
  // meta 필드 또는 직접 데이터
  const data = raw.meta || raw.data?.[0] || raw

  const extractor = new FieldExtractor(data)

  // 채널 ID
  const channelId =
    extractor.getString('channel_id') ||
    extractor.getString('id') ||
    extractor.getString('channelId')

  // 구독자 수
  const subscriberCount = parseNumberString(
    extractor.getString('subscriberCountText') ||
      extractor.getNumber('subscriberCount') ||
      extractor.getString('subscribers')
  )

  // 비디오 개수
  const videoCount = parseNumberString(
    extractor.getString('videosCountText') ||
      extractor.getNumber('videosCount') ||
      extractor.getNumber('videos')
  )

  // 썸네일 (avatar 배열)
  const avatarArray = extractor.getArray('avatar')
  let thumbnail = ''
  if (avatarArray.length > 0) {
    const lastAvatar = avatarArray[avatarArray.length - 1]
    thumbnail = lastAvatar?.url || ''
  }

  // 배너
  const bannerArray = extractor.getArray('banner')
  let banner = ''
  if (bannerArray.length > 0) {
    banner = bannerArray[0]?.url || ''
  }

  return {
    channelId,
    title: extractor.getString('title'),
    description: extractor.getString('description'),
    subscriberCount,
    videoCount,
    viewCount: 0, // YT-API는 채널 총 조회수 미제공
    thumbnail,
    banner,
    country: extractor.getString('country') || null,
    verified: extractor.getBoolean('verified'),
    channelHandle: extractor.getString('channelHandle'),
  }
}

/**
 * API 응답 래퍼 정규화 (data/contents/results 배열 추출)
 */
export function extractDataArray(response: any): any[] {
  if (Array.isArray(response)) {
    // 직접 배열
    return response
  }

  if (Array.isArray(response?.data)) {
    return response.data
  }

  if (Array.isArray(response?.contents)) {
    return response.contents
  }

  if (Array.isArray(response?.videos)) {
    return response.videos
  }

  if (Array.isArray(response?.results)) {
    return response.results
  }

  return []
}

/**
 * Shorts listing 필터링
 */
export function filterShortsListing(items: any[]): any[] {
  return items
    .flatMap(item => {
      // shorts_listing이면 중첩된 data 배열 반환
      if (item.type === 'shorts_listing' && Array.isArray(item.data)) {
        return item.data
      }
      return item
    })
    .filter(item => item.type !== 'shorts_listing')
}
