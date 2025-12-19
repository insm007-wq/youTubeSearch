"use client";

import { useEffect, useState, useRef } from "react";
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
    viewCount?: number;
    subscriberCount: number;
    duration?: string;
    publishedAt?: string;
    tags?: string[];
    channelId?: string;
    categoryName?: string;
    categoryIcon?: string;
    categoryId?: string;
    channelCountry?: string | null;
    type?: 'video' | 'shorts';
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

// VPH 포맷팅 함수
const formatVPH = (vph: number): string => {
  if (vph <= 0) return "N/A";

  // 매우 비정상적인 VPH (10,000,000 이상)는 에러로 간주
  // 1,000,000~9,999,999는 정상 범위 (최근 높은 조회수 비디오)
  if (vph >= 10000000) {
    console.warn(`⚠️  비정상적으로 큰 VPH 값: ${vph}`);
    return "오류";
  }

  // 일반적인 포맷팅
  if (vph >= 1000000) {
    return (vph / 1000000).toFixed(1) + "M";
  }
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
    viewCount = 0,
    subscriberCount: initialSubscriberCount,
    duration,
    publishedAt,
    tags,
    channelId,
    categoryName,
    categoryIcon,
    channelCountry,
    type = 'video',
  } = video;

  // 구독자 수 상태 관리 (API에서 0이면 실시간 조회)
  const [subscriberCount, setSubscriberCount] = useState(initialSubscriberCount);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);

  // 태그 정보 상태 관리 (API에서 조회)
  const [videoTags, setVideoTags] = useState<string[]>(tags || []);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // 동적 정보 상태 관리 (duration, publishedAt, channelTitle 등)
  const [videoDuration, setVideoDuration] = useState(duration);
  const [videoPublishedAt, setVideoPublishedAt] = useState(publishedAt);
  const [videoChannelTitle, setVideoChannelTitle] = useState(channelTitle);
  const [isLoadingVideoInfo, setIsLoadingVideoInfo] = useState(false);

  const hasRequestedVideoInfo = useRef(false);

  // 구독자 수가 0이고 channelId가 있으면 실시간 조회
  useEffect(() => {
    if (subscriberCount === 0 && channelId) {
      setIsLoadingSubscribers(true);
      fetch(`/api/channel-info?channelId=${encodeURIComponent(channelId)}`)
        .then(res => res.json())
        .then(data => {
          if (data.subscriberCount > 0) {
            setSubscriberCount(data.subscriberCount);
          }
          setIsLoadingSubscribers(false);
        })
        .catch(error => {
          console.warn(`⚠️  구독자 수 조회 실패 (${channelId}):`, error);
          setIsLoadingSubscribers(false);
        });
    }
  }, [subscriberCount, channelId]);

  // 비디오 정보 조회 (duration, publishedAt, channelTitle이 빈 값이면 실시간 조회)
  useEffect(() => {
    if (id && !hasRequestedVideoInfo.current && (!videoDuration || !videoChannelTitle)) {
      hasRequestedVideoInfo.current = true;
      setIsLoadingVideoInfo(true);

      // ✅ shorts는 /api/shorts-info, 일반 비디오는 /api/video-info 호출
      const apiUrl = type === 'shorts'
        ? `/api/shorts-info?videoId=${encodeURIComponent(id)}`
        : `/api/video-info?videoId=${encodeURIComponent(id)}`;

      console.log(`🎬 ${type === 'shorts' ? '쇼츠' : '비디오'} 정보 조회 시작 (${id})`);

      fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
          console.log(`📺 비디오 정보 조회 완료 (${id}):`, {
            type,
            duration: data.duration,
            publishedAt: data.publishedAt,
            channelTitle: data.channelTitle,
            channelId: data.channelId,
            keywords: data.keywords,
          });
          if (data.duration) {
            console.log(`✅ Duration 업데이트: ${data.duration}`);
            setVideoDuration(data.duration);
          }
          if (data.publishedAt) {
            console.log(`✅ PublishedAt 업데이트: ${data.publishedAt}`);
            setVideoPublishedAt(data.publishedAt);
          }
          if (data.channelTitle) {
            console.log(`✅ ChannelTitle 업데이트: ${data.channelTitle}`);
            setVideoChannelTitle(data.channelTitle);
          }
          if (data.keywords && data.keywords.length > 0) {
            setVideoTags(data.keywords);
          }
          setIsLoadingVideoInfo(false);
        })
        .catch(error => {
          console.warn(`⚠️  비디오 정보 조회 실패 (${id}):`, error);
          setIsLoadingVideoInfo(false);
        });
    }
  }, [id, videoDuration, videoChannelTitle, type]);

  const viewCountText = viewCount === 0 || viewCount === undefined ? "조회 불가" : formatNumber(viewCount);
  const subscriberText = isLoadingSubscribers
    ? "로딩..."
    : subscriberCount > 0
      ? formatNumber(subscriberCount)
      : "미공개";

  const durationSeconds = parseDuration(videoDuration || "");
  const durationText = formatDuration(durationSeconds);

  const engagementRatio = viewCount
    ? calculateEngagementRatio(viewCount, subscriberCount)
    : 0;
  const engagementLevel = getEngagementLevel(engagementRatio);
  const ratioText = subscriberCount > 0
    ? engagementRatio.toFixed(2)
    : "N/A";

  const calculatedVPH = videoPublishedAt
    ? calculateVPH(viewCount || 0, videoPublishedAt)
    : 0;
  const vphText = formatVPH(calculatedVPH);

  const badgeClass = `engagement-badge engagement-${engagementLevel}`;
  const videoLink = `https://www.youtube.com/watch?v=${id}`;

  return (
    <div className="video-card">
      <a href={videoLink} target="_blank" rel="noopener noreferrer" style={{ position: "relative", textDecoration: "none" }}>
        {thumbnail ? (
          <img src={thumbnail} alt={title} className={`video-thumbnail ${type === 'shorts' ? 'shorts-thumbnail' : ''}`} />
        ) : (
          <div className={`video-thumbnail ${type === 'shorts' ? 'shorts-thumbnail' : ''}`} style={{ backgroundColor: "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
            이미지 없음
          </div>
        )}
        {durationSeconds > 0 && <div className="video-duration">{durationText}</div>}
      </a>
      <div className="video-info">
        <div className="video-title">{title}</div>
        <div className="video-channel">{videoChannelTitle || "채널 로딩중..."}</div>

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

          {categoryName && (
            <div className="text-badge upload-time">{categoryName}</div>
          )}
        </div>

        <TagAnalysis tags={videoTags} title={title} />

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
