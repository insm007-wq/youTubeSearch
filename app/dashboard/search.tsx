'use client'

import { useState } from 'react'
import SearchResults from '@/app/components/SearchResults/SearchResults'
import PeriodFilter from '@/app/components/Filters/PeriodFilter/PeriodFilter'
import VideoLengthFilter from '@/app/components/Filters/VideoLengthFilter/VideoLengthFilter'
import VPHCheckbox from '@/app/components/Filters/VPHCheckbox/VPHCheckbox'
import EngagementRatioFilter from '@/app/components/Filters/EngagementRatioFilter/EngagementRatioFilter'
import './search.css'

export default function Search() {
  const [searchInput, setSearchInput] = useState('')
  const [uploadPeriod, setUploadPeriod] = useState('all')
  const [videoLength, setVideoLength] = useState('all')
  const [showVPH, setShowVPH] = useState(false)
  const [engagementRatios, setEngagementRatios] = useState<string[]>(['4', '5'])
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [totalResults, setTotalResults] = useState(0)

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      alert('검색어를 입력해주세요')
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchInput,
        uploadPeriod,
        videoDuration: videoLength === 'short' ? 'short' : videoLength === 'long' ? 'long' : 'any',
        maxResults: '20',
      })

      const response = await fetch(`/api/youtube_search?${params}`)
      const data = await response.json()

      if (!response.ok) {
        alert(`검색 실패: ${data.error || '알 수 없는 오류'}`)
        return
      }

      setResults(data.items || [])
      setTotalResults(data.totalResults || 0)
    } catch (error) {
      console.error('검색 오류:', error)
      alert('검색 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <>
      <div className="main-container">
        {/* 왼쪽 패널 */}
        <div className="sidebar">
          <div className="sidebar-title">크리에이티브허브</div>

          {/* 검색 섹션 */}
          <div className="search-section">
            <div className="search-label">검색어</div>
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder=""
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <div className="search-history-dropdown" id="searchHistory"></div>
            </div>
          </div>

          {/* 저장된 검색 섹션 */}
          <div className="saved-searches-section">
            <div className="saved-searches-title">💾 저장된 검색</div>
            <div className="saved-searches-controls">
              <input type="text" className="saved-search-name-input" placeholder="검색 이름 입력" />
              <button className="btn-save-search">저장</button>
            </div>
            <div className="saved-searches-list" id="savedSearchesList"></div>
          </div>

          {/* 필터 섹션 */}
          <div className="filters-wrapper">
            <PeriodFilter value={uploadPeriod} onChange={setUploadPeriod} />
            <VideoLengthFilter value={videoLength} onChange={setVideoLength} />
            <VPHCheckbox checked={showVPH} onChange={setShowVPH} />
            <EngagementRatioFilter
              selectedValues={engagementRatios}
              onChange={setEngagementRatios}
            />
          </div>
        </div>

        {/* 오른쪽 컨텐츠 영역 */}
        <div className="content">
          <div className="content-header">
            <div className="content-title">검색결과</div>
            <div className="controls-right">
              <div className="view-toggle">
                <button className="view-btn active">📇 카드</button>
                <button className="view-btn">📊 테이블</button>
              </div>
              <select className="sort-dropdown">
                <option value="relevance">조회수 + 내림차순</option>
                <option value="viewCount">조회수순</option>
                <option value="vph" style={{ display: 'none' }}>VPH순 (높음)</option>
                <option value="engagementRatio">비율순 (높음)</option>
                <option value="subscriberCount">구독자순</option>
                <option value="duration">길이순 (길음)</option>
                <option value="likeCount">좋아요순</option>
                <option value="publishedAt">최신순</option>
              </select>
              <button className="btn-excel">📥 엑셀</button>
              <button className="btn-search" onClick={handleSearch} disabled={isLoading}>
                {isLoading ? '검색 중...' : '검색'}
              </button>
            </div>
          </div>

          <SearchResults
            results={results}
            totalResults={totalResults}
            isLoading={isLoading}
            showVPH={showVPH}
          />
        </div>
      </div>
    </>
  )
}
