/**
 * Google YouTube Channels API 클라이언트
 * 채널 정보(구독자 수) 조회
 */

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3'
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

interface YouTubeChannel {
  id: string
  title: string
  subscriberCount: number
  viewCount: number
  videoCount: number
}

/**
 * 채널 ID 목록으로 구독자 수 조회
 * @param channelIds 채널 ID 배열
 * @returns 채널 ID -> 구독자 수 Map
 */
export async function getChannelsSubscriberCounts(
  channelIds: string[]
): Promise<Map<string, number>> {
  const startTime = Date.now()

  if (!YOUTUBE_API_KEY) {
    console.warn('⚠️  YOUTUBE_API_KEY가 설정되지 않았습니다 - 구독자 정보 조회 건너뜀')
    return new Map()
  }

  if (channelIds.length === 0) {
    return new Map()
  }

  const map = new Map<string, number>()

  try {
    // YouTube API는 최대 50개 ID를 한 번에 처리 가능
    const chunks = []
    for (let i = 0; i < channelIds.length; i += 50) {
      chunks.push(channelIds.slice(i, i + 50))
    }

    for (const chunk of chunks) {
      const url = new URL(`${YOUTUBE_API_URL}/channels`)
      url.searchParams.append('part', 'statistics')
      url.searchParams.append('id', chunk.join(','))
      url.searchParams.append('key', YOUTUBE_API_KEY)

      const response = await fetch(url.toString())

      if (!response.ok) {
        const errorBody = await response.text()
        console.error(`❌ Google Channels API 실패 (${response.status}): ${errorBody.substring(0, 200)}`)
        throw new Error(`YouTube API 에러: ${response.status}`)
      }

      const data = await response.json()

      data.items?.forEach((item: any) => {
        const subscriberCount = item.statistics?.subscriberCount
          ? parseInt(item.statistics.subscriberCount)
          : 0
        map.set(item.id, subscriberCount)
      })
    }

    return map
  } catch (error) {
    console.error(`❌ Google Channels API 실패:`, error)
    throw error
  }
}

/**
 * 단일 채널 정보 조회
 */
export async function getChannelInfo(channelId: string): Promise<YouTubeChannel | null> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY가 설정되지 않았습니다')
  }

  try {
    const url = new URL(`${YOUTUBE_API_URL}/channels`)
    url.searchParams.append('part', 'statistics,snippet')
    url.searchParams.append('id', channelId)
    url.searchParams.append('key', YOUTUBE_API_KEY)

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`YouTube API 에러: ${response.status}`)
    }

    const data = await response.json()
    const item = data.items?.[0]

    if (!item) {
      return null
    }

    return {
      id: item.id,
      title: item.snippet?.title || '',
      subscriberCount: item.statistics?.subscriberCount
        ? parseInt(item.statistics.subscriberCount)
        : 0,
      viewCount: item.statistics?.viewCount
        ? parseInt(item.statistics.viewCount)
        : 0,
      videoCount: item.statistics?.videoCount
        ? parseInt(item.statistics.videoCount)
        : 0,
    }
  } catch (error) {
    console.error(`❌ 채널 조회 실패 (${channelId}):`, error)
    throw error
  }
}
