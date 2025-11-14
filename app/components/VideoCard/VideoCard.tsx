'use client'

import TagAnalysis from '@/app/components/TagAnalysis/TagAnalysis'
import { Tooltip } from '@/app/components/ui/Tooltip'
import { Eye, Users, TrendingUp, Zap, Play, MessageCircle, LinkIcon } from 'lucide-react'
import './VideoCard.css'

interface VideoCardProps {
  video: {
    id: string
    title: string
    channelTitle: string
    thumbnail: string
    viewCount: number
    subscriberCount: number
    duration?: string
    publishedAt?: string
    tags?: string[]
    channelId?: string
  }
  showVPH?: boolean
  vph?: number
  onChannelClick?: (channelId: string, channelTitle: string) => void
  onCommentsClick?: (videoId: string, videoTitle: string) => void
}

// 숫자 포맷팅 함수
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 기간 파싱 함수 (ISO 8601 duration format)
const parseDuration = (duration: string): number => {
  if (!duration) return 0
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  return hours * 3600 + minutes * 60 + seconds
}

// 기간 포맷팅 함수
const formatDuration = (seconds: number): string => {
  if (seconds === 0) return '0초'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`
  }
  if (minutes > 0) {
    return `${minutes}분 ${secs}초`
  }
  return `${secs}초`
}

// 참여율 계산 함수
const calculateEngagementRatio = (viewCount: number, subscriberCount: number): number => {
  if (subscriberCount === 0) return 0
  return viewCount / subscriberCount
}

// 참여율 단계 계산
const getEngagementLevel = (ratio: number): number => {
  if (ratio < 0.2) return 1
  if (ratio < 0.6) return 2
  if (ratio < 1.4) return 3
  if (ratio < 3.0) return 4
  return 5
}

// VPH 계산 함수
const calculateVPH = (viewCount: number, publishedAt: string): number => {
  if (!publishedAt) return 0
  const publishDate = new Date(publishedAt).getTime()
  const now = new Date().getTime()
  const hours = (now - publishDate) / (1000 * 60 * 60)
  return hours > 0 ? viewCount / hours : 0
}

export default function VideoCard({
  video,
  showVPH = false,
  vph,
  onChannelClick,
  onCommentsClick
}: VideoCardProps) {
  const {
    id,
    title,
    channelTitle,
    thumbnail,
    viewCount,
    subscriberCount,
    duration,
    publishedAt,
    tags,
    channelId,
  } = video

  const viewCountText = formatNumber(viewCount)
  const subscriberText = subscriberCount > 0 ? formatNumber(subscriberCount) : '미공개'

  const durationSeconds = parseDuration(duration || '')
  const durationText = formatDuration(durationSeconds)

  const engagementRatio = calculateEngagementRatio(viewCount, subscriberCount)
  const engagementLevel = getEngagementLevel(engagementRatio)
  const ratioText = subscriberCount > 0 ? engagementRatio.toFixed(2) : 'N/A'

  const calculatedVPH = vph || calculateVPH(viewCount, publishedAt || '')
  const vphText = formatNumber(Math.round(calculatedVPH))
  const vphLabel = `⚡ VPH: ${vphText}`

  const badgeClass = `engagement-badge engagement-${engagementLevel}`
  const videoLink = `https://www.youtube.com/watch?v=${id}`

  return (
    <a
      href={videoLink}
      target="_blank"
      rel="noopener noreferrer"
      className="video-card"
    >
      <div style={{ position: 'relative' }}>
        <img src={thumbnail} alt={title} className="video-thumbnail" />
        <div className="video-duration">{durationText}</div>
      </div>
      <div className="video-info">
        <div className="video-title">{title}</div>
        <div className="video-channel">{channelTitle}</div>
        <div className="video-stats">
          <Tooltip
            content="영상의 총 조회수"
            placement="top"
            variant="glassmorphic"
          >
            <div className="stat-item">
              <Eye size={16} style={{ display: 'inline', marginRight: '4px' }} />
              {viewCountText}
            </div>
          </Tooltip>
          <Tooltip
            content="채널의 총 구독자 수"
            placement="top"
            variant="glassmorphic"
          >
            <div className="stat-item">
              <Users size={16} style={{ display: 'inline', marginRight: '4px' }} />
              {subscriberText}
            </div>
          </Tooltip>
        </div>
        <div className="video-stats">
          <Tooltip
            content="조회수/구독자 비율"
            placement="top"
            variant="glassmorphic"
          >
            <div className="stat-item">
              <TrendingUp size={16} style={{ display: 'inline', marginRight: '4px' }} />
              {ratioText}
            </div>
          </Tooltip>
          {showVPH && (
            <Tooltip
              content="시간당 조회수"
              placement="top"
              variant="glassmorphic"
            >
              <div className="stat-item">
                <Zap size={16} style={{ display: 'inline', marginRight: '4px' }} />
                VPH: {vphText}
              </div>
            </Tooltip>
          )}
        </div>
        <Tooltip
          content={
            engagementLevel === 1 ? "참여율 매우 낮음 (0.2배 미만)" :
            engagementLevel === 2 ? "참여율 낮음 (0.2~0.6배)" :
            engagementLevel === 3 ? "참여율 보통 (0.6~1.4배)" :
            engagementLevel === 4 ? "참여율 높음 (1.4~3.0배)" :
            "참여율 매우 높음 (3.0배+, 바이럴)"
          }
          placement="top"
          variant="glassmorphic"
        >
          <div className={badgeClass}>{engagementLevel}단계</div>
        </Tooltip>
        <TagAnalysis tags={tags} title={title} />
        <div className="video-buttons">
          <button
            className="btn-view-channel"
            onClick={(e) => {
              e.preventDefault()
              onChannelClick?.(channelId || id, channelTitle)
            }}
          >
            <Play size={12} style={{ flexShrink: 0 }} />
            채널
          </button>
          <button
            className="btn-view-comments"
            onClick={(e) => {
              e.preventDefault()
              onCommentsClick?.(id, title)
            }}
          >
            <MessageCircle size={12} style={{ flexShrink: 0 }} />
            댓글
          </button>
          <button
            className="btn-view-link"
            onClick={(e) => {
              e.preventDefault()
              window.open(videoLink, '_blank')
            }}
          >
            <LinkIcon size={12} style={{ flexShrink: 0 }} />
            바로가기
          </button>
        </div>
      </div>
    </a>
  )
}
