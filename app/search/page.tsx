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

  return (
    <div className="flex min-h-screen bg-[#fafafa]" style={{ backgroundColor: '#fafafa' }}>
      {/* 왼쪽 사이드바 */}
      <div className="w-[1000px] bg-white border-r border-[#e5e5e5] overflow-y-auto max-h-screen" style={{ width: '1000px', backgroundColor: 'white' }}>
        <div className="p-[30px_40px]">
          {/* 타이틀 */}
          <h1 className="text-[20px] font-bold mb-[30px] text-black" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '30px' }}>
            YouTube 검색 & 분석
          </h1>

          {/* API 키 섹션 */}
          <div className="mb-[30px]">
            <div className="flex items-center gap-[20px]">
              <label className="text-[12px] text-[#999] font-semibold min-w-[120px]" style={{ fontSize: '12px', color: '#999', fontWeight: 600 }}>
                API 키
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="YouTube API 키 입력"
                className="flex-1 px-[14px] py-[10px] border border-[#ddd] rounded text-[13px] font-mono min-w-[250px]"
                style={{ fontSize: '13px', borderRadius: '4px' }}
              />
              <div className="flex gap-[8px]">
                <button className="px-[16px] py-[8px] bg-[#ff4757] text-white rounded text-[12px] font-semibold cursor-pointer hover:bg-[#ff3838] transition-all"
                  style={{ backgroundColor: '#ff4757', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                  저장
                </button>
                <button className="px-[16px] py-[8px] bg-[#e5e5e5] text-[#666] rounded text-[12px] font-semibold cursor-pointer hover:bg-[#d5d5d5] transition-all"
                  style={{ backgroundColor: '#e5e5e5', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                  삭제
                </button>
              </div>
            </div>
          </div>

          {/* 검색 섹션 */}
          <div className="mb-[30px]">
            <div className="flex items-center gap-[20px]">
              <label className="text-[12px] text-[#999] font-semibold min-w-[50px]" style={{ fontSize: '12px', color: '#999', fontWeight: 600 }}>
                검색
              </label>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchHistory(true)}
                  onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                  placeholder="검색어 입력"
                  className="w-full px-[14px] py-[12px] border border-[#ddd] rounded text-[14px]"
                  style={{ fontSize: '14px', borderRadius: '4px' }}
                />

                {/* 검색 히스토리 드롭다운 */}
                {showSearchHistory && searchHistory.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-[#ddd] border-t-0 rounded-b max-h-[200px] overflow-y-auto z-10 shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
                    style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                    {searchHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="px-[14px] py-[10px] border-b border-[#f0f0f0] cursor-pointer text-[13px] text-[#666] flex justify-between items-center hover:bg-[#f5f5f5]"
                        style={{ fontSize: '13px', color: '#666' }}
                      >
                        <span>{item}</span>
                        <button className="bg-none border-none text-[#999] cursor-pointer text-[12px] hover:text-[#ff4757]"
                          style={{ color: '#999', fontSize: '12px' }}>
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
          <div className="grid grid-cols-2 gap-[30px] mb-[30px]">
            {/* 업로드 시간 */}
            <div>
              <h3 className="text-[12px] font-bold text-black mb-[12px] uppercase tracking-wider"
                style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>
                업로드 시간
              </h3>
              <div className="flex flex-wrap gap-[10px]">
                {[
                  { value: 'all', label: '전체' },
                  { value: '1h', label: '1시간 이내' },
                  { value: '24h', label: '24시간 이내' },
                  { value: '1w', label: '1주일 이내' },
                  { value: '1m', label: '1개월 이내' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-[6px] px-[14px] py-[8px] bg-[#f5f5f5] border border-[#ddd] rounded-full cursor-pointer text-[13px] hover:bg-[#efefef] hover:border-[#ccc] transition-all"
                    style={{ borderRadius: '20px', fontSize: '13px' }}>
                    <input
                      type="radio"
                      name="uploadTime"
                      value={option.value}
                      checked={uploadTime === option.value}
                      onChange={(e) => setUploadTime(e.target.value)}
                      className="w-[14px] h-[14px] cursor-pointer accent-[#4caf50]"
                      style={{ accentColor: '#4caf50' }}
                    />
                    <span className={uploadTime === option.value ? 'font-semibold text-[#4caf50]' : ''}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 영상 길이 */}
            <div>
              <h3 className="text-[12px] font-bold text-black mb-[12px] uppercase tracking-wider"
                style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>
                영상 길이
              </h3>
              <div className="flex flex-wrap gap-[10px]">
                {[
                  { value: 'all', label: '전체' },
                  { value: '10plus', label: '10분 이상' },
                  { value: '4to20', label: '4분~20분' },
                  { value: '20plus', label: '20분 이상' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-[6px] px-[14px] py-[8px] bg-[#f5f5f5] border border-[#ddd] rounded-full cursor-pointer text-[13px] hover:bg-[#efefef] hover:border-[#ccc] transition-all"
                    style={{ borderRadius: '20px', fontSize: '13px' }}>
                    <input
                      type="radio"
                      name="duration"
                      value={option.value}
                      checked={duration === option.value}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-[14px] h-[14px] cursor-pointer accent-[#4caf50]"
                      style={{ accentColor: '#4caf50' }}
                    />
                    <span className={duration === option.value ? 'font-semibold text-[#4caf50]' : ''}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 구독자 대비 조회수 */}
            <div className="col-span-2">
              <h3 className="text-[12px] font-bold text-black mb-[12px] uppercase tracking-wider"
                style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>
                구독자 대비 조회수 (engagement)
              </h3>
              <p className="text-[11px] text-[#999] mb-[12px] italic" style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
                높을수록 더 많은 사람들이 영상을 시청했습니다
              </p>
              <div className="flex flex-wrap gap-[10px]">
                {[
                  { value: 'all', label: '전체' },
                  { value: '1', label: '1단계' },
                  { value: '2', label: '2단계' },
                  { value: '3', label: '3단계' },
                  { value: '4', label: '4단계' },
                  { value: '5', label: '5단계' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-[6px] px-[14px] py-[8px] bg-[#f5f5f5] border border-[#ddd] rounded-full cursor-pointer text-[13px] hover:bg-[#efefef] hover:border-[#ccc] transition-all"
                    style={{ borderRadius: '20px', fontSize: '13px' }}>
                    <input
                      type="radio"
                      name="engagement"
                      value={option.value}
                      checked={engagement === option.value}
                      onChange={(e) => setEngagement(e.target.value)}
                      className="w-[14px] h-[14px] cursor-pointer accent-[#4caf50]"
                      style={{ accentColor: '#4caf50' }}
                    />
                    <span className={engagement === option.value ? 'font-semibold text-[#4caf50]' : ''}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 저장된 검색 섹션 */}
          <div className="mb-[30px]">
            <h3 className="text-[12px] font-bold text-black mb-[12px] uppercase tracking-wider"
              style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>
              저장된 검색
            </h3>
            <div className="flex gap-[8px] mb-[12px]">
              <input
                type="text"
                value={savedSearchName}
                onChange={(e) => setSavedSearchName(e.target.value)}
                placeholder="이름"
                className="flex-1 px-[12px] py-[8px] border border-[#ddd] rounded text-[12px]"
                style={{ fontSize: '12px', borderRadius: '4px' }}
              />
              <button className="px-[16px] py-[8px] bg-[#4caf50] text-white rounded text-[12px] font-semibold cursor-pointer hover:bg-[#45a049] transition-all"
                style={{ backgroundColor: '#4caf50', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                저장
              </button>
            </div>
            <div className="flex flex-wrap gap-[8px]">
              {/* 저장된 검색 아이템들이 여기 표시됨 */}
            </div>
          </div>

          {/* 검색 버튼 */}
          <button className="w-full px-[16px] py-[12px] bg-[#ff4757] text-white rounded text-[14px] font-semibold cursor-pointer hover:bg-[#ff3838] transition-all"
            style={{ backgroundColor: '#ff4757', borderRadius: '4px', fontSize: '14px', fontWeight: 600 }}>
            검색 시작
          </button>
        </div>
      </div>

      {/* 오른쪽 컨텐츠 영역 */}
      <div className="flex-1 p-[30px_40px] overflow-y-auto flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-[20px] pb-[20px] border-b border-[#e5e5e5]">
          <div>
            <h2 className="text-[24px] font-bold text-black" style={{ fontSize: '24px', fontWeight: 700 }}>
              검색 결과
            </h2>
            <p className="text-[14px] text-[#666] mt-[5px]">총 0개의 영상</p>
          </div>
          <div className="flex gap-[8px]">
            <button className="px-[16px] py-[8px] border border-[#ddd] bg-white text-[#333] rounded text-[12px] font-semibold cursor-pointer hover:bg-[#f5f5f5]"
              style={{ fontSize: '12px', fontWeight: 600, borderRadius: '4px' }}>
              카드 보기
            </button>
            <button className="px-[16px] py-[8px] border border-[#ddd] bg-white text-[#333] rounded text-[12px] font-semibold cursor-pointer hover:bg-[#f5f5f5]"
              style={{ fontSize: '12px', fontWeight: 600, borderRadius: '4px' }}>
              테이블 보기
            </button>
          </div>
        </div>

        {/* 결과 영역 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[16px] text-[#999]" style={{ fontSize: '16px', color: '#999' }}>
              왼쪽 필터에서 검색을 진행해주세요
            </p>
          </div>
        </div>

        {/* 하단 네비게이션 */}
        <div className="mt-[20px] pt-[20px] border-t border-[#e5e5e5] flex justify-between items-center">
          <Link href="/" className="text-[12px] text-[#666] hover:text-[#333] cursor-pointer">
            ← 뒤로가기
          </Link>
          <div className="text-[12px] text-[#999]">
            Phase 3: YouTube 검색 기능 구현 예정
          </div>
        </div>
      </div>
    </div>
  )
}
