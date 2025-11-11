"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-black flex flex-col items-center justify-center px-4 py-12">
      {/* 메인 콘텐츠 */}
      <div className={`text-center max-w-3xl ${styles.animateFadeInUp}`}>
        {/* 로고/제title */}
        <div className="mb-6">
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 tracking-tight">
            유튜브 스카우트
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* 부제목 */}
        <p className="text-2xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">YouTube 영상 분석의 새로운 기준</p>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-16 leading-relaxed">
          고급 검색 필터와 실시간 통계로 콘텐츠 트렌드를 빠르게 파악하세요
        </p>

        {/* 주요 기능 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* 기능 1 */}
          <div className={`${styles.glassCard} rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 group`}>
            <div className={`text-6xl mb-4 inline-block group-hover:${styles.animateFloat}`}>📊</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">정밀한 검색</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              기간, 영상 길이, 구독자 비율별로 원하는 콘텐츠를 정확하게 찾으세요
            </p>
          </div>

          {/* 기능 2 */}
          <div className={`${styles.glassCard} rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 group`}>
            <div className={`text-6xl mb-4 inline-block group-hover:${styles.animateFloat}`}>📈</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">심층 분석</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              조회수, 구독자, 참여율 등 주요 지표를 한눈에 파악하고 비교하세요
            </p>
          </div>

          {/* 기능 3 */}
          <div className={`${styles.glassCard} rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 group`}>
            <div className={`text-6xl mb-4 inline-block group-hover:${styles.animateFloat}`}>💾</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">데이터 내보내기</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              분석 결과를 엑셀로 저장하고 검색을 저장하여 재사용하세요
            </p>
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="space-y-6">
          {/* 시작하기 버튼 */}
          <Link
            href="/dashboard"
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-16 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 no-underline"
          >
            지금 시작하기
          </Link>

          {/* 로그인 링크 */}
          <p className="text-gray-600 dark:text-gray-400">
            이미 계정이 있나요?{" "}
            <Link
              href="/login"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
            >
              로그인
            </Link>
          </p>
        </div>
      </div>

      {/* 하단 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-10 -z-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-10 -z-10"></div>
      </div>
    </div>
  );
}
