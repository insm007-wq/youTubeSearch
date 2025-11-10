'use client'

import Link from 'next/link'

export default function DashboardPage() {
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
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900"
            >
              검색
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-900 dark:text-white hover:text-red-600"
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
        {/* Welcome Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            대시보드
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            저장된 검색 결과와 검색 기록을 확인하세요
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                  저장된 검색
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  0
                </p>
              </div>
              <div className="text-3xl">📌</div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                  검색 기록
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  0
                </p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                  추적 중인 영상
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  0
                </p>
              </div>
              <div className="text-3xl">🎬</div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Saved Searches */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              저장된 검색
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              저장된 검색이 없습니다
            </p>
          </div>

          {/* Recent Searches */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              최근 검색
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              검색 기록이 없습니다
            </p>
          </div>
        </div>

        {/* Start Searching CTA */}
        <div className="text-center mt-12">
          <Link
            href="/search"
            className="inline-block px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg"
          >
            검색 시작하기
          </Link>
        </div>
      </main>
    </div>
  )
}
