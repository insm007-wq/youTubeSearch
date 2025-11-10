'use client'

interface EngagementRatioFilterProps {
  selectedValues: string[]
  onChange: (values: string[]) => void
}

export default function EngagementRatioFilter({
  selectedValues,
  onChange,
}: EngagementRatioFilterProps) {
  const handleChange = (value: string) => {
    if (value === 'all') {
      // If clicking 'all', select all or deselect all
      if (selectedValues.includes('all')) {
        onChange([])
      } else {
        onChange(['all', '1', '2', '3', '4', '5'])
      }
    } else {
      // Remove 'all' if it exists when clicking specific options
      let newValues = selectedValues.filter(v => v !== 'all')

      if (newValues.includes(value)) {
        newValues = newValues.filter(v => v !== value)
      } else {
        newValues = [...newValues, value]
      }

      onChange(newValues)
    }
  }

  return (
    <div className="engagement-section">
      <div className="engagement-title">구독자 대비 조회수 비율 단계(다중선택)</div>
      <div className="engagement-info">조회수/구독자 비율이 높을수록 채널의 실제 영향력이 큼</div>
      <div className="engagement-options">
        <label className="filter-option">
          <input
            type="checkbox"
            name="engagementRatio"
            value="all"
            checked={selectedValues.includes('all')}
            onChange={() => handleChange('all')}
          />
          <label>전체</label>
        </label>
        <label className="filter-option">
          <input
            type="checkbox"
            name="engagementRatio"
            value="1"
            checked={selectedValues.includes('1')}
            onChange={() => handleChange('1')}
          />
          <label>1단계 (&lt;0.2)</label>
        </label>
        <label className="filter-option">
          <input
            type="checkbox"
            name="engagementRatio"
            value="2"
            checked={selectedValues.includes('2')}
            onChange={() => handleChange('2')}
          />
          <label>2단계 (0.2~0.6)</label>
        </label>
        <label className="filter-option">
          <input
            type="checkbox"
            name="engagementRatio"
            value="3"
            checked={selectedValues.includes('3')}
            onChange={() => handleChange('3')}
          />
          <label>3단계 (0.6~1.4)</label>
        </label>
        <label className="filter-option">
          <input
            type="checkbox"
            name="engagementRatio"
            value="4"
            checked={selectedValues.includes('4')}
            onChange={() => handleChange('4')}
          />
          <label>4단계 (1.4~3.0)</label>
        </label>
        <label className="filter-option">
          <input
            type="checkbox"
            name="engagementRatio"
            value="5"
            checked={selectedValues.includes('5')}
            onChange={() => handleChange('5')}
          />
          <label>5단계 (≥3.0)</label>
        </label>
      </div>
    </div>
  )
}
