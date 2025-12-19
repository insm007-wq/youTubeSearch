/**
 * YouTube Video Type
 */
export interface YouTubeVideo {
  id: string
  title: string
  description: string
  channelTitle: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  subscriberCount?: number
  duration?: string
  categoryId?: string
  categoryName?: string
  categoryIcon?: string
}

/**
 * Search Filter Type
 */
export interface SearchFilter {
  uploadPeriod: 'hour' | 'today' | 'week' | 'month' | 'year'
  videoLength: 'short' | 'long' | 'channel'
  engagementRatio: string[]
}

/**
 * API Response Type
 */
export interface SearchResponse {
  videos: YouTubeVideo[]
  totalCount: number
  statistics?: {
    totalViews: number
    averageSubscribers: number
    averageRatio: number
  }
}
