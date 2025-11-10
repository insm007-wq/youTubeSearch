'use client'

interface PeriodFilterProps {
  value: string
  onChange: (value: string) => void
}

export default function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="filter-section">
      <div className="filter-title">기간 필터</div>
      <div className="filter-options">
        <label className="filter-option">
          <input
            type="radio"
            name="uploadPeriod"
            value="all"
            checked={value === 'all'}
            onChange={(e) => onChange(e.target.value)}
          />
          <label>전체</label>
        </label>
        <label className="filter-option">
          <input
            type="radio"
            name="uploadPeriod"
            value="1month"
            checked={value === '1month'}
            onChange={(e) => onChange(e.target.value)}
          />
          <label>1개월</label>
        </label>
        <label className="filter-option">
          <input
            type="radio"
            name="uploadPeriod"
            value="2months"
            checked={value === '2months'}
            onChange={(e) => onChange(e.target.value)}
          />
          <label>2개월</label>
        </label>
        <label className="filter-option">
          <input
            type="radio"
            name="uploadPeriod"
            value="6months"
            checked={value === '6months'}
            onChange={(e) => onChange(e.target.value)}
          />
          <label>6개월</label>
        </label>
        <label className="filter-option">
          <input
            type="radio"
            name="uploadPeriod"
            value="1year"
            checked={value === '1year'}
            onChange={(e) => onChange(e.target.value)}
          />
          <label>1년</label>
        </label>
      </div>
    </div>
  )
}
