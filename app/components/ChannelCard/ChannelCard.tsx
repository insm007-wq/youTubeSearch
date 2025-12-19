"use client";

import React, { useEffect, useState } from "react";
import { Users, Video, Eye } from "lucide-react";
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
    thumbnail,
    description,
    subscriberCount: initialSubscriberCount,
    videoCount,
    viewCount,
  } = channel;

  const [imageLoadError, setImageLoadError] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(initialSubscriberCount);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);

  // 구독자 수가 0이고 channelId가 있으면 실시간 조회
  useEffect(() => {
    if (subscriberCount === 0 && id) {
      setIsLoadingSubscribers(true);
      fetch(`/api/channel-info?channelId=${encodeURIComponent(id)}`)
        .then(res => res.json())
        .then(data => {
          if (data.subscriberCount > 0) {
            setSubscriberCount(data.subscriberCount);
          }
          setIsLoadingSubscribers(false);
        })
        .catch(error => {
          console.warn(`⚠️  구독자 수 조회 실패 (${id}):`, error);
          setIsLoadingSubscribers(false);
        });
    }
  }, [subscriberCount, id]);

  const subscriberText = isLoadingSubscribers
    ? "로딩..."
    : subscriberCount > 0
      ? formatNumber(subscriberCount)
      : "미공개";

  const videoCountText = videoCount
    ? videoCount.toLocaleString()
    : null;

  const viewCountText = viewCount && viewCount > 0
    ? formatNumber(viewCount)
    : null;

  // 채널 설명 (최대 80자)
  const shortDescription = description && description.length > 80
    ? description.substring(0, 80) + "..."
    : description;

  const channelLink = `https://www.youtube.com/channel/${id}`;

  const handleCardClick = () => {
    window.open(channelLink, "_blank");
  };

  return (
    <div
      className="channel-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick();
        }
      }}
    >
      {/* 왼쪽: 프로필 이미지 */}
      <div className="channel-profile-link">
        <div className="channel-profile-image">
          {thumbnail && !imageLoadError ? (
            <img
              src={thumbnail}
              alt={title}
              className="channel-thumbnail"
              onError={() => setImageLoadError(true)}
            />
          ) : (
            <div className="channel-thumbnail-placeholder" />
          )}
        </div>
      </div>

      {/* 오른쪽: 채널 정보 */}
      <div className="channel-content">
        {/* 헤더: 채널명 */}
        <div className="channel-header">
          <div className="channel-title">{title}</div>
        </div>

        {/* 메타 정보: 구독자 + 비디오 개수 + 조회수 */}
        <div className="channel-meta">
          <Users size={16} />
          <span className="channel-stat-value">{subscriberText}</span>
          {videoCountText && (
            <>
              <Video size={16} />
              <span className="channel-stat-value">{videoCountText}개</span>
            </>
          )}
          {viewCountText && (
            <>
              <Eye size={16} />
              <span className="channel-stat-value">{viewCountText}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
