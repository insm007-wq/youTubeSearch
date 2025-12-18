/**
 * vidIQ 방식의 VPH (Views Per Hour) 계산 유틸리티
 * Legacy HTML의 vidIQ 방식을 Next.js 앱에 이식
 *
 * vidIQ VPH = (viewCount / hoursElapsed) × decayFactor
 * - 시간당 조회수 계산
 * - 감쇠 계수로 최근 트렌드 반영
 */

/**
 * vidIQ 방식의 감쇠 계수 계산
 * 업로드 후 경과 시간에 따라 신뢰도 조정
 *
 * @param daysSinceUpload - 업로드 후 경과 일수
 * @returns 감쇠 계수 (0 ~ 1.0)
 */
export function getDecayFactor(daysSinceUpload: number): number {
  if (daysSinceUpload <= 0.2) return 1.0;    // 0-5시간: 100%
  if (daysSinceUpload <= 0.6) return 0.93;   // 5-15시간: 93%
  if (daysSinceUpload <= 1) return 1.0;      // 15-24시간: 100%
  if (daysSinceUpload <= 2) return 0.47;     // 1-2일: 47%
  if (daysSinceUpload <= 3) return 0.26;     // 2-3일: 26%
  if (daysSinceUpload <= 7) return 0.30;     // 3-7일: 30%
  if (daysSinceUpload <= 14) return 0.185;   // 7-14일: 18.5%
  if (daysSinceUpload <= 30) return 0.26;    // 14-30일: 26%
  return 0.11;                                // 30일 이상: 11%
}

/**
 * vidIQ 방식 VPH 계산
 *
 * @param viewCount - 총 조회수
 * @param publishedAt - 업로드 시간 (ISO 8601 형식)
 * @returns VPH 값 (반올림된 정수)
 *
 * @example
 * const vph = calculateVPH(5000, "2025-12-10T10:30:00Z");
 * // 약 200 (시간당 조회수)
 */
export function calculateVPH(
  viewCount: number,
  publishedAt: string
): number {
  try {
    if (!publishedAt || !viewCount) return 0;

    // vidIQ 방식: 50회 미만 조회수는 신뢰할 수 있는 데이터 없음
    if (viewCount < 50) {
      return 0;
    }

    const now = new Date();
    const uploadDate = new Date(publishedAt);

    // uploadDate가 유효한 날짜인지 확인
    if (isNaN(uploadDate.getTime())) {
      return 0;
    }

    const hoursElapsed = (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60);
    const daysSinceUpload = hoursElapsed / 24;

    // hoursElapsed가 0 이하이거나 유한하지 않으면 반환
    if (hoursElapsed <= 0 || !isFinite(hoursElapsed)) {
      return 0;
    }

    // vidIQ 방식: 1시간 미만 영상은 신뢰할 수 있는 VPH 계산 불가
    if (hoursElapsed < 1.0) {
      return 0;
    }

    // 기본 VPH = 조회수 / 경과 시간
    const baseVPH = viewCount / hoursElapsed;

    // vidIQ 방식: 감쇠 계수 적용으로 최근 트렌드 반영
    const decayFactor = getDecayFactor(daysSinceUpload);
    const adjustedVPH = baseVPH * decayFactor;

    // 최종 VPH가 유한한 수인지 확인
    if (!isFinite(adjustedVPH)) {
      return 0;
    }

    return Math.round(adjustedVPH);
  } catch (error) {
    return 0;
  }
}
