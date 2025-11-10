'use client'

import { useState } from 'react'
import './search.css'

export default function Search() {
  const [searchInput, setSearchInput] = useState('')
  const [uploadPeriod, setUploadPeriod] = useState('all')
  const [videoLength, setVideoLength] = useState('all')
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
            {/* 기간 필터 */}
            <div className="filter-section">
              <div className="filter-title">기간 필터</div>
              <div className="filter-options">
                <label className="filter-option">
                  <input
                    type="radio"
                    name="uploadPeriod"
                    value="all"
                    checked={uploadPeriod === 'all'}
                    onChange={(e) => setUploadPeriod(e.target.value)}
                  />
                  <label>전체</label>
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="uploadPeriod"
                    value="1month"
                    checked={uploadPeriod === '1month'}
                    onChange={(e) => setUploadPeriod(e.target.value)}
                  />
                  <label>1개월</label>
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="uploadPeriod"
                    value="2months"
                    checked={uploadPeriod === '2months'}
                    onChange={(e) => setUploadPeriod(e.target.value)}
                  />
                  <label>2개월</label>
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="uploadPeriod"
                    value="6months"
                    checked={uploadPeriod === '6months'}
                    onChange={(e) => setUploadPeriod(e.target.value)}
                  />
                  <label>6개월</label>
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="uploadPeriod"
                    value="1year"
                    checked={uploadPeriod === '1year'}
                    onChange={(e) => setUploadPeriod(e.target.value)}
                  />
                  <label>1년</label>
                </label>
              </div>
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e5e5' }}>
                <label className="filter-option">
                  <input type="checkbox" id="showVPH" />
                  <label>VPH 표시</label>
                </label>
              </div>
            </div>

            {/* 길이 필터 */}
            <div className="filter-section">
              <div className="filter-title">길이 필터</div>
              <div className="filter-options">
                <label className="filter-option">
                  <input
                    type="radio"
                    name="videoLength"
                    value="all"
                    checked={videoLength === 'all'}
                    onChange={(e) => setVideoLength(e.target.value)}
                  />
                  <label>전체</label>
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="videoLength"
                    value="short"
                    checked={videoLength === 'short'}
                    onChange={(e) => setVideoLength(e.target.value)}
                  />
                  <label>숏폼(≤3분)</label>
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="videoLength"
                    value="long"
                    checked={videoLength === 'long'}
                    onChange={(e) => setVideoLength(e.target.value)}
                  />
                  <label>롱폼(&gt;3분)</label>
                </label>
              </div>
            </div>

            {/* 구독자 대비 조회수 비율 필터 */}
            <div className="engagement-section">
              <div className="engagement-title">구독자 대비 조회수 비율 단계(다중선택)</div>
              <div className="engagement-info">조회수/구독자 비율이 높을수록 채널의 실제 영향력이 큼</div>
              <div className="engagement-options">
                <label className="filter-option">
                  <input type="checkbox" name="engagementRatio" value="all" />
                  <label>전체</label>
                </label>
                <label className="filter-option">
                  <input type="checkbox" name="engagementRatio" value="1" />
                  <label>1단계 (&lt;0.2)</label>
                </label>
                <label className="filter-option">
                  <input type="checkbox" name="engagementRatio" value="2" />
                  <label>2단계 (0.2~0.6)</label>
                </label>
                <label className="filter-option">
                  <input type="checkbox" name="engagementRatio" value="3" />
                  <label>3단계 (0.6~1.4)</label>
                </label>
                <label className="filter-option">
                  <input type="checkbox" name="engagementRatio" value="4" defaultChecked />
                  <label>4단계 (1.4~3.0)</label>
                </label>
                <label className="filter-option">
                  <input type="checkbox" name="engagementRatio" value="5" defaultChecked />
                  <label>5단계 (≥3.0)</label>
                </label>
              </div>
            </div>
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

          {/* 결과 개수 */}
          <p className="results-count">총 {totalResults}개의 영상</p>

          {/* 통계 대시보드 */}
          <div className="statistics-dashboard">
            <div className="stat-card views">
              <div className="stat-label">총 조회수</div>
              <div className="stat-value">0</div>
            </div>
            <div className="stat-card subscribers">
              <div className="stat-label">평균 구독자</div>
              <div className="stat-value">0</div>
            </div>
            <div className="stat-card ratio">
              <div className="stat-label">평균 비율</div>
              <div className="stat-value">0</div>
            </div>
            <div className="stat-card count">
              <div className="stat-label">영상 개수</div>
              <div className="stat-value">0</div>
            </div>
          </div>

          {/* 결과 영역 */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
            {results.length === 0 ? (
              <div className="no-results">
                <p>왼쪽 필터에서 검색을 진행해주세요</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px',
                width: '100%',
                padding: '20px',
              }}>
                {results.map((video) => (
                  <a
                    key={video.id}
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      style={{
                        width: '100%',
                        height: '180px',
                        objectFit: 'cover',
                      }}
                    />
                    <div style={{ padding: '12px' }}>
                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        fontWeight: '600',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {video.title}
                      </h3>
                      <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '12px',
                        color: '#666',
                      }}>
                        {video.channelTitle}
                      </p>
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        fontSize: '12px',
                        color: '#999',
                      }}>
                        <span>조회: {(video.viewCount / 1000000).toFixed(1)}M</span>
                        <span>구독: {(video.subscriberCount / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
