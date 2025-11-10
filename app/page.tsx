import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 dark:from-zinc-950 dark:to-zinc-900">
      <main className="max-w-6xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="flex justify-between items-center mb-20">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              YouTube VPH Analyzer
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              YouTube 영상 검색 및 조회수 분석 도구
            </p>
          </div>
          <nav className="flex gap-4">
            <Link
              href="/login"
              className="px-6 py-3 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-lg hover:shadow-lg transition-shadow border border-gray-200 dark:border-zinc-700"
            >
              로그인
            </Link>
            <Link
              href="/search"
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              시작하기
            </Link>
          </nav>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              강력한 검색
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              YouTube 검색 필터링, 정렬, 구독자 대비 조회수 비율 분석
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              VPH 계산
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              정확한 Views Per Hour 계산 및 추세 분석
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">💾</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              데이터 저장
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              검색 기록, 즐겨찾기, Excel 내보내기 기능
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white dark:bg-zinc-800 p-12 rounded-lg shadow-md text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            지금 시작하세요
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Google, 카카오, 네이버 계정으로 간편하게 로그인하세요
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-lg font-semibold"
          >
            로그인하기
          </Link>
        </div>
      </main>
    </div>
  );
}
