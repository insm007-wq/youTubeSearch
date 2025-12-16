/**
 * YouTube 제목에서 해시태그 추출 유틸리티
 *
 * 예시:
 * "맛집 탐방 #서울맛집 #브이로그 #먹방" → ["#서울맛집", "#브이로그", "#먹방"]
 * "Gaming Stream #게임 #livestream" → ["#게임", "#livestream"]
 */

/**
 * YouTube 제목에서 해시태그 추출
 * @param title 동영상 제목
 * @returns 해시태그 배열 (# 포함)
 */
export function extractHashtagsFromTitle(title: string): string[] {
  if (!title || typeof title !== 'string') {
    return []
  }

  try {
    // 유니코드 문자(한글, 영어, 숫자, 언더스코어) + 일부 기호 지원
    // \p{L}: 모든 언어의 문자
    // \p{N}: 숫자
    // [-_가-힣a-zA-Z0-9]: 명시적 문자 지원 (유니코드 미지원 환경)
    const hashtagRegex = /#([\p{L}\p{N}_-]+|[a-zA-Z0-9가-힣_-]+)/gu

    const matches = title.match(hashtagRegex) || []

    // 중복 제거 (소문자 기준)
    const uniqueHashtags = Array.from(
      new Map(
        matches.map((tag) => [tag.toLowerCase(), tag])
      ).values()
    )

    // 최대 10개까지만 반환
    return uniqueHashtags.slice(0, 10)
  } catch (error) {
    console.warn('❌ 해시태그 추출 오류:', error)
    return []
  }
}

/**
 * 주어진 텍스트에서 해시태그 제거
 * @param text 텍스트
 * @returns 해시태그가 제거된 텍스트
 */
export function removeHashtagsFromText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text
  }

  return text.replace(/#[\p{L}\p{N}_-]+/gu, '').trim()
}

/**
 * 주어진 배열이 유효한 해시태그 배열인지 확인
 * @param tags 배열
 * @returns true if valid
 */
export function isValidHashtagArray(tags: any): tags is string[] {
  return (
    Array.isArray(tags) &&
    tags.length > 0 &&
    tags.every((tag) => typeof tag === 'string' && tag.trim().length > 0)
  )
}

/**
 * 해시태그 형식 정규화 (# 기호 추가/제거)
 * @param hashtag 해시태그
 * @param addHash # 기호 추가 여부
 * @returns 정규화된 해시태그
 */
export function normalizeHashtag(hashtag: string, addHash: boolean = true): string {
  if (!hashtag || typeof hashtag !== 'string') {
    return ''
  }

  const cleaned = hashtag.replace(/^#+/, '').trim()

  if (!cleaned) {
    return ''
  }

  return addHash ? `#${cleaned}` : cleaned
}
