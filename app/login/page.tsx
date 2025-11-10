'use client'

import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Back Link */}
        <Link
          href="/"
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 inline-flex items-center gap-2"
        >
          ← 뒤로가기
        </Link>

        {/* Login Card */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            로그인
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            원하는 계정으로 로그인하세요
          </p>

          {/* Login Buttons */}
          <div className="space-y-4">
            {/* Google Login */}
            <button
              onClick={() => alert('Google 로그인은 Phase 2에서 구현됩니다')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-gray-900 dark:text-white font-medium">
                Google로 로그인
              </span>
            </button>

            {/* Kakao Login */}
            <button
              onClick={() => alert('카카오 로그인은 Phase 2에서 구현됩니다')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#FEE500] hover:bg-[#FDD835] rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 5.58 2 10c0 2.62 1.35 4.95 3.42 6.5-.26 2.11-1.32 4.5-1.32 4.5s3.74-.63 5.26-1.58c.8.1 1.62.16 2.64.16 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
              </svg>
              <span className="font-medium">
                카카오로 로그인
              </span>
            </button>

            {/* Naver Login */}
            <button
              onClick={() => alert('네이버 로그인은 Phase 2에서 구현됩니다')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#00C73C] hover:bg-[#00B830] rounded-lg transition-colors text-white font-medium"
            >
              <span className="font-bold text-lg">N</span>
              <span>네이버로 로그인</span>
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-zinc-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              첫 로그인 시 계정이 자동으로 생성됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
