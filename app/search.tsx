'use client'

import { useState } from 'react'

export default function SearchLayout() {
  const [apiKey, setApiKey] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [showSearchHistory, setShowSearchHistory] = useState(false)
  const [savedSearchName, setSavedSearchName] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // 필터 상태
  const [uploadPeriod, setUploadPeriod] = useState('all')
  const [videoLength, setVideoLength] = useState('all')
  const [engagement, setEngagement] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')
  const [showTagAnalysis, setShowTagAnalysis] = useState(false)

  const stats = [
    { label: '총 조회수', value: '0', type: 'views' },
    { label: '평균 구독자', value: '0', type: 'subscribers' },
    { label: '평균 비율', value: '0', type: 'ratio' },
    { label: '영상 개수', value: '0', type: 'count' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto' }}>
      {/* 왼쪽 사이드바 */}
      <div style={{
        width: '1000px',
        backgroundColor: 'white',
        padding: '30px 40px',
        borderRight: '1px solid #e5e5e5',
        overflowY: 'auto',
        maxHeight: '100vh'
      }}>
        {/* 타이틀 */}
        <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '30px', color: '#000' }}>
          크리에이티브허브
        </div>

        {/* API 키 섹션 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
          <div style={{ fontSize: '12px', color: '#999', fontWeight: 600, minWidth: '120px' }}>
            API 키 (localStorage: yt_api_key)
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '13px',
              fontFamily: 'monospace',
              minWidth: '250px'
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#e5e5e5',
                color: '#666',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d5d5d5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e5e5e5'}
            >
              지우기
            </button>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#ff4757',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff3838'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff4757'}
            >
              저장
            </button>
          </div>
        </div>

        {/* 검색 섹션 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
          <div style={{ fontSize: '12px', color: '#999', fontWeight: 600, minWidth: '50px' }}>
            검색어
          </div>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setShowSearchHistory(true)}
              onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* 저장된 검색 섹션 */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            💾 저장된 검색
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              value={savedSearchName}
              onChange={(e) => setSavedSearchName(e.target.value)}
              placeholder="검색 이름 입력"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
            >
              저장
            </button>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          {/* 기간 필터 */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              기간 필터
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {[
                { value: 'all', label: '전체' },
                { value: '1month', label: '1개월' },
                { value: '2months', label: '2개월' },
                { value: '3months', label: '3개월' },
                { value: '6months', label: '6개월' }
              ].map((option) => (
                <label key={option.value} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#efefef'
                    e.currentTarget.style.borderColor = '#ccc'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                    e.currentTarget.style.borderColor = '#ddd'
                  }}>
                  <input
                    type="radio"
                    name="uploadPeriod"
                    value={option.value}
                    checked={uploadPeriod === option.value}
                    onChange={(e) => setUploadPeriod(e.target.value)}
                    style={{ accentColor: '#4caf50' }}
                  />
                  <span style={{ fontWeight: uploadPeriod === option.value ? 600 : 400, color: uploadPeriod === option.value ? '#4caf50' : '#000' }}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 영상 길이 필터 */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              영상 길이
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {[
                { value: 'all', label: '전체' },
                { value: 'short', label: '4분 이하' },
                { value: 'medium', label: '4분-20분' },
                { value: 'long', label: '20분 이상' }
              ].map((option) => (
                <label key={option.value} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#efefef'
                    e.currentTarget.style.borderColor = '#ccc'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                    e.currentTarget.style.borderColor = '#ddd'
                  }}>
                  <input
                    type="radio"
                    name="videoLength"
                    value={option.value}
                    checked={videoLength === option.value}
                    onChange={(e) => setVideoLength(e.target.value)}
                    style={{ accentColor: '#4caf50' }}
                  />
                  <span style={{ fontWeight: videoLength === option.value ? 600 : 400, color: videoLength === option.value ? '#4caf50' : '#000' }}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Engagement 필터 */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              구독자 대비 조회수 (engagement)
            </div>
            <p style={{ fontSize: '11px', color: '#999', marginBottom: '12px', fontStyle: 'italic' }}>
              높을수록 더 많은 사람들이 영상을 시청했습니다
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {[
                { value: 'all', label: '전체' },
                { value: '1', label: '1단계' },
                { value: '2', label: '2단계' },
                { value: '3', label: '3단계' },
                { value: '4', label: '4단계' },
                { value: '5', label: '5단계' }
              ].map((option) => (
                <label key={option.value} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#efefef'
                    e.currentTarget.style.borderColor = '#ccc'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                    e.currentTarget.style.borderColor = '#ddd'
                  }}>
                  <input
                    type="radio"
                    name="engagement"
                    value={option.value}
                    checked={engagement === option.value}
                    onChange={(e) => setEngagement(e.target.value)}
                    style={{ accentColor: '#4caf50' }}
                  />
                  <span style={{ fontWeight: engagement === option.value ? 600 : 400, color: engagement === option.value ? '#4caf50' : '#000' }}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽 컨텐츠 영역 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px 40px', overflowY: 'auto', backgroundColor: '#fafafa' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #ddd', gap: '20px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#333', margin: 0 }}>
            검색 결과
          </h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* 정렬 드롭다운 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '13px',
                backgroundColor: 'white',
                cursor: 'pointer',
                minWidth: '160px',
                fontFamily: 'inherit'
              }}
            >
              <option value="relevance">관련성 순</option>
              <option value="views">조회수 순</option>
              <option value="recent">최신순</option>
              <option value="vph">VPH 순</option>
            </select>

            {/* 카드/테이블 토글 */}
            <div style={{ display: 'flex', gap: '4px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: viewMode === 'grid' ? '#4caf50' : 'white',
                  color: viewMode === 'grid' ? 'white' : '#666',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                카드
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: viewMode === 'table' ? '#4caf50' : 'white',
                  color: viewMode === 'table' ? 'white' : '#666',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                테이블
              </button>
            </div>

            {/* 검색 버튼 */}
            <button
              style={{
                backgroundColor: '#4caf50',
                color: 'white',
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
            >
              검색
            </button>

            {/* Excel 내보내기 */}
            <button
              style={{
                backgroundColor: '#1abc9c',
                color: 'white',
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#16a085'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1abc9c'}
            >
              Excel
            </button>
          </div>
        </div>

        {/* 결과 개수 */}
        <p style={{ fontSize: '13px', color: '#999', marginBottom: '20px' }}>
          총 0개의 영상
        </p>

        {/* 통계 대시보드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          {stats.map((stat) => {
            const gradients: {[key: string]: string} = {
              views: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              subscribers: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              ratio: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              count: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
            }
            return (
              <div
                key={stat.type}
                style={{
                  background: gradients[stat.type],
                  color: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>
                  {stat.value}
                </div>
              </div>
            )
          })}
        </div>

        {/* 태그 분석 토글 */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowTagAnalysis(!showTagAnalysis)}
            style={{
              fontSize: '12px',
              cursor: 'pointer',
              padding: '6px 12px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              color: '#666'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#efefef'
              e.currentTarget.style.borderColor = '#ccc'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
              e.currentTarget.style.borderColor = '#ddd'
            }}
          >
            {showTagAnalysis ? '▼ 태그 분석' : '▶ 태그 분석'}
          </button>
        </div>

        {/* 결과 영역 */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#999' }}>
            <p>왼쪽 필터에서 검색을 진행해주세요</p>
          </div>
        </div>
      </div>
    </div>
  )
}
