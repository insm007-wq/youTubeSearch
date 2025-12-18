'use client'

interface ChannelFilterProps {
  channels: Array<{ id: string; title: string }>
  selectedChannelId: string | null
  onChange: (channelId: string | null) => void
}

export default function ChannelFilter({ channels, selectedChannelId, onChange }: ChannelFilterProps) {
  return (
    <div className="filter-section">
      <div className="filter-title">채널 필터</div>
      <div className="filter-options">
        <label className="filter-option">
          <input
            type="radio"
            name="channel"
            value=""
            checked={selectedChannelId === null}
            onChange={() => onChange(null)}
          />
          <label>전체</label>
        </label>
        {channels.map((channel) => (
          <label key={channel.id} className="filter-option">
            <input
              type="radio"
              name="channel"
              value={channel.id}
              checked={selectedChannelId === channel.id}
              onChange={() => onChange(channel.id)}
            />
            <label>{channel.title}</label>
          </label>
        ))}
      </div>
    </div>
  )
}
