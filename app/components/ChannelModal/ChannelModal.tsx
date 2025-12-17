'use client'

interface ChannelModalProps {
  isOpen: boolean
  channelTitle: string
  channelDescription: string
  viewCount: number
  subscriberCount: boolean
  subscriberCountValue: number
  videoCount: number
  customUrl: string
  country: string | null
  channelId: string
  channelHandle: string
  isLoading: boolean
  onClose: () => void
}

// 국가 코드를 국가명으로 변환
const getCountryName = (code: string | null): string => {
  if (!code) return 'N/A'

  const countryMap: Record<string, string> = {
    'US': '미국',
    'KR': '대한민국',
    'JP': '일본',
    'GB': '영국',
    'CA': '캐나다',
    'AU': '호주',
    'DE': '독일',
    'FR': '프랑스',
    'CN': '중국',
    'IN': '인도',
    'BR': '브라질',
    'MX': '멕시코',
    'ES': '스페인',
    'IT': '이탈리아',
    'NL': '네덜란드',
    'RU': '러시아',
    'SG': '싱가포르',
    'HK': '홍콩',
    'TW': '대만',
    'TH': '태국',
    'PH': '필리핀',
    'ID': '인도네시아',
    'MY': '말레이시아',
    'VN': '베트남',
    'TR': '튀르키예',
    'SA': '사우디아라비아',
    'AE': '아랍에미리트',
    'ZA': '남아프리카',
    'NG': '나이지리아',
  }

  return countryMap[code] || code
}

export default function ChannelModal({
  isOpen,
  channelTitle,
  channelDescription,
  viewCount,
  subscriberCount,
  subscriberCountValue,
  videoCount,
  customUrl,
  country,
  channelId,
  channelHandle,
  isLoading,
  onClose,
}: ChannelModalProps) {
  if (!isOpen) return null

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  return (
    <>
      <div
        className="channel-modal"
        style={{ display: isOpen ? 'flex' : 'none' }}
        onClick={onClose}
      >
        <div
          className="channel-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="channel-modal-header">
            <div className="channel-modal-title">📺 {channelTitle} 채널 분석</div>
            <button
              className="channel-modal-close"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {isLoading ? (
            <div className="channel-loading">채널 정보를 불러오는 중...</div>
          ) : (
            <>
              <div className="channel-description">
                {channelDescription.substring(0, 300)}
                {channelDescription.length > 300 ? '...' : ''}
              </div>

              <div className="channel-stats-grid">
                <div className="channel-stat-box">
                  <div className="channel-stat-label">채널 핸들</div>
                  <div className="channel-stat-value">{channelHandle || 'N/A'}</div>
                </div>
                <div className="channel-stat-box">
                  <div className="channel-stat-label">구독자 수</div>
                  <div className="channel-stat-value">
                    {subscriberCount ? '비공개' : formatNumber(subscriberCountValue)}
                  </div>
                </div>
                <div className="channel-stat-box">
                  <div className="channel-stat-label">총 영상 수</div>
                  <div className="channel-stat-value">{formatNumber(videoCount)}</div>
                </div>
                <div className="channel-stat-box">
                  <div className="channel-stat-label">채널 국가</div>
                  <div className="channel-stat-value">{getCountryName(country)}</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <a
                  href={`https://www.youtube.com/channel/${channelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: '#ff0000',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontWeight: '600',
                  }}
                >
                  YouTube 채널 방문
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
