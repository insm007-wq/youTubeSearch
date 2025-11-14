'use client'

import VideoCard from '@/app/components/VideoCard/VideoCard'
import ResultsTable from '@/app/components/ResultsTable/ResultsTable'
import TagAnalysisDashboard from '@/app/components/TagAnalysisDashboard/TagAnalysisDashboard'

interface SearchResultsProps {
  results: any[]
  totalResults: number
  isLoading: boolean
  showVPH?: boolean
  viewMode: 'card' | 'table'
  onChannelClick?: (channelId: string, channelTitle: string) => void
  onCommentsClick?: (videoId: string, videoTitle: string) => void
}

export default function SearchResults({
  results,
  totalResults,
  isLoading,
  showVPH = false,
  viewMode,
  onChannelClick,
  onCommentsClick,
}: SearchResultsProps) {
  // 통계 계산
  const stats = results.length > 0 ? {
    totalViews: results.reduce((sum, video) => sum + video.viewCount, 0),
    avgSubscribers: Math.round(
      results.reduce((sum, video) => sum + video.subscriberCount, 0) / results.length
    ),
    avgRatio: (
      results.reduce((sum, video) =>
        sum + (video.subscriberCount > 0 ? video.viewCount / video.subscriberCount : 0),
      0) / results.length
    ).toFixed(2),
    videoCount: results.length,
  } : {
    totalViews: 0,
    avgSubscribers: 0,
    avgRatio: '0',
    videoCount: 0,
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* 결과 개수 */}
      <p className="results-count">검색결과 {results.length}개</p>

      {/* 통계 대시보드 */}
      <div className="statistics-dashboard">
        <div className="stat-card views">
          <div className="stat-label">총 조회수</div>
          <div className="stat-value">{formatNumber(stats.totalViews)}</div>
        </div>
        <div className="stat-card subscribers">
          <div className="stat-label">평균 구독자</div>
          <div className="stat-value">{formatNumber(stats.avgSubscribers)}</div>
        </div>
        <div className="stat-card ratio">
          <div className="stat-label">평균 비율</div>
          <div className="stat-value">{stats.avgRatio}</div>
        </div>
        <div className="stat-card count">
          <div className="stat-label">영상 개수</div>
          <div className="stat-value">{stats.videoCount}</div>
        </div>
      </div>

      {/* 태그 분석 대시보드 */}
      <TagAnalysisDashboard results={results} />

      {/* 결과 영역 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
        {isLoading ? (
          <div className="no-results">
            <p>검색 중...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="no-results">
            <p>왼쪽 필터에서 검색을 진행해주세요</p>
          </div>
        ) : viewMode === 'card' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '12px',
            width: '100%',
            padding: '20px',
          }}>
            {results.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                showVPH={showVPH}
                onChannelClick={onChannelClick}
                onCommentsClick={onCommentsClick}
              />
            ))}
          </div>
        ) : (
          <ResultsTable results={results} showVPH={showVPH} />
        )}
      </div>
    </div>
  )
}
