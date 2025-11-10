'use client'

import './search.css'

export default function Search() {
  return (
    <>
      <div className="main-container">
        {/* 왼쪽 패널 */}
        <div className="sidebar">
          <div className="sidebar-title">크리에이티브허브</div>

          {/* API 키 섹션 */}
          <div className="api-section">
            <div className="api-label">API 키 (localStorage: yt_api_key)</div>
            <input type="password" className="api-input" placeholder="YouTube API 키" />
            <div className="btn-group">
              <button className="btn btn-delete">지우기</button>
              <button className="btn btn-save">저장</button>
            </div>
          </div>

          {/* 검색 섹션 */}
          <div className="search-section">
            <div className="search-label">검색어</div>
            <div className="search-container">
              <input type="text" className="search-input" placeholder="" />
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
                  <input type="radio" name="uploadPeriod" value="all" defaultChecked />
                  <label>전체</label>
                </label>
                <label className="filter-option">
                  <input type="radio" name="uploadPeriod" value="1month" />
                  <label>1개월</label>
                </label>
                <label className="filter-option">
                  <input type="radio" name="uploadPeriod" value="2months" />
                  <label>2개월</label>
                </label>
                <label className="filter-option">
                  <input type="radio" name="uploadPeriod" value="6months" />
                  <label>6개월</label>
                </label>
                <label className="filter-option">
                  <input type="radio" name="uploadPeriod" value="1year" />
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
                  <input type="radio" name="videoLength" value="all" defaultChecked />
                  <label>전체</label>
                </label>
                <label className="filter-option">
                  <input type="radio" name="videoLength" value="short" />
                  <label>숏폼(≤3분)</label>
                </label>
                <label className="filter-option">
                  <input type="radio" name="videoLength" value="long" />
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
              <button className="btn-search">검색</button>
            </div>
          </div>

          {/* 결과 개수 */}
          <p className="results-count">총 0개의 영상</p>

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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="no-results">
              <p>왼쪽 필터에서 검색을 진행해주세요</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
