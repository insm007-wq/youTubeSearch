/**
 * 유튜브 영상 관련 타입 정의
 */

export interface Video {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnail: string;
  viewCount: number;
  subscriberCount: number;
  duration: string;
  likeCount: number;
  commentCount: number;
  tags?: string[];
}

export interface SearchResult {
  items: Video[];
  totalResults: number;
}

export interface EngagementStats {
  totalViews: number;
  avgSubscribers: number;
  avgEngagementRatio: number;
  avgLikes: number;
}

export interface FilterOptions {
  uploadPeriod: string;
  videoLength: string;
  engagementRatios: string[];
}

export interface SortOptions {
  sortBy: string;
}
