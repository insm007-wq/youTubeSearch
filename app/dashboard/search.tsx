"use client";

import { useState, useRef, useEffect } from "react";
import SearchResults from "@/app/components/SearchResults/SearchResults";
import PeriodFilter from "@/app/components/Filters/PeriodFilter/PeriodFilter";
import VideoLengthFilter from "@/app/components/Filters/VideoLengthFilter/VideoLengthFilter";
import VPHCheckbox from "@/app/components/Filters/VPHCheckbox/VPHCheckbox";
import EngagementRatioFilter from "@/app/components/Filters/EngagementRatioFilter/EngagementRatioFilter";
import CommentsModal from "@/app/components/CommentsModal/CommentsModal";
import ChannelModal from "@/app/components/ChannelModal/ChannelModal";
import "./search.css";

interface Comment {
  author: string;
  text: string;
  likes: number;
  replies: number;
}

interface SearchProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  signOut?: (options: any) => Promise<void>;
}

export default function Search({ user, signOut }: SearchProps) {
  const [searchInput, setSearchInput] = useState("");
  const [uploadPeriod, setUploadPeriod] = useState("all");
  const [videoLength, setVideoLength] = useState("all");
  const [showVPH, setShowVPH] = useState(true);
  const [engagementRatios, setEngagementRatios] = useState<string[]>(["4", "5"]);
  const [isLoading, setIsLoading] = useState(false);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [sortBy, setSortBy] = useState("relevance");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // 댓글 모달 상태
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsModalData, setCommentsModalData] = useState({
    videoTitle: "",
    comments: [] as Comment[],
    totalReplies: 0,
    totalLikes: 0,
    isLoading: false,
  });

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
    channelId: "",
    isLoading: false,
  });

  // 프로필 드롭다운 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [profileDropdownOpen]);

  // 기간 필터링 함수
  const filterResultsByPeriod = (items: any[], period: string) => {
    if (period === "all") return items;

    const now = Date.now();
    return items.filter((video) => {
      const publishDate = new Date(video.publishedAt || "").getTime();
      const daysAgo = (now - publishDate) / (1000 * 60 * 60 * 24);

      if (period === "1month" && daysAgo > 30) return false;
      if (period === "2months" && daysAgo > 60) return false;
      if (period === "6months" && daysAgo > 180) return false;
      if (period === "1year" && daysAgo > 365) return false;

      return true;
    });
  };

  // Engagement 레벨 계산 함수
  const getEngagementLevel = (ratio: number): number => {
    if (ratio >= 3.0) return 5;
    if (ratio >= 1.4) return 4;
    if (ratio >= 0.6) return 3;
    if (ratio >= 0.2) return 2;
    return 1;
  };

  // 기간, 길이, engagement ratio로 필터링하는 함수
  const filterResults = (items: any[], period: string, length: string, ratios: string[]) => {
    let filtered = filterResultsByPeriod(items, period);

    // 길이 필터
    if (length !== "all") {
      filtered = filtered.filter((video) => {
        const durationStr = video.duration || "";
        // ISO 8601 duration 파싱 (예: PT1H30M45S)
        const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return true;

        const hours = parseInt(match[1] || "0");
        const minutes = parseInt(match[2] || "0");
        const seconds = parseInt(match[3] || "0");
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        // 180초(3분)를 기준으로 필터
        if (length === "short" && totalSeconds > 180) return false;
        if (length === "long" && totalSeconds <= 180) return false;

        return true;
      });
    }

    // Engagement ratio 필터
    if (ratios.length > 0 && !ratios.includes("all")) {
      filtered = filtered.filter((video) => {
        const subscriberCount = video.subscriberCount || 0;
        const viewCount = video.viewCount || 0;

        if (subscriberCount === 0) return false;

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
        sorted.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
      case "vph":
        sorted.sort((a, b) => {
          const vphA = a.subscriberCount > 0 ? a.viewCount / a.subscriberCount : 0;
          const vphB = b.subscriberCount > 0 ? b.viewCount / b.subscriberCount : 0;
          return vphB - vphA;
        });
        break;
      case "engagementRatio":
        sorted.sort((a, b) => {
          const ratioA = a.subscriberCount > 0 ? a.viewCount / a.subscriberCount : 0;
          const ratioB = b.subscriberCount > 0 ? b.viewCount / b.subscriberCount : 0;
          return ratioB - ratioA;
        });
        break;
      case "subscriberCount":
        sorted.sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0));
        break;
      case "duration":
        sorted.sort((a, b) => {
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
        sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
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

  // 필터링된 결과 계산
  let results = filterResults(allResults, uploadPeriod, videoLength, engagementRatios);
  results = sortResults(results, sortBy);

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

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      alert("검색어를 입력해주세요");
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchInput,
        maxResults: "50", // 더 많은 결과 가져오기
      });

      const response = await fetch(`/api/youtube_search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        alert(`검색 실패: ${data.error || "알 수 없는 오류"}`);
        return;
      }

      setAllResults(data.items || []);
      setTotalResults(data.totalResults || 0);
    } catch (error) {
      console.error("검색 오류:", error);
      alert("검색 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 댓글 조회 함수
  const handleCommentsClick = async (videoId: string, videoTitle: string) => {
    setCommentsModalData((prev) => ({
      ...prev,
      isLoading: true,
      videoTitle,
    }));
    setShowCommentsModal(true);

    try {
      const response = await fetch(`/api/youtube_comments?videoId=${videoId}`);
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "댓글을 불러올 수 없습니다");
        setCommentsModalData((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      setCommentsModalData((prev) => ({
        ...prev,
        comments: data.comments,
        totalReplies: data.totalReplies,
        totalLikes: data.totalLikes,
        isLoading: false,
      }));
    } catch (error) {
      console.error("댓글 조회 오류:", error);
      alert("댓글 조회 중 오류가 발생했습니다");
      setCommentsModalData((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // 채널 조회 함수
  const handleChannelClick = async (channelId: string, channelTitle: string) => {
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
        isLoading: false,
      }));
    } catch (error) {
      console.error("채널 조회 오류:", error);
      alert("채널 정보 조회 중 오류가 발생했습니다");
      setChannelModalData((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <>
      <div className="main-container">
        {/* 왼쪽 패널 */}
        <div className="sidebar">
          <div className="sidebar-title">유튜브 스카우트</div>

          {/* 검색 섹션 */}
          <div className="search-section">
            <div className="search-label">검색어</div>
            <div className="search-container-with-button">
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder=""
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <div className="search-history-dropdown" id="searchHistory"></div>
              </div>
              <button className="btn-search" onClick={handleSearch} disabled={isLoading}>
                {isLoading ? "검색 중..." : "검색"}
              </button>
            </div>
          </div>

          {/* 저장된 검색 섹션 */}
          <div className="saved-searches-section">
            <div className="saved-searches-title">💾 저장된 검색</div>
            <div className="saved-searches-controls">
              <input type="text" className="saved-search-name-input" placeholder="검색 이름 입력" />
              <button className="btn-save-search">저장</button>
            </div>
            <div className="saved-searches-list" id="savedSearchesList"></div>
          </div>

          {/* 필터 섹션 */}
          <div className="filters-wrapper">
            <PeriodFilter value={uploadPeriod} onChange={setUploadPeriod} />
            <VideoLengthFilter value={videoLength} onChange={setVideoLength} />
            <VPHCheckbox checked={showVPH} onChange={setShowVPH} />
            <EngagementRatioFilter selectedValues={engagementRatios} onChange={setEngagementRatios} />
          </div>
        </div>

        {/* 오른쪽 컨텐츠 영역 */}
        <div className="content">
          <div className="content-header">
            <div className="content-title">검색결과</div>
            <div className="controls-right">
              <div className="view-toggle">
                <button className={`view-btn ${viewMode === "card" ? "active" : ""}`} onClick={() => setViewMode("card")}>
                  📇 카드
                </button>
                <button className={`view-btn ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")}>
                  📊 테이블
                </button>
              </div>
              <select className="sort-dropdown" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="relevance">조회수 + 내림차순</option>
                <option value="viewCount">조회수순</option>
                {showVPH && <option value="vph">VPH순 (높음)</option>}
                <option value="engagementRatio">비율순 (높음)</option>
                <option value="subscriberCount">구독자순</option>
                <option value="duration">길이순 (길음)</option>
                <option value="likeCount">좋아요순</option>
                <option value="publishedAt">최신순</option>
              </select>
              <button className="btn-excel" onClick={handleExcelDownload}>
                📥 엑셀
              </button>

              {/* 프로필 드롭다운 */}
              <div className="profile-dropdown-container" ref={profileDropdownRef}>
                <div className="profile-divider">|</div>
                <button
                  className="profile-avatar-btn"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  title="프로필 메뉴"
                >
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user?.name || "User"}
                      className="profile-avatar"
                    />
                  ) : (
                    <div className="profile-avatar-fallback">
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
                      onClick={() => signOut?.({ redirectTo: "/" })}
                    >
                      🚪 로그아웃
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <SearchResults
            results={results}
            totalResults={totalResults}
            isLoading={isLoading}
            showVPH={showVPH}
            viewMode={viewMode}
            onChannelClick={handleChannelClick}
            onCommentsClick={handleCommentsClick}
          />
        </div>
      </div>

      {/* 댓글 분석 모달 */}
      <CommentsModal
        isOpen={showCommentsModal}
        videoTitle={commentsModalData.videoTitle}
        comments={commentsModalData.comments}
        totalReplies={commentsModalData.totalReplies}
        totalLikes={commentsModalData.totalLikes}
        isLoading={commentsModalData.isLoading}
        onClose={() => setShowCommentsModal(false)}
      />

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
        channelId={channelModalData.channelId}
        isLoading={channelModalData.isLoading}
        onClose={() => setShowChannelModal(false)}
      />
    </>
  );
}
