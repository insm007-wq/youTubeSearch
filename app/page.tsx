"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={`min-h-screen ${styles.boldGradientBg} flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden`}>
      {/* 메인 콘텐츠 */}
      <div className={`text-center max-w-4xl w-full ${styles.fadeInUp}`}>
        {/* 작은 태그 */}
        <div className="mb-8">
          <span className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-widest uppercase">
            ✨ 영상 분석 혁명
          </span>
        </div>

        {/* 메인 제목 - Bold 그래디언트 */}
        <h1 className={`text-7xl md:text-8xl font-black mb-8 leading-tight tracking-tighter ${styles.boldGradientText}`}>
          YouTube<br />분석의<br />미래
        </h1>

        {/* 서브 텍스트 */}
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          고도의 데이터 분석으로 콘텐츠 트렌드를 한 발 앞서 캐치하세요
        </p>

        {/* 기능 그리드 - 컬러풀 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {/* 기능 1 */}
          <div className={`${styles.featureCard1} rounded-2xl p-8 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 group`}>
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg font-bold text-white mb-2">정밀한 검색</h3>
            <p className="text-white/70 text-sm leading-relaxed">고급 필터로 원하는 영상을 정확하게 찾으세요</p>
          </div>

          {/* 기능 2 */}
          <div className={`${styles.featureCard2} rounded-2xl p-8 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 group`}>
            <div className="text-5xl mb-4">📈</div>
            <h3 className="text-lg font-bold text-white mb-2">심층 분석</h3>
            <p className="text-white/70 text-sm leading-relaxed">실시간 통계로 성과를 즉시 파악하세요</p>
          </div>

          {/* 기능 3 */}
          <div className={`${styles.featureCard3} rounded-2xl p-8 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 group`}>
            <div className="text-5xl mb-4">💾</div>
            <h3 className="text-lg font-bold text-white mb-2">데이터 내보내기</h3>
            <p className="text-white/70 text-sm leading-relaxed">분석 결과를 다양한 형식으로 저장하세요</p>
          </div>
        </div>

        {/* 통계 섹션 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-20 py-12">
          {[
            { number: "10M+", label: "분석된 영상" },
            { number: "500K+", label: "활성 사용자" },
            { number: "99.9%", label: "가용성" },
            { number: "0.5s", label: "검색 속도" }
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-4xl md:text-5xl font-black text-white mb-2">
                {stat.number}
              </div>
              <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA 버튼 */}
        <div className="flex flex-col items-center gap-6">
          <Link
            href="/dashboard"
            className={`inline-block text-white font-bold py-4 px-16 rounded-xl text-lg transition-all duration-300 no-underline ${styles.ctaButton}`}
          >
            지금 시작하기
          </Link>

          <p className="text-white/70 text-sm">
            이미 계정이 있나요?{" "}
            <Link
              href="/login"
              className="text-white font-semibold hover:text-white/80 transition-colors"
            >
              로그인
            </Link>
          </p>
        </div>
      </div>

      {/* 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 ${styles.bgBlob1}`}></div>
        <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 ${styles.bgBlob2}`}></div>
      </div>
    </div>
  );
}
