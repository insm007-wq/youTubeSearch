"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={`min-h-screen ${styles.darkPremiumBg} flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden`}>
      {/* 메인 콘텐츠 */}
      <div className={`text-center max-w-4xl w-full ${styles.fadeInDown}`}>
        {/* 작은 태그 */}
        <div className="mb-8">
          <span className={`inline-block px-4 py-2 rounded-full border ${styles.premiumBadge}`}>
            <span className={styles.goldText}>★</span> Premium Analytics Platform
          </span>
        </div>

        {/* 메인 제목 */}
        <h1 className={`text-7xl md:text-8xl font-black mb-8 leading-tight tracking-tighter ${styles.premiumTitle}`}>
          YouTube<br />Intelligence
        </h1>

        {/* 데코레이션 라인 */}
        <div className={`h-1 w-32 mx-auto mb-12 ${styles.goldLine}`}></div>

        {/* 서브 텍스트 */}
        <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          프리미엄 분석으로 YouTube 콘텐츠 마켓을 지배하세요
        </p>

        {/* 기능 그리드 - Premium 스타일 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {/* 기능 1 */}
          <div className={`${styles.premiumCard1} rounded-xl p-10 border border-yellow-900/20 hover:border-yellow-700/50 transition-all duration-500 group`}>
            <div className={`text-6xl mb-6 ${styles.goldGlow}`}>⚡</div>
            <h3 className="text-2xl font-bold text-white mb-3">정밀한 검색</h3>
            <p className="text-gray-400 leading-relaxed">고급 필터로 타겟 오디언스를 정확하게 분석</p>
          </div>

          {/* 기능 2 */}
          <div className={`${styles.premiumCard2} rounded-xl p-10 border border-yellow-900/20 hover:border-yellow-700/50 transition-all duration-500 group`}>
            <div className={`text-6xl mb-6 ${styles.goldGlow}`}>💎</div>
            <h3 className="text-2xl font-bold text-white mb-3">심층 인사이트</h3>
            <p className="text-gray-400 leading-relaxed">실시간 데이터로 경쟁사 분석 및 예측</p>
          </div>

          {/* 기능 3 */}
          <div className={`${styles.premiumCard3} rounded-xl p-10 border border-yellow-900/20 hover:border-yellow-700/50 transition-all duration-500 group`}>
            <div className={`text-6xl mb-6 ${styles.goldGlow}`}>🏆</div>
            <h3 className="text-2xl font-bold text-white mb-3">전략 수립</h3>
            <p className="text-gray-400 leading-relaxed">AI 기반 최적화 전략으로 성장 가속화</p>
          </div>
        </div>

        {/* 프리미엄 피처 */}
        <div className={`${styles.premiumFeature} rounded-2xl p-12 mb-24 border border-yellow-900/30`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "실시간", value: "분석" },
              { label: "10M+", value: "데이터" },
              { label: "99.9%", value: "정확도" },
              { label: "24/7", value: "지원" }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className={`text-3xl font-black mb-2 ${styles.goldText}`}>{item.label}</div>
                <p className="text-gray-400 text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA 버튼 */}
        <div className="flex flex-col items-center gap-8">
          <Link
            href="/dashboard"
            className={`inline-block text-white font-bold py-4 px-16 rounded-lg text-lg transition-all duration-300 no-underline ${styles.premiumCta}`}
          >
            프리미엄 시작하기
          </Link>

          <p className="text-gray-400 text-sm">
            평가판 이용 중인가요?{" "}
            <Link
              href="/login"
              className={`${styles.goldText} font-semibold hover:text-yellow-300 transition-colors`}
            >
              업그레이드
            </Link>
          </p>
        </div>
      </div>

      {/* 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-screen filter blur-3xl opacity-10 ${styles.premiumGlow1}`}></div>
        <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full mix-blend-screen filter blur-3xl opacity-10 ${styles.premiumGlow2}`}></div>
      </div>
    </div>
  );
}
