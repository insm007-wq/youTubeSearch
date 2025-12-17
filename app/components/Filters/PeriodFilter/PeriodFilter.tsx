'use client'

interface PeriodFilterProps {
  value: string
  onChange: (value: string) => void
}

// YT-API upload_date 파라미터에 맞춘 옵션
const PERIOD_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'hour', label: '1시간' },
  { value: 'today', label: '오늘' },
  { value: 'week', label: '이번 주' },
  { value: 'month', label: '이번 달' },
  { value: 'year', label: '1년' },
]

export default function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="filter-section">
      <div className="filter-title">업로드 기간</div>

      {/* 기간 옵션 (Pill 버튼) */}
      <div className="filter-options">
        {PERIOD_OPTIONS.map((option) => (
          <label key={option.value} className="filter-option">
            <input
              type="radio"
              name="uploadPeriod"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
