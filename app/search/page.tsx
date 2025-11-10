'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SearchPage() {
  const [apiKey, setApiKey] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchHistory, setShowSearchHistory] = useState(false)
  const [searchHistory] = useState<string[]>([])
  const [savedSearchName, setSavedSearchName] = useState('')

  // 필터 상태
  const [uploadTime, setUploadTime] = useState('all')
  const [duration, setDuration] = useState('all')
  const [engagement, setEngagement] = useState('all')

  // 뷰 상태
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [sortBy, setSortBy] = useState('relevance')
  const [showTagAnalysis, setShowTagAnalysis] = useState(false)

  // 통계 데이터 (더미)
  const stats = [
    { label: '총 조회수', value: '0', type: 'views' },
    { label: '평균 구독자', value: '0', type: 'subscribers' },
    { label: '평균 비율', value: '0', type: 'ratio' },
    { label: '영상 개수', value: '0', type: 'count' },
  ]

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      {/* 왼쪽 사이드바 */}
      <div className="overflow-y-auto max-h-screen" style={{ width: '1000px', backgroundColor: 'white', borderRight: '1px solid #e5e5e5' }}>
        <div style={{ padding: '30px 40px' }}>
          {/* 타이틀 */}
          <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '30px', color: '#000' }}>
            YouTube 검색 & 분석
          </h1>

          {/* API 키 섹션 */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <label style={{ fontSize: '12px', color: '#999', fontWeight: 600, minWidth: '120px' }}>
                API 키
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="YouTube API 키 입력"
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
                    backgroundColor: '#ff4757',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minWidth: '60px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff3838'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff4757'}
                >
                  저장
                </button>
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#e5e5e5',
                    color: '#666',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minWidth: '60px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d5d5d5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e5e5e5'}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>

          {/* 검색 섹션 */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <label style={{ fontSize: '12px', color: '#999', fontWeight: 600, minWidth: '50px' }}>
                검색
              </label>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchHistory(true)}
                  onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                  placeholder="검색어 입력"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />

                {/* 검색 히스토리 드롭다운 */}
                {showSearchHistory && searchHistory.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderTop: 'none',
                      borderRadius: '0 0 4px 4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 10,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {searchHistory.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#666',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <span>{item}</span>
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#999',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '0 4px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ff4757'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 필터 섹션 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
            {/* 업로드 시간 */}
            <div>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                업로드 시간
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {[
                  { value: 'all', label: '전체' },
                  { value: '1h', label: '1시간 이내' },
                  { value: '24h', label: '24시간 이내' },
                  { value: '1w', label: '1주일 이내' },
                  { value: '1m', label: '1개월 이내' }
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
                    fontSize: '13px',
                    transition: 'all 0.2s ease'
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
                      name="uploadTime"
                      value={option.value}
                      checked={uploadTime === option.value}
                      onChange={(e) => setUploadTime(e.target.value)}
                      style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: '#4caf50' }}
                    />
                    <span style={{ fontWeight: uploadTime === option.value ? 600 : 400, color: uploadTime === option.value ? '#4caf50' : '#000' }}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 영상 길이 */}
            <div>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                영상 길이
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {[
                  { value: 'all', label: '전체' },
                  { value: '10plus', label: '10분 이상' },
                  { value: '4to20', label: '4분~20분' },
                  { value: '20plus', label: '20분 이상' }
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
                    fontSize: '13px',
                    transition: 'all 0.2s ease'
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
                      name="duration"
                      value={option.value}
                      checked={duration === option.value}
                      onChange={(e) => setDuration(e.target.value)}
                      style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: '#4caf50' }}
                    />
                    <span style={{ fontWeight: duration === option.value ? 600 : 400, color: duration === option.value ? '#4caf50' : '#000' }}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 구독자 대비 조회수 */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                구독자 대비 조회수 (engagement)
              </h3>
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
                    fontSize: '13px',
                    transition: 'all 0.2s ease'
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
                      style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: '#4caf50' }}
                    />
                    <span style={{ fontWeight: engagement === option.value ? 600 : 400, color: engagement === option.value ? '#4caf50' : '#000' }}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 저장된 검색 섹션 */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              저장된 검색
            </h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={savedSearchName}
                onChange={(e) => setSavedSearchName(e.target.value)}
                placeholder="이름"
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
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
              >
                저장
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {/* 저장된 검색 아이템들이 여기 표시됨 */}
            </div>
          </div>

          {/* 검색 버튼 */}
          <button
            style={{
              width: '100%',
              padding: '10px 24px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
          >
            검색 시작
          </button>
        </div>
      </div>

      {/* 오른쪽 컨텐츠 영역 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px 40px', overflowY: 'auto' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e5e5e5', gap: '20px', flexWrap: 'wrap' }}>
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
                minWidth: '160px'
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
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
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
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
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
                cursor: 'pointer',
                transition: 'all 0.2s ease'
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
                cursor: 'pointer',
                transition: 'all 0.2s ease'
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
              color: '#666',
              transition: 'all 0.2s ease'
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
            {showTagAnalysis ? '▼ 태그 분석 숨기기' : '▶ 태그 분석 보기'}
          </button>
        </div>

        {/* 결과 영역 - 빈 상태 */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: '#999' }}>
              왼쪽 필터에서 검색을 진행해주세요
            </p>
          </div>
        </div>

        {/* 하단 네비게이션 */}
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '12px', color: '#666', textDecoration: 'none', cursor: 'pointer' }}>
            ← 뒤로가기
          </Link>
          <div style={{ fontSize: '12px', color: '#999' }}>
            Phase 3: YouTube 검색 기능 구현 예정
          </div>
        </div>
      </div>
    </div>
  )
}
