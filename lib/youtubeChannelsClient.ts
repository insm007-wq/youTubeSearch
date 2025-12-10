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
    console.log(`🔍 Google Channels API 요청 시작`)
    console.log(`   - 채널 수: ${channelIds.length}개`)
    console.log(`   - API Key 존재: ${YOUTUBE_API_KEY ? '✓' : '✗'}`)

    // YouTube API는 최대 50개 ID를 한 번에 처리 가능
    const chunks = []
    for (let i = 0; i < channelIds.length; i += 50) {
      chunks.push(channelIds.slice(i, i + 50))
    }

    for (const chunk of chunks) {
      try {
        const url = new URL(`${YOUTUBE_API_URL}/channels`)
        url.searchParams.append('part', 'statistics')
        url.searchParams.append('id', chunk.join(','))
        url.searchParams.append('key', YOUTUBE_API_KEY)

        console.log(`📡 Google API 요청:`)
        console.log(`   - URL: ${url.toString().substring(0, 100)}...`)
        console.log(`   - Channel IDs count: ${chunk.length}`)

        const fetchStart = Date.now()
        const response = await fetch(url.toString())
        const fetchTime = Date.now() - fetchStart

        if (!response.ok) {
          const errorBody = await response.text()
          console.error(
            `❌ Google Channels API 실패 - Status: ${response.status}`
          )
          console.error(`   - 요청 URL: ${url.toString().substring(0, 200)}`)
          console.error(`   - 응답 본문: ${errorBody}`)

          // 응답 본문 파싱 시도
          try {
            const errorJson = JSON.parse(errorBody)
            console.error(`   - 에러 상세:`, errorJson)
          } catch (e) {
            // JSON 파싱 실패는 무시
          }

          throw new Error(`YouTube API 에러: ${response.status} - ${errorBody}`)
        }

        const parseStart = Date.now()
        const data = await response.json()
        const parseTime = Date.now() - parseStart

        console.log(
          `   - Chunk (${chunk.length}개): ${fetchTime}ms fetch + ${parseTime}ms parse`
        )

        data.items?.forEach((item: any) => {
          const subscriberCount = item.statistics?.subscriberCount
            ? parseInt(item.statistics.subscriberCount)
            : 0
          map.set(item.id, subscriberCount)
        })
      } catch (chunkError) {
        console.error(`❌ Chunk 처리 중 에러:`, chunkError)
        throw chunkError
      }
    }

    const totalTime = Date.now() - startTime
    console.log(
      `✅ Google Channels API 완료 - ${map.size}개 채널 (${totalTime}ms)`
    )

    return map
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`❌ Google Channels API 실패 (${totalTime}ms):`, error)
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
