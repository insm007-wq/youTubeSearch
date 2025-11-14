'use client'

import { motion } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'
import './ApiLimitBanner.css'

interface ApiLimitBannerProps {
  used: number
  limit: number
  resetTime: string
  onClose: () => void
}

export default function ApiLimitBanner({
  used,
  limit,
  resetTime,
  onClose
}: ApiLimitBannerProps) {
  // resetTime에서 시간 추출 (예: "2024-11-15T00:00:00Z")
  const resetDate = new Date(resetTime)
  const resetTimeStr = resetDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  const progressPercent = (used / limit) * 100

  return (
    <motion.div
      className="api-limit-banner"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      role="alert"
      aria-live="polite"
    >
      <div className="banner-header">
        <div className="banner-title">
          <AlertTriangle size={20} className="banner-icon" />
          <span>일일 검색 횟수 제한 초과</span>
        </div>
        <button
          className="banner-close"
          onClick={onClose}
          aria-label="닫기"
        >
          <X size={20} />
        </button>
      </div>

      <div className="banner-content">
        <div className="usage-info">
          <span className="usage-label">오늘 사용:</span>
          <span className="usage-count">
            {used}/{limit}회
          </span>
        </div>

        <div className="progress-container">
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <span className="progress-percent">{Math.round(progressPercent)}%</span>
        </div>

        <div className="reset-info">
          <span className="reset-label">
            다음 초기화:
          </span>
          <span className="reset-time">
            내일 {resetTimeStr}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
