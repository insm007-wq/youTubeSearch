"use client";

import { Tooltip } from "@/app/components/ui/Tooltip";
import { Users, Video, Eye, LinkIcon } from "lucide-react";
import "./ChannelCard.css";

interface ChannelCardProps {
  channel: {
    id: string;
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    thumbnail: string;
    subscriberCount: number;
    videoCount?: number;
    viewCount?: number;
    type: 'channel';
  };
}

// 숫자 포맷팅 함수
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

export default function ChannelCard({ channel }: ChannelCardProps) {
  const {
    id,
    title,
    description,
    thumbnail,
    subscriberCount,
    videoCount,
    viewCount,
  } = channel;

  const subscriberText = subscriberCount > 0
    ? formatNumber(subscriberCount)
    : "미공개";

  const viewCountText = viewCount && viewCount > 0
    ? formatNumber(viewCount)
    : null;

  const videoCountText = videoCount
    ? videoCount.toLocaleString()
    : null;

  const channelLink = `https://www.youtube.com/channel/${id}`;

  return (
    <div className="channel-card">
      <a
        href={channelLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{ position: "relative", textDecoration: "none" }}
      >
        <div className="channel-thumbnail-container">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="channel-thumbnail"
            />
          ) : (
            <div className="channel-thumbnail-placeholder">
              이미지 없음
            </div>
          )}
        </div>
      </a>

      <div className="channel-info">
        <div className="channel-title">{title}</div>

        {/* Description - 2줄 제한 */}
        {description && (
          <div className="channel-description">
            {description}
          </div>
        )}

        {/* Stats */}
        <div className="channel-stats">
          <Tooltip content="채널의 총 구독자 수" placement="top" variant="glassmorphic">
            <div className="stat-item">
              <Users size={16} style={{ marginRight: "4px" }} />
              {subscriberText}
            </div>
          </Tooltip>

          {videoCountText && (
            <Tooltip content="채널의 총 비디오 개수" placement="top" variant="glassmorphic">
              <div className="stat-item">
                <Video size={16} style={{ marginRight: "4px" }} />
                {videoCountText}개
              </div>
            </Tooltip>
          )}

          {viewCountText && (
            <Tooltip content="채널의 총 조회수" placement="top" variant="glassmorphic">
              <div className="stat-item">
                <Eye size={16} style={{ marginRight: "4px" }} />
                {viewCountText}
              </div>
            </Tooltip>
          )}
        </div>

        {/* Badge - 채널 타입 표시 */}
        <div className="badge-container">
          <div className="channel-type-badge">채널</div>
        </div>

        {/* Button */}
        <div className="channel-buttons">
          <button
            className="btn-channel-link"
            onClick={(e) => {
              e.preventDefault();
              window.open(channelLink, "_blank");
            }}
          >
            <LinkIcon size={12} />
            채널 방문
          </button>
        </div>
      </div>
    </div>
  );
}
