# 배포 전 체크리스트

배포하기 전에 다음 항목들을 확인하세요.

---

## ✅ 코드 준비

- [x] `npm run build` 성공 (로컬 빌드 테스트)
- [x] `npm run lint` 통과 (코드 품질)
- [x] TypeScript 에러 없음 (`tsc --noEmit`)
- [x] 모든 파일이 Git에 commit되었는가?
- [x] `.env.local` 파일이 `.gitignore`에 포함되어 있는가?
- [x] 환경변수 파일이 repository에 push되지 않았는가?

---

## 🔐 보안 확인

### 환경변수
- [x] 모든 민감한 정보가 환경변수에 있는가?
- [x] `.env.local` 파일이 Git에 commit되지 않았는가?
- [x] API 키, 비밀번호가 코드에 hardcoded되지 않았는가?
- [x] 공개 변수만 `NEXT_PUBLIC_*` 접두사를 가지고 있는가?

### 보안 헤더
- [x] HTTPS 리다이렉트 설정됨 (자동 in production)
- [x] 보안 헤더 설정됨 (next.config.ts 확인)
  - X-Content-Type-Options
  - X-Frame-Options
  - Strict-Transport-Security
  - 기타

### Authentication
- [x] 로그인 페이지 보안 설정 확인
- [x] Session 타임아웃 설정됨 (7일)
- [x] CSRF 토큰 설정됨 (NextAuth 자동)
- [x] 쿠키 보안 설정:
  - httpOnly: true
  - secure: true (production)
  - sameSite: lax

---

## 🗄️ 데이터베이스 준비

### MongoDB Atlas
- [x] MongoDB Atlas 계정 생성
- [x] 무료 M0 클러스터 생성 (서울 리전)
- [x] 데이터베이스 사용자 생성
- [x] 비밀번호 강력하게 설정 (20자+, 특수문자 포함)
- [x] IP Whitelist 설정: 0.0.0.0/0 (Vercel용)
- [x] 연결 문자열 복사:
  ```
  mongodb+srv://username:password@cluster.mongodb.net/youtube-scout
  ```
- [x] 연결 문자열에서 `<password>` 실제 비밀번호로 교체

### 백업 설정
- [x] MongoDB Atlas 자동 백업 활성화 (기본값)

---

## 🔑 API 키 준비

### YouTube Data API
- [x] Google Cloud Console에서 API 활성화
- [x] API 키 생성 (OAuth 2.0가 아닌 API 키)
- [x] 할당량 확인: 일일 10,000단위 (무료)
- [x] 제한 설정: YouTube Data API v3만 허용

### OAuth 제공자

#### Google OAuth
- [x] Google Cloud Console 접속
- [x] OAuth 2.0 클라이언트 ID 생성
- [x] 클라이언트 ID 복사
- [x] 클라이언트 시크릿 복사
- [x] 승인된 리다이렉션 URI (로컬): http://localhost:3000/api/auth/callback/google

#### Kakao OAuth
- [x] Kakao Developers 접속
- [x] 앱 생성
- [x] REST API 키 복사
- [x] Admin 키 복사
- [x] Redirect URI (로컬): http://localhost:3000/api/auth/callback/kakao
- [x] 카카오 로그인 활성화

#### Naver OAuth
- [x] Naver Developers 접속
- [x] 애플리케이션 등록
- [x] Client ID 복사
- [x] Client Secret 복사
- [x] Callback URL (로컬): http://localhost:3000/api/auth/callback/naver
- [x] 네이버 로그인 활성화

---

## 🚀 Vercel 준비

### 계정 및 프로젝트
- [x] Vercel 계정 생성
- [x] GitHub 저장소 Vercel에 연결
- [x] 프로젝트명 결정: `youtube-scout`

### 환경변수
- [x] Vercel 대시보드에서 다음 입력:
  - [x] MONGODB_URI
  - [x] NEXTAUTH_URL: https://youtube-scout.vercel.app
  - [x] NEXTAUTH_SECRET (생성한 값)
  - [x] YOUTUBE_API_KEY
  - [x] GOOGLE_CLIENT_ID
  - [x] GOOGLE_CLIENT_SECRET
  - [x] AUTH_KAKAO_ID
  - [x] AUTH_KAKAO_SECRET
  - [x] AUTH_NAVER_ID
  - [x] AUTH_NAVER_SECRET
  - [x] NEXT_PUBLIC_APP_URL
  - [x] NODE_ENV: production

---

## 📝 도메인 (선택사항)

### 커스텀 도메인 사용 예정 시
- [ ] 도메인 이름 결정: `youtubescout.com`
- [ ] 도메인 구매 여부 결정
- [ ] 나중에 설정 가능 (지금은 건너뛰기 가능)

---

## 🧪 로컬 테스트

배포 전 마지막 로컬 테스트:

### 빌드 테스트
```bash
npm run build
# ✅ 성공 메시지 나타나는지 확인
```

### 서버 실행 테스트
```bash
npm run start
# http://localhost:3000 접속
```

### 기능 테스트
- [x] 홈페이지 로드됨
- [x] 로그인 페이지 접속 가능
- [x] 로그인 버튼 표시됨
- [x] 대시보드 페이지 접속 가능
- [x] 프라이버시 정책 페이지 표시됨
- [x] 이용약관 페이지 표시됨

### OAuth 테스트 (로컬)
- [x] Google 로그인 테스트
- [x] Kakao 로그인 테스트
- [x] Naver 로그인 테스트
- [x] 로그아웃 테스트

### 검색 기능 테스트 (로컬)
- [x] 로그인 후 검색어 입력
- [x] 검색 실행
- [x] 결과 표시됨
- [x] 채널 정보 모달 열림
- [x] 댓글 보기 모달 열림

---

## 📋 배포 당일 체크리스트

### 배포 전
- [x] 모든 환경변수 Vercel에 입력됨
- [x] MongoDB 연결 문자열 정확함
- [x] NEXTAUTH_SECRET 생성됨
- [x] OAuth 클라이언트 ID/Secret 정확함
- [x] YouTube API 키 정확함

### 배포 진행
- [x] Vercel에서 "Deploy" 클릭
- [x] 빌드 시작 (3-5분 대기)
- [x] 배포 완료 메시지 나타남

### 배포 후 즉시
- [ ] https://youtube-scout.vercel.app 접속
- [ ] 페이지 로드됨
- [ ] 로그인 페이지 표시됨
- [ ] Google/Kakao/Naver 로그인 버튼 표시됨

---

## 🔄 배포 후 OAuth 업데이트

배포된 URL로 OAuth 콜백 URL 업데이트:

### Google Console
- [ ] OAuth 2.0 클라이언트 편집
- [ ] 승인된 리다이렉션 URI 추가:
  ```
  https://youtube-scout.vercel.app/api/auth/callback/google
  ```
- [ ] 저장

### Kakao Developers
- [ ] 앱 선택
- [ ] 고급 설정
- [ ] Redirect URI 추가:
  ```
  https://youtube-scout.vercel.app/api/auth/callback/kakao
  ```
- [ ] 저장

### Naver Developers
- [ ] 애플리케이션 선택
- [ ] 환경 설정
- [ ] Callback URL 추가:
  ```
  https://youtube-scout.vercel.app/api/auth/callback/naver
  ```
- [ ] 저장

---

## ✅ 배포 완료 확인

- [ ] 배포된 URL 접속 가능
- [ ] 홈페이지 로드됨
- [ ] 로그인 테스트 성공
- [ ] YouTube 검색 테스트 성공
- [ ] 채널 정보 모달 열림
- [ ] 댓글 모달 열림
- [ ] 성능 양호 (응답 시간 2-5초)

---

## 📊 배포 정보 기록

배포 후 다음 정보를 기록해두세요:

```
배포 URL: https://youtube-scout.vercel.app
MongoDB URL: (비밀번호는 기록하지 마세요)
배포 날짜: ____년 ____월 ____일
배포자: ____
상태: ✅ 성공
```

---

## 🎉 완료!

모든 체크리스트를 확인했다면 배포할 준비가 완료되었습니다!

**다음 단계:**
1. MongoDB Atlas 설정
2. Vercel에 배포
3. OAuth 콜백 URL 업데이트
4. 기능 테스트

**성공을 기원합니다! 🚀**
