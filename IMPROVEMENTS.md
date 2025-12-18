# YT-API 통합 개선사항 (test8)

## 개요
YouTube V2 API에서 RapidAPI YT-API로 마이그레이션 후 발견된 문제점들을 종합적으로 개선했습니다.

---

## 1️⃣ API 응답 정규화 계층 추가

**문제:**
- YT-API는 필드명이 일관성 없음 (videoId vs id vs vid)
- 조회수, 구독자 수 등이 여러 형식으로 제공 (문자열: "1.5M", 숫자: 1500000)
- Fallback 체인이 복잡하고 유지보수 어려움

**해결책: `lib/apiResponseNormalizer.ts`**

```typescript
// FieldExtractor 클래스로 안전한 필드 추출
class FieldExtractor {
  getString(...fields: string[]): string          // 첫 번째 유효한 문자열 반환
  getNumber(...fields: string[]): number          // 첫 번째 유효한 숫자 반환
  getArray(...fields: string[]): any[]            // 첫 번째 유효한 배열 반환
  getBoolean(...fields: string[]): boolean        // 첫 번째 유효한 불린 반환
}

// 정규화 함수들
normalizeVideo(raw: RawYTAPIVideo): NormalizedVideo        // 비디오 정규화
normalizeChannelInfo(raw: any): NormalizedChannelInfo      // 채널 정보 정규화
normalizeDuration(durationStr): string                     // 재생시간 정규화
normalizePublishedDate(relativeTime): string               // 발행 날짜 정규화
parseNumberString(value): number                           // 숫자 문자열 파싱
extractThumbnail(data): string                             // 썸네일 URL 추출
```

**효과:**
- 필드 추출 로직 중앙화
- Null-safe한 접근
- 코드 재사용성 증대
- 타입 안정성 개선

---

## 2️⃣ Pagination 지원

**문제:**
- 한 번의 API 호출로 최대 ~50개 영상만 반환
- 사용자가 요청한 50개 이상을 받기 어려움
- Continuation 토큰이 활용되지 않음

**해결책: `lib/rapidApiClient.ts` - searchWithYTAPI()**

```typescript
async function searchWithYTAPI(
  query: string,
  targetCount: number = 50,
  uploadDate?: string,
  continuation?: string  // ← 새로 추가
): Promise<{
  items: NormalizedVideo[]
  metadata: SearchMetadata
}>

// Pagination 루프:
// 1. targetCount 도달할 때까지 반복 요청
// 2. 최대 3페이지 제한 (500명 동시 사용자 고려)
// 3. Rate limit 감시: remaining < 5일 때 중단
// 4. continuation이 없으면 자동 중단
```

**설정:**
```typescript
// 최대 3페이지까지 자동으로 요청
pageCount < 3 && totalFetched < targetCount
```

**효과:**
- 더 많은 검색 결과 제공 가능
- 서버 부하 제한 (최대 3페이지)
- 유연한 targetCount 지원

---

## 3️⃣ Rate-Limiting 헤더 기반 개선

**문제:**
- 429 Too Many Requests 응답 시 고정 2초 대기
- Retry-After 헤더 무시
- Rate limit 상태 모니터링 불가

**해결책:**

### 3.1 Rate-Limit 헤더 파싱
```typescript
function parseRateLimitHeaders(headers: Headers) {
  return {
    remaining: headers.get('x-ratelimit-requests-remaining'),
    reset: headers.get('x-ratelimit-requests-reset'),
    limit: headers.get('x-ratelimit-requests-limit'),
  }
}

// 모든 응답에서 Rate-limit 정보 추출
const rateLimitInfo = parseRateLimitHeaders(response.headers)
```

### 3.2 Retry-After 헤더 파싱
```typescript
function parseRetryAfter(headers: Headers): number {
  const retryAfter = headers.get('retry-after')
  // "120" (초) 또는 HTTP-date 형식 파싱
  // → 밀리초로 변환 후 반환
}

// 429 응답 시 Retry-After 사용
if (isRateLimitError) {
  const delay = parseRetryAfter(error.headers)
  await sleep(delay)
}
```

### 3.3 지수 백오프 강화
```typescript
// 재시도 전략: 초기 500ms → 1초 → 2초 → ...
async withRetry(fn, retries, delay) {
  try { return await fn() }
  catch (error) {
    await sleep(delay)
    return withRetry(fn, retries - 1, delay * 2)  // ← 2배씩 증가
  }
}

// 재시도 횟수 2 → 3으로 증가
RETRY_COUNT: 3
```

**효과:**
- Rate limit 지키지 않을 위험 감소
- API 서버의 재시도 권고사항 존중
- 서버 부하 분산

---

## 4️⃣ 구조화된 에러 로깅

**문제:**
- 에러 로그가 일관성 없음
- 디버깅 정보 부족
- Rate-limit 상태 추적 어려움

**해결책: `APIError` 클래스 + `errorLogger` 객체**

```typescript
class APIError extends Error {
  statusCode: number
  retryable: boolean
  context: Record<string, any>
  headers?: Headers
}

const errorLogger = {
  error(message, error?, context?) {
    // 타임스탐프 + 레벨 + 메시지 + 컨텍스트 JSON 로깅
    console.log(JSON.stringify({
      timestamp: ISO8601,
      level: 'error',
      message,
      error: { message, statusCode, retryable, context },
      ...context
    }))
  }
  // warn(), info() 동일
}
```

**로그 예시:**
```json
{
  "timestamp": "2024-12-18T10:30:45.123Z",
  "level": "info",
  "message": "✅ YT-API 검색 완료",
  "query": "한글 검색어",
  "itemsReturned": 45,
  "pagesRequested": 2,
  "totalTime": 3240,
  "rateLimitRemaining": 98
}
```

**효과:**
- JSON 형식으로 로깅 서비스 연동 용이 (ELK, Datadog 등)
- 구조화된 디버깅 정보
- Rate-limit 모니터링 가능

---

## 5️⃣ API 경로 개선: 검색 API

**파일:** `/app/api/youtube_search/route.ts`

### 개선사항:
```typescript
// 1. 구조화된 에러 처리
try {
  items = await searchYouTubeWithRapidAPI(...)
} catch (error) {
  // statusCode 확인
  const statusCode = error.statusCode || 500

  if (statusCode === 429) {
    return { error: 'SEARCH_RATE_LIMITED', ... }
  }
  if (statusCode === 401 || statusCode === 403) {
    return { error: 'SEARCH_AUTH_ERROR', ... }
  }
  return { error: 'SEARCH_FAILED', ... }
}

// 2. 성능 메트릭 로깅
console.log(`✅ YT-API 검색 완료: ${query} - ${items.length}개 (${searchTime}ms)`)
```

**효과:**
- Rate-limit 에러와 일반 에러 구분
- 사용자에게 명확한 메시지 제공
- 성능 추적 가능

---

## 6️⃣ 타입 안정성 강화

### 새로운 인터페이스

```typescript
// 정규화된 비디오 정보
interface NormalizedVideo {
  videoId: string
  title: string
  description: string
  channelId: string
  channelTitle: string
  publishedAt: string  // ISO 8601
  viewCount: number
  likeCount: number
  commentCount: number
  duration: string     // ISO 8601 (PT12M34S)
  subscriberCount: number
  thumbnail: string
  keywords: string[]
  type: 'video' | 'shorts'
}

// 검색 응답 메타데이터
interface SearchMetadata {
  hasMore: boolean
  continuation?: string
  itemsReturned: number
  rateLimitRemaining?: number
  rateLimitReset?: number
}
```

**효과:**
- TypeScript 타입 체크로 런타임 에러 사전 방지
- IDE 자동완성 개선
- 코드 가독성 향상

---

## 성능 비교

### Before (기존)
```
검색어: "한글"
결과: ~40개 (1회 API 호출)
응답시간: ~1800ms
실패 시 재시도: 고정 2초 대기
```

### After (개선)
```
검색어: "한글"
결과: 최대 50개 이상 (Pagination)
응답시간: ~2400ms (더 많은 데이터)
실패 시 재시도: Retry-After 헤더 준수 (최적화)
Rate limit 모니터링: O (추가)
```

---

## 마이그레이션 체크리스트

- [x] API 응답 정규화 계층 구현
- [x] Pagination 지원 추가
- [x] Rate-limiting 헤더 파싱
- [x] 구조화된 에러 로깅
- [x] 검색 API 개선
- [x] 타입 안정성 강화
- [x] 빌드 성공 확인
- [ ] 테스트 (dev 환경)
- [ ] 통합 테스트
- [ ] 메인 브랜치 PR

---

## 주의사항

### Rate Limiting
- RapidAPI 요금제에 따라 요청 제한이 다름
- Pagination 활용 시 API 호출 수 증가 가능
- Rate limit 감시하여 자동 중단 기능 활용

### Pagination 제한
```typescript
// 최대 3페이지 제한 이유:
// - 500명 동시 사용자 × 3요청 = 1500 concurrent requests
// - RequestQueue MAX_CONCURRENT_REQUESTS: 20
// - 안정성과 성능 균형
```

### 에러 처리
```typescript
// APIError 기반 에러 처리
if (error instanceof APIError) {
  // statusCode, retryable 확인 가능
}
```

---

## 다음 개선안

1. **분산 캐싱 (Redis)**
   - 채널 정보 캐시를 15분 메모리 → Redis로 확대
   - 여러 서버 간 캐시 공유

2. **모니터링 통합**
   - 구조화된 로그를 CloudWatch/Datadog에 전송
   - Rate limit 대시보드 구성

3. **Pagination UI**
   - 프론트엔드에서 "다음 페이지" 버튼 추가
   - Continuation 토큰 저장 및 활용

4. **API 응답 캐싱**
   - 자주 검색되는 키워드 캐싱
   - 캐시 만료 정책 수립

---

## 참고

- RapidAPI YT-API 문서: https://rapidapi.com/yt-api-yt-api-default/api/yt-api
- 개선 커밋: test8 브랜치
- 테스트 일정: [TBD]
