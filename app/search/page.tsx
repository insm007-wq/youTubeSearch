'use client'

import Link from 'next/link'

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 shadow-sm border-b border-gray-200 dark:border-zinc-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-2xl font-bold text-red-600 dark:text-red-400"
          >
            YouTube VPH
          </Link>
          <nav className="flex gap-4">
            <Link
              href="/search"
              className="px-4 py-2 text-gray-900 dark:text-white hover:text-red-600"
            >
              검색
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900"
            >
              대시보드
            </Link>
            <button
              onClick={() => alert('로그아웃은 Phase 2에서 구현됩니다')}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900"
            >
              로그아웃
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                필터
              </h2>

              {/* Search Box */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  검색어
                </label>
                <input
                  type="text"
                  placeholder="검색어 입력"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>

              {/* Upload Time Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  업로드 시간
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white">
                  <option>전체</option>
                  <option>1시간 이내</option>
                  <option>24시간 이내</option>
                  <option>1주일 이내</option>
                  <option>1개월 이내</option>
                </select>
              </div>

              {/* Video Duration */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  영상 길이
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white">
                  <option>전체</option>
                  <option>10분 이상</option>
                  <option>4분~20분</option>
                  <option>20분 이상</option>
                </select>
              </div>

              {/* Engagement Level */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  구독자 대비 조회수
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white">
                  <option>전체</option>
                  <option>1단계 (낮음)</option>
                  <option>2단계</option>
                  <option>3단계</option>
                  <option>4단계</option>
                  <option>5단계 (높음)</option>
                </select>
              </div>

              <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                검색
              </button>
            </div>
          </div>

          {/* Main Results Area */}
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">🔍 검색 기능은 Phase 3에서 구현됩니다</p>
                <p className="text-sm">로그인 후 검색어를 입력하여 시작하세요</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
