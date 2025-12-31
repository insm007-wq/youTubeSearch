"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import { LayoutGrid, Table2, Download } from "lucide-react";
import SearchResults from "@/app/components/SearchResults/SearchResults";
import PeriodFilter from "@/app/components/Filters/PeriodFilter/PeriodFilter";
import VideoLengthFilter from "@/app/components/Filters/VideoLengthFilter/VideoLengthFilter";
import EngagementRatioFilter from "@/app/components/Filters/EngagementRatioFilter/EngagementRatioFilter";
import ChannelModal from "@/app/components/ChannelModal/ChannelModal";
import Breadcrumb from "@/app/components/Breadcrumb/Breadcrumb";
import Toast, { Toast as ToastType } from "@/app/components/Toast/Toast";
import { calculateVPH } from "@/lib/vphUtils";
import "./search.css";

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  provider?: string;
}

interface RelatedVideoHistoryItem {
  videoId: string;
  title: string;
  thumbnail?: string;
  results: any[];
}


export default function Search({ user, signOut }: { user?: User; signOut?: (options?: any) => void }) {
  const [searchInput, setSearchInput] = useState("");
  const [uploadPeriod, setUploadPeriod] = useState("week");
  const [videoLength, setVideoLength] = useState("long");
  const [engagementRatios, setEngagementRatios] = useState<string[]>(["4", "5"]);
  const [isLoading, setIsLoading] = useState(false);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [sortBy, setSortBy] = useState("relevance");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isTitleRefreshing, setIsTitleRefreshing] = useState(false);
  const [toasts, setToasts] = useState<ToastType[]>([]);

  // 트렌딩 기능
  const [showTrending, setShowTrending] = useState(false);
  const [trendingResults, setTrendingResults] = useState<any[]>([]);
  const [trendingSection, setTrendingSection] = useState<string>('now-kr');
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);

  // 관련 영상 기능
  const [showRelatedVideos, setShowRelatedVideos] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [isRelatedVideosLoading, setIsRelatedVideosLoading] = useState(false);
  const [relatedVideosHistory, setRelatedVideosHistory] = useState<RelatedVideoHistoryItem[]>([]);
  const [currentLevel, setCurrentLevel] = useState(0); // 0 = 검색결과, 1 = 1단계, 2 = 2단계, ...
  const MAX_HISTORY_DEPTH = 5;

  const handleTitleClick = () => {
    setIsTitleRefreshing(true);
    setTimeout(() => {
      setIsTitleRefreshing(false);
      window.location.reload();
    }, 600);
  };

  // 토스트 추가 함수
  const addToast = useCallback((message: Omit<ToastType, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastType = { ...message, id };
    setToasts((prev) => [...prev, newToast]);

    // 자동으로 닫기 (기본 3초, 커스텀 duration 지정 가능)
    const duration = message.duration || 3000;
    setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  }, []);

  // 토스트 제거 함수
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // OAuth 제공자별 색상 매핑
  const getProviderColor = (providerId?: string): string => {
    if (!providerId) return "#667eea";
    const provider = providerId.split(":")[0].toLowerCase();
    const colorMap: { [key: string]: string } = {
      google: "#4285f4",      // 구글 블루
      kakao: "#fee500",       // 카카오 옐로우
      naver: "#00c73c",       // 네이버 그린
    };
    return colorMap[provider] || "#667eea";
  };
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // 사이드바 너비 조정
  const [sidebarWidth, setSidebarWidth] = useState<number>(800);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // 저장된 너비 복원
  useEffect(() => {
    const savedWidth = localStorage.getItem("youtube-scout-sidebar-width");
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth, 10));
    }
  }, []);

  // 검색 히스토리 로드
  useEffect(() => {
    const savedHistory = localStorage.getItem("youtube-scout-search-history");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 드래그로 너비 조정
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      const minWidth = 420;
      const maxWidth = 1000;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "auto";
      document.body.style.userSelect = "auto";
    };
  }, [isResizing]);

  // 너비 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("youtube-scout-sidebar-width", sidebarWidth.toString());
  }, [sidebarWidth]);

  // 프로필 드롭다운 닫기 (클릭 외부 감지)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // 채널 모달 상태
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelModalData, setChannelModalData] = useState({
    channelTitle: "",
    channelDescription: "",
    viewCount: 0,
    subscriberCount: false,
    subscriberCountValue: 0,
    videoCount: 0,
    customUrl: "",
    country: null as string | null,
    channelId: "",
    channelHandle: "",
    isLoading: false,
  });

  // 썸네일 다운로드 함수
  const handleThumbnailDownload = useCallback(async (videoId: string, title: string, thumbnailUrl: string) => {
    try {
      // 파일명 정리 (특수문자 제거)
      const safeTitle = title.replace(/[\\/:*?"<>|]/g, "").trim();

      // 썸네일 다운로드
      const response = await fetch(thumbnailUrl);
      if (!response.ok) {
        throw new Error('이미지 다운로드 실패');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // 다운로드 링크 생성
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${safeTitle}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 메모리 정리
      URL.revokeObjectURL(objectUrl);

      // 성공 토스트
      addToast({
        type: 'success',
        title: '다운로드 완료',
        message: `${safeTitle}.jpg`,
      });
    } catch (error) {
      console.error('썸네일 다운로드 실패:', error);
      addToast({
        type: 'error',
        title: '다운로드 실패',
        message: '썸네일을 다운로드할 수 없습니다',
      });
    }
  }, [addToast]);

  // ✅ 로그아웃 처리 함수 (오프라인 상태 설정)
  const handleLogout = async () => {
    try {
      if (user?.email) {
        // setUserOffline API 호출
        await fetch("/api/set-user-offline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        })
      }
    } catch (error) {
    } finally {
      // signOut 호출
      signOut?.({ redirectTo: "/" })
    }
  }

  // ✅ 브라우저 종료 감지 - 사용자를 오프라인 상태로 변경
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.email) {
        // sendBeacon 사용하여 브라우저 종료 시에도 요청 보장
        const blob = new Blob(
          [JSON.stringify({ email: user.email })],
          { type: "application/json" }
        )
        navigator.sendBeacon("/api/set-user-offline", blob)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [user?.email])

  // Engagement 레벨 계산 함수
  const getEngagementLevel = (ratio: number): number => {
    if (ratio >= 3.0) return 5;
    if (ratio >= 1.4) return 4;
    if (ratio >= 0.6) return 3;
    if (ratio >= 0.2) return 2;
    return 1;
  };

  // Engagement ratio로 필터링하는 함수
  // ✅ 길이 필터는 API에서 처리되므로 클라이언트 사이드 필터링 제거
  const filterResults = (items: any[], ratios: string[]) => {
    let filtered = items;

    // Engagement ratio 필터
    if (ratios.length > 0 && !ratios.includes("all")) {
      filtered = filtered.filter((video) => {
        // ✅ 채널 타입은 필터링 적용 안함
        if (video.type === 'channel') {
          return true;
        }

        const subscriberCount = video.subscriberCount || 0;
        const viewCount = video.viewCount || 0;

        // 🔧 구독자 정보가 없으면 필터링하지 않음 (YT-API에서 구독자 정보 미제공 시 대응)
        // 구독자 정보가 있을 때만 engagement ratio 필터링 적용
        if (subscriberCount === 0) {
          // 구독자 정보가 없는 경우: 항상 표시 (필터 무시)
          return true;
        }

        const ratio = viewCount / subscriberCount;
        const level = getEngagementLevel(ratio);

        return ratios.includes(level.toString());
      });
    }

    return filtered;
  };

  // 정렬 함수
  const sortResults = (items: any[], sortOption: string) => {
    const sorted = [...items];

    switch (sortOption) {
      case "viewCount":
        sorted.sort((a, b) => {
          // 채널은 viewCount 정렬에 영향 안줌
          if (a.type === 'channel' && b.type === 'channel') return 0;
          if (a.type === 'channel') return 1; // 채널을 뒤로
          if (b.type === 'channel') return -1;
          return (b.viewCount || 0) - (a.viewCount || 0);
        });
        break;
      case "vph":
        sorted.sort((a, b) => {
          // 채널은 VPH 정렬에 영향 안줌
          if (a.type === 'channel' && b.type === 'channel') return 0;
          if (a.type === 'channel') return 1; // 채널을 뒤로
          if (b.type === 'channel') return -1;

          const vphA = calculateVPH(a.viewCount, a.publishedAt);
          const vphB = calculateVPH(b.viewCount, b.publishedAt);

          // 둘 다 VPH = 0인 경우: 최근 발행 순
          if (vphA === 0 && vphB === 0) {
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
          }

          // 하나만 VPH = 0인 경우: VPH가 있는 쪽을 우선
          if (vphA === 0) return 1;  // A를 뒤로
          if (vphB === 0) return -1; // B를 뒤로

          // 둘 다 VPH가 있는 경우: VPH 높은 순
          return vphB - vphA;
        });
        break;
      case "engagementRatio":
        sorted.sort((a, b) => {
          // 채널도 참여율 정렬할 수 있음 (구독자수 기준)
          const ratioA = a.subscriberCount > 0 ? (a.viewCount || 0) / a.subscriberCount : 0;
          const ratioB = b.subscriberCount > 0 ? (b.viewCount || 0) / b.subscriberCount : 0;
          return ratioB - ratioA;
        });
        break;
      case "subscriberCount":
        sorted.sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0));
        break;
      case "duration":
        sorted.sort((a, b) => {
          // 채널은 duration이 없으므로 뒤로
          if (a.type === 'channel' && b.type === 'channel') return 0;
          if (a.type === 'channel') return 1; // 채널을 뒤로
          if (b.type === 'channel') return -1;

          const getDurationSeconds = (durationStr: string) => {
            const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (!match) return 0;
            const hours = parseInt(match[1] || "0");
            const minutes = parseInt(match[2] || "0");
            const seconds = parseInt(match[3] || "0");
            return hours * 3600 + minutes * 60 + seconds;
          };
          const durationA = getDurationSeconds(a.duration || "");
          const durationB = getDurationSeconds(b.duration || "");
          return durationB - durationA;
        });
        break;
      case "likeCount":
        sorted.sort((a, b) => {
          // 채널은 likeCount가 없으므로 뒤로
          if (a.type === 'channel' && b.type === 'channel') return 0;
          if (a.type === 'channel') return 1; // 채널을 뒤로
          if (b.type === 'channel') return -1;
          return (b.likeCount || 0) - (a.likeCount || 0);
        });
        break;
      case "publishedAt":
        sorted.sort((a, b) => {
          const dateA = new Date(a.publishedAt || "").getTime();
          const dateB = new Date(b.publishedAt || "").getTime();
          return dateB - dateA;
        });
        break;
      case "relevance":
      default:
        // relevance: 조회수 + 내림차순
        sorted.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
    }

    return sorted;
  };

  // 필터링된 결과 계산 (메모이제이션)
  const results = useMemo(
    () => {
      // uploadPeriod, videoLength는 API에서 이미 처리되므로 제외
      let filtered = filterResults(allResults, engagementRatios);
      const sorted = sortResults(filtered, sortBy);
      return sorted;
    },
    [allResults, engagementRatios, sortBy]
  );

  // 트렌딩 필터링된 결과 계산 (메모이제이션)
  // 트렌딩은 필터 제외, 정렬만 적용 (검색 필터 미적용)
  const filteredTrendingResults = useMemo(
    () => {
      // 정렬만 적용 (모든 필터 제외)
      return sortResults(trendingResults, sortBy);
    },
    [trendingResults, sortBy]
  );

  // 관련 영상 필터링된 결과 계산 (메모이제이션)
  // 관련 영상은 필터 제외, 정렬만 적용
  const sortedRelatedVideos = useMemo(
    () => {
      // 정렬만 적용 (모든 필터 제외)
      return sortResults(relatedVideos, sortBy);
    },
    [relatedVideos, sortBy]
  );

  // 엑셀 다운로드 함수
  const handleExcelDownload = () => {
    if (results.length === 0) {
      alert("검색 결과가 없습니다");
      return;
    }

    // CSV 헤더
    const csvHeader = ["제목", "채널명", "조회수", "구독자", "조회수/구독자", "단계", "영상길이", "업로드일", "태그", "YouTube링크"];
    const csvRows: string[][] = [];

    // 데이터 행 생성
    results.forEach((video) => {
      const title = video.title;
      const channel = video.channelTitle;
      const viewCount = video.viewCount || 0;
      const subscriberCount = video.subscriberCount || 0;
      const ratio = subscriberCount > 0 ? (viewCount / subscriberCount).toFixed(2) : "N/A";
      const level = getEngagementLevel(subscriberCount > 0 ? viewCount / subscriberCount : 0);

      // 길이 포맷팅
      let durationText = "-";
      if (video.duration) {
        const match = video.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (match) {
          const hours = parseInt(match[1] || "0");
          const minutes = parseInt(match[2] || "0");
          const seconds = parseInt(match[3] || "0");
          if (hours > 0) {
            durationText = `${hours}시간 ${minutes}분`;
          } else if (minutes > 0) {
            durationText = `${minutes}분 ${seconds}초`;
          } else {
            durationText = `${seconds}초`;
          }
        }
      }

      // 업로드 날짜 포맷팅
      const uploadDate = new Date(video.publishedAt || "").toLocaleDateString("ko-KR");

      // 태그
      const tags = video.tags ? video.tags.join(";") : "";

      // YouTube 링크
      const videoLink = `https://www.youtube.com/watch?v=${video.id}`;

      csvRows.push([
        `"${title.replace(/"/g, '""')}"`,
        `"${channel.replace(/"/g, '""')}"`,
        viewCount.toString(),
        subscriberCount.toString(),
        ratio,
        level.toString(),
        durationText,
        uploadDate,
        `"${tags.replace(/"/g, '""')}"`,
        videoLink,
      ]);
    });

    // CSV 문자열 생성
    const csv = [csvHeader.join(","), ...csvRows.map((row) => row.join(","))].join("\n");

    // 다운로드
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `youtube-search-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSearch = useCallback(async () => {
    if (!searchInput.trim()) {
      alert("검색어를 입력해주세요");
      return;
    }

    // 숏폼 선택 시 경고 메시지 표시
    if (videoLength === 'short') {
      addToast({
        type: 'warning',
        title: '숏폼 기간 필터 안내',
        message: '숏폼은 기간 필터가 지원되지 않습니다',
      });
    }

    // 검색 히스토리 저장
    const newHistory = [searchInput, ...searchHistory.filter(item => item !== searchInput)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem("youtube-scout-search-history", JSON.stringify(newHistory));

    setIsLoading(true);
    setShowTrending(false); // 검색 시 트렌딩 탭 숨기기

    // 관련 영상 히스토리 초기화
    setRelatedVideosHistory([]);
    setRelatedVideos([]);
    setShowRelatedVideos(false);
    setCurrentLevel(0);

    try {
      // 검색 API 호출 (기본값 사용 - 한 번만 호출)
      const params = new URLSearchParams({
        q: searchInput,
        upload_date: uploadPeriod,
        video_length: videoLength,
      });

      const requestUrl = `/api/youtube_search?${params}`;

      const startTime = Date.now();
      const response = await fetch(requestUrl);
      const data = await response.json();
      const fetchTime = Date.now() - startTime;

      if (!response.ok) {
        // 403 에러: 계정이 비활성화됨
        if (response.status === 403) {
          addToast({
            type: 'error',
            title: '계정이 비활성화되었습니다',
            message: '더 이상 검색할 수 없습니다. 관리자에게 문의하세요.',
          });
          setIsLoading(false);
          return;
        }

        // 429 에러: API 사용 제한 초과
        if (response.status === 429) {
          const used = data.apiUsageToday?.used || 0;
          const limit = data.apiUsageToday?.limit || 0;
          addToast({
            type: 'warning',
            title: '일일 검색 횟수 제한 초과',
            message: `오늘 사용: ${used}/${limit}회 | 내일 다시 시도해주세요`,
          });
          setIsLoading(false);
          return;
        }

        // 기타 에러
        addToast({
          type: 'error',
          title: '검색 실패',
          message: data.error || "알 수 없는 오류",
        });
        setIsLoading(false);
        return;
      }


      setAllResults(data.items || []);
      setTotalResults(data.totalResults || 0);
      setIsLoading(false);
    } catch (error) {
      alert("검색 중 오류가 발생했습니다");
      setIsLoading(false);
    }
  }, [searchInput, searchHistory, uploadPeriod, videoLength, addToast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 트렌딩 영상 조회 함수
  const handleTrendingClick = useCallback(async (section: string) => {
    setTrendingSection(section);
    setShowTrending(true);
    setIsTrendingLoading(true);

    // 관련 영상 히스토리 초기화
    setRelatedVideosHistory([]);
    setRelatedVideos([]);
    setShowRelatedVideos(false);
    setCurrentLevel(0);

    try {
      const params = new URLSearchParams({
        section: section,
      });

      const response = await fetch(`/api/trending?${params}`);
      const data = await response.json();

      if (!response.ok) {
        // API 사용 제한 초과
        if (response.status === 429) {
          const used = data.apiUsageToday?.used || 0;
          const limit = data.apiUsageToday?.limit || 0;
          addToast({
            type: 'warning',
            title: '일일 검색 횟수 제한 초과',
            message: `오늘 사용: ${used}/${limit}회 | 내일 다시 시도해주세요`,
          });
          return;
        }

        addToast({
          type: 'error',
          title: '트렌딩 조회 실패',
          message: data.error || "알 수 없는 오류",
        });
        return;
      }

      setTrendingResults(data.items || []);
    } catch (error) {
      addToast({
        type: 'error',
        title: '트렌딩 조회 실패',
        message: "트렌딩 조회 중 오류가 발생했습니다",
      });
    } finally {
      setIsTrendingLoading(false);
    }
  }, [addToast]);

  // 히스토리 항목 클릭
  const handleHistoryClick = (keyword: string) => {
    setSearchInput(keyword);
  };

  // 히스토리 항목 삭제
  const handleDeleteHistory = (e: React.MouseEvent, keyword: string) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(item => item !== keyword);
    setSearchHistory(newHistory);
    localStorage.setItem("youtube-scout-search-history", JSON.stringify(newHistory));
  };


  // 채널 조회 함수
  const handleChannelClick = useCallback(async (channelId: string, channelTitle: string) => {
    setChannelModalData((prev) => ({
      ...prev,
      isLoading: true,
      channelTitle,
      channelId,
    }));
    setShowChannelModal(true);

    try {
      const response = await fetch(`/api/youtube_channel?channelId=${channelId}`);
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "채널 정보를 불러올 수 없습니다");
        setChannelModalData((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      setChannelModalData((prev) => ({
        ...prev,
        channelDescription: data.description,
        viewCount: data.viewCount,
        subscriberCount: data.hiddenSubscriberCount,
        subscriberCountValue: data.subscriberCount,
        videoCount: data.videoCount,
        customUrl: data.customUrl,
        country: data.country || null,
        channelHandle: data.channelHandle || '',
        isLoading: false,
      }));
    } catch (error) {
      alert("채널 정보 조회 중 오류가 발생했습니다");
      setChannelModalData((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // 관련 영상 조회 함수
  const handleRelatedClick = useCallback(async (videoId: string) => {
    // ✅ 먼저 관련 영상 뷰 활성화 + 로딩 시작 (동시에 업데이트)
    setShowRelatedVideos(true);
    setIsRelatedVideosLoading(true);

    try {
      const response = await fetch(`/api/related-videos?videoId=${encodeURIComponent(videoId)}`);
      const data = await response.json();

      if (!response.ok) {
        addToast({
          type: 'error',
          message: data.error || '관련 영상을 불러올 수 없습니다',
        });
        setIsRelatedVideosLoading(false);
        return;
      }

      // Find current video info
      const currentVideo = relatedVideos.find((v) => v.id === videoId) ||
                          allResults.find((v) => v.id === videoId) ||
                          trendingResults.find((v) => v.id === videoId);

      if (!currentVideo) {
        console.warn('Current video not found');
        setIsRelatedVideosLoading(false);
        return;
      }

      // Check max depth
      if (relatedVideosHistory.length >= MAX_HISTORY_DEPTH) {
        addToast({
          type: 'warning',
          message: `최대 탐색 깊이(${MAX_HISTORY_DEPTH}단계)에 도달했습니다`,
        });
        setIsRelatedVideosLoading(false);
        return;
      }

      // Push current state to history
      const newHistoryItem: RelatedVideoHistoryItem = {
        videoId: currentVideo.id,
        title: currentVideo.title,
        thumbnail: currentVideo.thumbnail,
        results: relatedVideos.length > 0 ? relatedVideos : (showTrending ? trendingResults : allResults),
      };

      setRelatedVideosHistory(prev => [...prev, newHistoryItem]);

      setRelatedVideos(data.items);
      setCurrentLevel(relatedVideosHistory.length + 1); // 새로운 레벨로 업데이트
      setIsRelatedVideosLoading(false);

    } catch (error) {
      console.error('관련 영상 조회 중 오류:', error);
      addToast({
        type: 'error',
        message: '관련 영상 조회 중 오류가 발생했습니다',
      });
      setIsRelatedVideosLoading(false);
    }
  }, [relatedVideos, allResults, trendingResults, relatedVideosHistory, showTrending, addToast]);

  return (
    <>
      <div className="main-container">
        {/* 왼쪽 패널 */}
        <div className="sidebar" style={{ width: `${sidebarWidth}px` }}>
          <div className="sidebar-title" onClick={handleTitleClick} style={{ cursor: "pointer", transition: "opacity 0.3s", opacity: isTitleRefreshing ? 0.5 : 1 }}>
            유튜브 스카우트
          </div>

          <div className="search-section">
            <div className="search-input-wrapper">
              <div className="search-label">검색어</div>
              <div className="search-container-with-button">
                <div className="search-container">
                  <input
                    type="text"
                    className="search-input"
                    placeholder=""
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  {searchHistory.length > 0 && searchInput === "" && (
                    <div className="search-history-dropdown active">
                      {searchHistory.map((keyword) => (
                        <div
                          key={keyword}
                          className="history-item"
                          onClick={() => handleHistoryClick(keyword)}
                        >
                          <span>{keyword}</span>
                          <button
                            className="history-delete"
                            onClick={(e) => handleDeleteHistory(e, keyword)}
                            title="삭제"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button className="btn-search" onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? "검색 중..." : "검색"}
                </button>
              </div>
            </div>

          </div>


          {/* 필터 섹션 */}
          <div className="filters-wrapper">
            <PeriodFilter value={uploadPeriod} onChange={setUploadPeriod} />
            <VideoLengthFilter value={videoLength} onChange={setVideoLength} />
            <EngagementRatioFilter selectedValues={engagementRatios} onChange={setEngagementRatios} />
          </div>

          {/* 트렌딩 입력 섹션 */}
          <div className="trending-input-wrapper">
            <div className="trending-label">트렌딩 영상</div>
            <div className="trending-container-with-button">
              <select
                className="trending-dropdown"
                value={trendingSection}
                onChange={(e) => setTrendingSection(e.target.value)}
                disabled={isTrendingLoading}
              >
                <option value="now-kr">⭐ 지금 뜨는 (한국)</option>
                <option value="now-jp">⭐ 지금 뜨는 (일본)</option>
                <option value="now-us">⭐ 지금 뜨는 (미국)</option>
                <option value="now-gb">⭐ 지금 뜨는 (영국)</option>
                <option value="now-de">⭐ 지금 뜨는 (독일)</option>
                <option value="now-vn">⭐ 지금 뜨는 (베트남)</option>
                <option value="music-kr">🎵 음악 (한국)</option>
                <option value="games-kr">🎮 게임 (한국)</option>
                <option value="movies-kr">🎬 영화 (한국)</option>
              </select>
              <button
                className="btn-trending"
                onClick={() => handleTrendingClick(trendingSection)}
                disabled={isTrendingLoading}
              >
                {isTrendingLoading ? "로딩중..." : "조회"}
              </button>
            </div>
          </div>
        </div>

        {/* 리사이저 */}
        <div
          ref={resizeRef}
          className="sidebar-resizer"
          onMouseDown={() => setIsResizing(true)}
        ></div>

        {/* 오른쪽 컨텐츠 영역 */}
        <div className="content">
          <div className="content-header">
            <div className="content-title">
              {showRelatedVideos
                ? relatedVideosHistory.length > 0
                  ? `관련 영상: ${relatedVideosHistory[relatedVideosHistory.length - 1].title}`
                  : '관련 영상'
                : '검색결과'
              }
            </div>
            {showRelatedVideos && (
              <button
                className="btn-back-to-results"
                onClick={() => {
                  // Return to search results but keep history
                  setShowRelatedVideos(false);
                  setCurrentLevel(0);
                  // 히스토리는 유지하여 드롭다운이 계속 보이도록 함
                }}
                style={{ marginRight: 'auto' }}
              >
                ← 검색결과로 돌아가기
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: 'auto' }}>
              {relatedVideosHistory.length > 0 && (
                <Breadcrumb
                  items={[
                    {
                      title: '검색결과',
                      level: 0,
                      isCurrent: currentLevel === 0,
                      onClick: () => {
                        setRelatedVideosHistory([]);
                        setRelatedVideos([]);
                        setShowRelatedVideos(false);
                        setCurrentLevel(0);
                      }
                    },
                    ...relatedVideosHistory.map((item, index) => ({
                      title: item.title,
                      level: index + 1,
                      isCurrent: currentLevel === index + 1,
                      onClick: () => {
                        // Navigate to this level: restore results only
                        // 히스토리는 유지하고 현재 위치만 변경
                        setRelatedVideos(item.results);
                        setCurrentLevel(index + 1);
                        setShowRelatedVideos(true);
                      }
                    }))
                  ]}
                />
              )}
              <div className="controls-right">
              <div className="view-toggle">
                <button className={`view-btn ${viewMode === "card" ? "active" : ""}`} onClick={() => setViewMode("card")}>
                  <LayoutGrid size={16} style={{ display: "inline", marginRight: "4px" }} />
                  카드
                </button>
                <button className={`view-btn ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")}>
                  <Table2 size={16} style={{ display: "inline", marginRight: "4px" }} />
                  테이블
                </button>
              </div>
              <select className="sort-dropdown" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="relevance">조회수 + 내림차순</option>
                <option value="viewCount">조회수순</option>
                <option value="vph">VPH순 (높음)</option>
                <option value="engagementRatio">비율순 (높음)</option>
                <option value="subscriberCount">구독자순</option>
                <option value="duration">길이순 (길음)</option>
                <option value="likeCount">좋아요순</option>
                <option value="publishedAt">최신순</option>
              </select>
              <button className="btn-excel" onClick={handleExcelDownload}>
                <Download size={16} style={{ display: "inline", marginRight: "4px" }} />
                엑셀
              </button>

              {/* 프로필 드롭다운 */}
              <div className="profile-dropdown-container" ref={profileDropdownRef}>
                <div className="profile-divider">|</div>
                <button
                  className="profile-avatar-btn"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  title="프로필 메뉴"
                  style={{ borderColor: getProviderColor(user?.id) }}
                >
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user?.name || "User"}
                      className="profile-avatar"
                    />
                  ) : (
                    <div
                      className="profile-avatar-fallback"
                      style={{ background: getProviderColor(user?.id) }}
                    >
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </button>

                {profileDropdownOpen && (
                  <div className="profile-dropdown-menu">
                    {/* 프로필 정보 */}
                    <div className="profile-dropdown-header">
                      <div className="profile-dropdown-name">{user?.name || "사용자"}</div>
                      <div className="profile-dropdown-email">{user?.email}</div>
                    </div>

                    {/* 로그아웃 */}
                    <button
                      className="profile-dropdown-logout"
                      onClick={() => handleLogout()}
                    >
                      🚪 로그아웃
                    </button>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>

          <SearchResults
            results={showRelatedVideos ? sortedRelatedVideos : (showTrending ? filteredTrendingResults : results)}
            totalResults={showRelatedVideos ? sortedRelatedVideos.length : (showTrending ? filteredTrendingResults.length : totalResults)}
            isLoading={showRelatedVideos ? isRelatedVideosLoading : (showTrending ? isTrendingLoading : isLoading)}
            showVPH={true}
            viewMode={viewMode}
            onChannelClick={handleChannelClick}
            onRelatedClick={handleRelatedClick}
            onThumbnailDownload={handleThumbnailDownload}
            onToast={addToast}
          />
        </div>
      </div>

      {/* 채널 분석 모달 */}
      <ChannelModal
        isOpen={showChannelModal}
        channelTitle={channelModalData.channelTitle}
        channelDescription={channelModalData.channelDescription}
        viewCount={channelModalData.viewCount}
        subscriberCount={channelModalData.subscriberCount}
        subscriberCountValue={channelModalData.subscriberCountValue}
        videoCount={channelModalData.videoCount}
        customUrl={channelModalData.customUrl}
        country={channelModalData.country}
        channelId={channelModalData.channelId}
        channelHandle={channelModalData.channelHandle}
        isLoading={channelModalData.isLoading}
        onClose={() => setShowChannelModal(false)}
      />

      {/* 토스트 알림 */}
      <Toast
        toasts={toasts}
        onRemove={removeToast}
        position="top-center"
      />
    </>
  );
}
