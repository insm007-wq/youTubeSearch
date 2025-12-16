'use client'

interface TagAnalysisProps {
  tags?: string[]
  title: string
}

export default function TagAnalysis({ tags = [], title }: TagAnalysisProps) {
  // 해시태그 정규화 (# 기호 추가/제거)
  const normalizeHashtag = (tag: string): string => {
    if (!tag || typeof tag !== 'string') {
      return ''
    }

    const cleaned = tag.replace(/^#+/, '').trim()

    if (!cleaned) {
      return ''
    }

    // 이미 # 기호가 있으면 그대로, 없으면 추가
    return tag.startsWith('#') ? tag : `#${cleaned}`
  }

  // 제목에서 태그 추출 (한글/영문 키워드) - API 해시태그가 없을 때만 사용
  const extractTagsFromTitle = (text: string): string[] => {
    const words = text.split(/[\s\-\(\)\[\]#]+/).filter(word => {
      // 2글자 이상, 숫자 제외
      return word.length >= 2 && !/^\d+$/.test(word)
    })

    // 중복 제거, 소문자로 통일
    return Array.from(new Set(words.map(w => w.toLowerCase())))
      .slice(0, 5) // 상위 5개만
      .map(w => `#${w}`)
  }

  // 1. API에서 받은 해시태그 우선 사용
  // 2. API 해시태그가 없으면 제목에서 추출
  const apiHashtags = tags
    ?.filter(tag => typeof tag === 'string' && tag.trim().length > 0)
    .map(normalizeHashtag) || []

  const titleHashtags =
    apiHashtags.length > 0 ? [] : extractTagsFromTitle(title)

  // 전체 해시태그 합치기
  const allTags = [...apiHashtags, ...titleHashtags]

  // 중복 제거 (소문자 기준)
  const uniqueTags = Array.from(
    new Map(
      allTags.map(tag => [tag.toLowerCase(), tag])
    ).values()
  ).slice(0, 10) // 최대 10개

  if (uniqueTags.length === 0) {
    return (
      <div className="video-tags">
        <span style={{ fontSize: '11px', color: '#999' }}>태그 없음</span>
      </div>
    )
  }

  return (
    <div className="video-tags">
      {uniqueTags.map((tag) => (
        <a
          key={tag}
          className="tag hashtag-tag"
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(tag)}`}
          target="_blank"
          rel="noopener noreferrer"
          title={`"${tag}"로 유튜브 검색`}
        >
          {tag}
        </a>
      ))}
    </div>
  )
}
