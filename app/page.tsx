"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div className={`min-h-screen ${styles.interactiveBg} flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden`}>
      {/* 메인 콘텐츠 */}
      <div className={`text-center max-w-4xl w-full ${styles.slideInUp}`}>
        {/* 작은 태그 */}
        <div className="mb-8">
          <span className={`inline-block px-4 py-2 rounded-full border ${styles.interactiveBadge}`}>
            ⚡ 동적 분석 플랫폼
          </span>
        </div>

        {/* 메인 제목 */}
        <h1 className={`text-7xl md:text-8xl font-black mb-8 leading-tight tracking-tighter ${styles.interactiveTitle}`}>
          YouTube<br />Mastery
        </h1>

        {/* 서브 텍스트 */}
        <p className="text-xl md:text-2xl text-gray-300 mb-16 max-w-2xl mx-auto font-light leading-relaxed">
          실시간 인터랙티브 분석으로 데이터를 시각화하고 즉시 활용하세요
        </p>

        {/* 기능 그리드 - Interactive */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {[
            { icon: "🎯", title: "정밀한 검색", desc: "실시간 필터링으로 즉시 결과 확인" },
            { icon: "📊", title: "실시간 분석", desc: "라이브 데이터 시각화 대시보드" },
            { icon: "🚀", title: "성과 추적", desc: "인터랙티브 그래프와 차트" }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`${styles.interactiveCard} rounded-xl p-10 cursor-pointer relative group`}
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                transform: hoveredCard === idx ? "translateY(-10px) scale(1.05)" : "translateY(0) scale(1)",
                transition: "all 0.4s cubic-bezier(0.23, 1, 0.320, 1)"
              }}
            >
              {/* 카드 배경 효과 */}
              <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${styles.cardGradient}`}></div>

              {/* 카드 내용 */}
              <div className="relative z-10">
                <div className={`text-6xl mb-6 inline-block transition-transform duration-500 ${styles.iconBounce}`} style={{
                  transform: hoveredCard === idx ? "scale(1.2) rotate(10deg)" : "scale(1) rotate(0deg)"
                }}>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </div>

              {/* 호버 라인 */}
              <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full transition-all duration-500 ${styles.hoverLine}`} style={{
                width: hoveredCard === idx ? "100%" : "0%"
              }}></div>
            </div>
          ))}
        </div>

        {/* 인터랙티브 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
          {[
            { number: "10M+", label: "데이터 포인트", delay: 0 },
            { number: "0.5s", label: "응답 시간", delay: 100 },
            { number: "99.9%", label: "정확도", delay: 200 },
            { number: "24/7", label: "실시간", delay: 300 }
          ].map((stat, idx) => (
            <div key={idx} className={`text-center ${styles.statItem}`} style={{ animationDelay: `${stat.delay}ms` }}>
              <div className={`text-4xl md:text-5xl font-black mb-2 ${styles.interactiveNumber}`}>
                {stat.number}
              </div>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA 섹션 */}
        <div className="flex flex-col items-center gap-8">
          <Link
            href="/dashboard"
            className={`group relative inline-block text-white font-bold py-4 px-16 rounded-lg text-lg no-underline ${styles.interactiveCta}`}
          >
            <span className="relative z-10 flex items-center gap-2">
              지금 시작하기
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </Link>

          <p className="text-gray-400 text-sm">
            관심 있으신가요?{" "}
            <Link
              href="/login"
              className={`font-semibold transition-all duration-300 hover:gap-1 ${styles.interactiveLink}`}
            >
              데모 보기
            </Link>
          </p>
        </div>
      </div>

      {/* 배경 효과 - 움직이는 요소들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full mix-blend-screen filter blur-3xl opacity-20 ${styles.bgMove1}`}></div>
        <div className={`absolute bottom-20 right-10 w-72 h-72 rounded-full mix-blend-screen filter blur-3xl opacity-20 ${styles.bgMove2}`}></div>
        <div className={`absolute top-1/2 right-1/4 w-96 h-96 rounded-full mix-blend-screen filter blur-3xl opacity-10 ${styles.bgMove3}`}></div>
      </div>

      {/* 그리드 배경 */}
      <div className={`absolute inset-0 ${styles.gridBg}`}></div>
    </div>
  );
}
