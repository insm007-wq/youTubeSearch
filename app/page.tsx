"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={`min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center px-6 py-16 relative`}>
      {/* 메인 콘텐츠 */}
      <div className={`text-center max-w-3xl w-full ${styles.animateFadeInUp}`}>
        {/* 헤더 섹션 */}
        <div className="mb-20">
          {/* 태그 */}
          <div className="inline-block mb-8 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-widest uppercase">YouTube 분석</span>
          </div>

          {/* 메인 제목 */}
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
            유튜브 스카우트
          </h1>

          {/* 데코레이션 라인 */}
          <div className="h-1.5 w-20 bg-gray-900 dark:bg-blue-400 mx-auto mb-12 rounded-full"></div>

          {/* 서브 제목 */}
          <p className="text-2xl md:text-3xl font-light text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
            영상 분석의 <span className="font-semibold">새로운 기준</span>
          </p>

          {/* 설명 */}
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-24 leading-relaxed max-w-2xl mx-auto font-light">
            고급 검색 필터와 실시간 통계로 콘텐츠 트렌드를 정확하게 파악하세요. 데이터 기반의 의사결정으로 경쟁에서 앞서가세요.
          </p>
        </div>

        {/* 기능 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-24">
          {/* 기능 1 */}
          <div className="text-left group">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg mb-5 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors"></div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">정밀한 검색</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm font-light">
              기간, 길이, 구독자 비율 등 다양한 조건으로 정확하게 영상을 찾으세요. 고도의 필터링으로 시간을 절약합니다.
            </p>
          </div>

          {/* 기능 2 */}
          <div className="text-left group">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg mb-5 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors"></div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">심층 분석</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm font-light">
              조회수, 구독자, 참여율 등 핵심 지표를 한눈에 비교하고 분석하세요. 실시간 대시보드에서 모든 정보를 확인합니다.
            </p>
          </div>

          {/* 기능 3 */}
          <div className="text-left group">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg mb-5 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors"></div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">데이터 내보내기</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm font-light">
              분석 결과를 CSV, Excel 등 다양한 형식으로 저장하세요. 검색 조건을 저장해 재사용할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 통계 섹션 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-28 pb-16 border-b border-gray-200 dark:border-gray-800">
          {[
            { number: "10M+", label: "분석된 영상" },
            { number: "500K+", label: "활성 사용자" },
            { number: "99.9%", label: "가용성" },
            { number: "0.5s", label: "검색 속도" }
          ].map((stat, idx) => (
            <div key={idx} className="text-center hover:opacity-75 transition-opacity">
              <div className="text-4xl md:text-5xl font-black text-gray-800 dark:text-white mb-3 tracking-tighter">
                {stat.number}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA 섹션 */}
        <div className="flex flex-col items-center gap-8 pt-8">
          {/* 시작하기 버튼 */}
          <Link
            href="/dashboard"
            className="inline-block bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-4 px-14 rounded-lg text-base transition-all duration-300 hover:bg-gray-800 dark:hover:bg-gray-100 hover:shadow-lg no-underline"
          >
            시작하기
          </Link>

          {/* 로그인 링크 */}
          <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
            이미 계정이 있나요?{" "}
            <Link
              href="/login"
              className="text-gray-900 dark:text-white font-semibold hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
