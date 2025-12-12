"use client";

import TagAnalysis from "@/app/components/TagAnalysis/TagAnalysis";
import { Tooltip } from "@/app/components/ui/Tooltip";
import { calculateVPH } from "@/lib/vphUtils";
import {
  Eye,
  Users,
  TrendingUp,
  Zap,
  Play,
  LinkIcon,
  Film,
  Car,
  Music,
  PawPrint,
  Trophy,
  Plane,
  Gamepad2,
  Video,
  Tv,
  Megaphone,
  Smile,
  Newspaper,
  ShoppingBag,
  Cpu,
  Clapperboard,
  Calendar,
  BookOpen,
  Microscope,
  Palette,
  PlayCircle,
  Mic2,
} from "lucide-react";
import "./VideoCard.css";

// lucide-react 아이콘 매핑
const iconMap: Record<string, any> = {
  Film: Film,
  Car: Car,
  Music: Music,
  PawPrint: PawPrint,
  Trophy: Trophy,
  Plane: Plane,
  Gamepad2: Gamepad2,
  Video: Video,
  Tv: Tv,
  Megaphone: Megaphone,
  Smile: Smile,
  Newspaper: Newspaper,
  ShoppingBag: ShoppingBag,
  Cpu: Cpu,
  Clapperboard: Clapperboard,
  Calendar: Calendar,
  BookOpen: BookOpen,
  Microscope: Microscope,
  Palette: Palette,
  PlayCircle: PlayCircle,
  Mic2: Mic2,
};

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    viewCount: number;
    subscriberCount: number;
    duration?: string;
    publishedAt?: string;
    tags?: string[];
    channelId?: string;
    categoryName?: string;
    categoryIcon?: string;
    categoryId?: string;
    channelCountry?: string | null;
  };
  showVPH?: boolean;
  vph?: number;
  onChannelClick?: (channelId: string, channelTitle: string) => void;
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

// VPH 포맷팅 함수 (비정상적으로 큰 값 방지)
const formatVPH = (vph: number): string => {
  if (vph <= 0) return "N/A";

  // 비정상적으로 큰 VPH (1,000,000 이상)는 에러로 간주
  if (vph >= 1000000) {
    console.warn(`⚠️  비정상적으로 큰 VPH 값: ${vph}`);
    return "오류";
  }

  // 일반적인 포맷팅
  if (vph >= 1000) {
    return (vph / 1000).toFixed(1) + "K";
  }
  return Math.round(vph).toString();
};

// 기간 파싱 함수 (ISO 8601 duration format)
const parseDuration = (duration: string): number => {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  return hours * 3600 + minutes * 60 + seconds;
};

// 기간 포맷팅 함수
const formatDuration = (seconds: number): string => {
  if (seconds === 0) return "0초";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  if (minutes > 0) {
    return `${minutes}분 ${secs}초`;
  }
  return `${secs}초`;
};

// 참여율 계산 함수
const calculateEngagementRatio = (viewCount: number, subscriberCount: number): number => {
  if (subscriberCount === 0) return 0;
  return viewCount / subscriberCount;
};

// 참여율 단계 계산
const getEngagementLevel = (ratio: number): number => {
  if (ratio < 0.2) return 1;
  if (ratio < 0.6) return 2;
  if (ratio < 1.4) return 3;
  if (ratio < 3.0) return 4;
  return 5;
};


export default function VideoCard({ video, showVPH = false, vph, onChannelClick }: VideoCardProps) {
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
    categoryName,
    categoryIcon,
    channelCountry,
  } = video;

  const viewCountText = viewCount === 0 ? "조회 불가" : formatNumber(viewCount);
  const subscriberText = subscriberCount > 0 ? formatNumber(subscriberCount) : "미공개";

  const durationSeconds = parseDuration(duration || "");
  const durationText = formatDuration(durationSeconds);

  const engagementRatio = calculateEngagementRatio(viewCount, subscriberCount);
  const engagementLevel = getEngagementLevel(engagementRatio);
  const ratioText = subscriberCount > 0 ? engagementRatio.toFixed(2) : "N/A";

  const calculatedVPH = calculateVPH(viewCount, publishedAt || "");
  const vphText = formatVPH(calculatedVPH);

  const badgeClass = `engagement-badge engagement-${engagementLevel}`;
  const videoLink = `https://www.youtube.com/watch?v=${id}`;

  return (
    <div className="video-card">
      <a href={videoLink} target="_blank" rel="noopener noreferrer" style={{ position: "relative", textDecoration: "none" }}>
        <img src={thumbnail} alt={title} className="video-thumbnail" />
        <div className="video-duration">{durationText}</div>
      </a>
      <div className="video-info">
        <div className="video-title">{title}</div>
        <div className="video-channel">{channelTitle}</div>

        {/* stats */}
        <div className="video-stats">
          <Tooltip content="영상의 총 조회수" placement="top" variant="glassmorphic">
            <div className="stat-item">
              <Eye size={16} style={{ marginRight: "4px" }} />
              {viewCountText}
            </div>
          </Tooltip>
          <Tooltip content="채널의 총 구독자 수" placement="top" variant="glassmorphic">
            <div className="stat-item">
              <Users size={16} style={{ marginRight: "4px" }} />
              {subscriberText}
            </div>
          </Tooltip>
        </div>

        <div className="video-stats">
          <Tooltip content="조회수/구독자 비율" placement="top" variant="glassmorphic">
            <div className="stat-item">
              <TrendingUp size={16} style={{ marginRight: "4px" }} />
              {ratioText}
            </div>
          </Tooltip>

          {showVPH && (
            <Tooltip content="시간당 조회수" placement="top" variant="glassmorphic">
              <div className="stat-item">
                <Zap size={16} style={{ marginRight: "4px" }} />
                VPH: {vphText}
              </div>
            </Tooltip>
          )}
        </div>

        {/* badge */}
        <div className="badge-container">
          <div className={badgeClass}>{engagementLevel}단계</div>

          {publishedAt && (
            <div className="text-badge upload-time">
              {(() => {
                const publishDate = new Date(publishedAt);
                const now = new Date();
                const diffMs = now.getTime() - publishDate.getTime();
                const diffSeconds = Math.floor(diffMs / 1000);

                if (diffSeconds < 60) return "방금 전";
                const diffMinutes = Math.floor(diffSeconds / 60);
                if (diffMinutes < 60) return `${diffMinutes}분 전`;
                const diffHours = Math.floor(diffMinutes / 60);
                if (diffHours < 24) return `${diffHours}시간 전`;
                const diffDays = Math.floor(diffHours / 24);
                if (diffDays < 7) return `${diffDays}일 전`;
                const diffWeeks = Math.floor(diffDays / 7);
                if (diffWeeks < 4) return `${diffWeeks}주 전`;
                const diffMonths = Math.floor(diffDays / 30);
                if (diffMonths < 12) return `${diffMonths}개월 전`;
                const diffYears = Math.floor(diffMonths / 12);
                return `${diffYears}년 전`;
              })()}
            </div>
          )}

          {channelCountry && (
            <div className="text-badge country">{channelCountry}</div>
          )}
        </div>

        <TagAnalysis tags={tags} title={title} />

        {/* Buttons */}
        <div className="video-buttons">
          <button
            className="btn-view-channel"
            onClick={(e) => {
              e.preventDefault();
              onChannelClick?.(channelId || id, channelTitle);
            }}
          >
            <Play size={12} />
            채널
          </button>

          <button
            className="btn-view-link"
            onClick={(e) => {
              e.preventDefault();
              window.open(videoLink, "_blank");
            }}
          >
            <LinkIcon size={12} />
            바로가기
          </button>
        </div>
      </div>
    </div>
  );
}
