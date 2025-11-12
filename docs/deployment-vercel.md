# Vercel 배포 가이드

YouTube Scout를 Vercel에 배포하는 완벽한 가이드입니다.

**예상 소요 시간: 30분**

---

## 📋 사전 준비 사항

- [x] GitHub 계정
- [ ] Vercel 계정 (무료)
- [ ] MongoDB Atlas 계정 (무료)
- [ ] YouTube Data API 키
- [ ] OAuth 제공자 (Google, Kakao, Naver) 설정 완료

---

## Step 1: MongoDB Atlas 설정 (10분)

### 1.1 MongoDB Atlas 회원가입

```
1. https://www.mongodb.com/cloud/atlas 방문
2. "Try Free" 클릭
3. 이메일로 회원가입
4. 이메일 인증
```

### 1.2 클러스터 생성

```
1. "Create a Deployment" 클릭
2. 배포 방식: Shared (무료) 선택
3. 클라우드 제공자: AWS 선택
4. 리전: Seoul (ap-northeast-2) 선택 ⭐ (한국 사용자용)
5. 클러스터명: youtube-scout
6. Create Cluster 클릭
7. 대기... (자동으로 생성, 약 5-10분)
```

### 1.3 Database 사용자 생성

```
1. "Security" → "Database Access" 선택
2. "Add New Database User" 클릭
3. 인증 방식: Password 선택
4. Username: mongodb_user (또는 원하는 이름)
5. Password: 강력한 비밀번호 생성
   - 20자 이상
   - 대소문자, 숫자, 특수문자 포함
   - 예: MySecurePass123!@#
6. Database User Privileges: Atlas admin 선택
7. Add User 클릭
```

**⚠️ 중요: 비밀번호를 어딘가에 기록해두세요!**

### 1.4 IP Whitelist 설정

```
1. "Security" → "Network Access" 선택
2. "Add IP Address" 클릭
3. 설정: "Allow access from anywhere" (0.0.0.0/0) 선택
   - Vercel은 동적 IP를 사용하므로 필수
4. Confirm 클릭
```

### 1.5 연결 문자열(Connection String) 복사

```
1. "Databases" 탭으로 이동
2. youtube-scout 클러스터 → "Connect" 클릭
3. "Drivers" 선택
4. Connection String 복사:
   mongodb+srv://mongodb_user:<password>@cluster.mongodb.net/youtube-scout
5. <password> 부분을 실제 비밀번호로 교체

예시:
mongodb+srv://mongodb_user:MySecurePass123!@#@cluster.mongodb.net/youtube-scout
```

**✅ 이 문자열을 Vercel 환경변수에 입력합니다**

---

## Step 2: Vercel 가입 및 배포 (15분)

### 2.1 Vercel 회원가입

```
1. https://vercel.com 방문
2. "Sign Up" 클릭
3. GitHub 계정으로 로그인
4. 권한 승인 ("Authorize Vercel")
```

### 2.2 GitHub 저장소 연결

```
1. Vercel 대시보드 → "New Project" 클릭
2. "Import Git Repository" 선택
3. 저장소 검색: youTube-Search (또는 당신의 저장소명)
4. 저장소 선택 → "Import" 클릭
```

### 2.3 프로젝트 설정

```
1. Project Name: youtube-scout (또는 원하는 이름)
2. Framework Preset: Next.js (자동 선택됨)
3. Root Directory: ./ (이미 설정됨)
4. Build Command: npm run build (기본값)
5. Output Directory: .next (기본값)
```

### 2.4 환경변수 설정

**"Environment Variables" 섹션에서 다음을 추가하세요:**

```
MONGODB_URI=mongodb+srv://mongodb_user:PASSWORD@cluster.mongodb.net/youtube-scout
↑ MongoDB Atlas에서 복사한 연결 문자열

NEXTAUTH_URL=https://youtube-scout.vercel.app
↑ Vercel에서 제공할 URL (배포 후 변경 가능)

NEXTAUTH_SECRET=생성_필요
↑ 다음 명령어로 생성:
   openssl rand -base64 32

YOUTUBE_API_KEY=your-youtube-api-key
↑ Google Cloud Console에서 생성한 API 키

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

AUTH_KAKAO_ID=your-kakao-app-id
AUTH_KAKAO_SECRET=your-kakao-secret

AUTH_NAVER_ID=your-naver-client-id
AUTH_NAVER_SECRET=your-naver-secret

NEXT_PUBLIC_APP_URL=https://youtube-scout.vercel.app

NODE_ENV=production
```

**각 변수는 따로따로 추가하세요** (한 줄에 모두 입력하면 안 됨)

### 2.5 배포 실행

```
1. 모든 환경변수 입력 완료 확인
2. "Deploy" 버튼 클릭
3. 대기... (빌드 시작)
   - 빌드 시간: 3-5분
   - 배포 시간: 1-2분
4. "Congratulations!" 메시지 표시되면 완료! 🎉
```

**배포된 URL 확인:**
```
https://youtube-scout.vercel.app
또는
Vercel 대시보드에서 확인 가능
```

---

## Step 3: OAuth 콜백 URL 업데이트 (5-10분)

### ⚠️ 중요: OAuth 콜백 URL 변경

배포 후 OAuth 제공자에서 콜백 URL을 업데이트해야 합니다.

### 3.1 Google OAuth 업데이트

```
1. Google Cloud Console 방문: https://console.cloud.google.com
2. OAuth 2.0 클라이언트 ID 편집
3. "승인된 리다이렉션 URI" 섹션에서:

   기존: http://localhost:3000/api/auth/callback/google
   추가: https://youtube-scout.vercel.app/api/auth/callback/google

4. 저장 클릭
```

### 3.2 Kakao OAuth 업데이트

```
1. Kakao Developers: https://developers.kakao.com
2. 앱 선택 → 설정
3. "고급" → "리다이렉트 URI" 추가

   기존: http://localhost:3000/api/auth/callback/kakao
   추가: https://youtube-scout.vercel.app/api/auth/callback/kakao

4. 저장
```

### 3.3 Naver OAuth 업데이트

```
1. Naver Developers: https://developers.naver.com
2. 앱 관리
3. "환경 설정" → "Callback URL" 추가

   기존: http://localhost:3000/api/auth/callback/naver
   추가: https://youtube-scout.vercel.app/api/auth/callback/naver

4. 저장
```

---

## Step 4: 배포 확인 및 테스트 (5분)

### 4.1 앱 접속

```
1. https://youtube-scout.vercel.app 방문
2. 페이지가 로드되는지 확인
3. 네트워크 속도 양호한지 확인
```

### 4.2 로그인 테스트

```
1. "로그인" 또는 OAuth 버튼 클릭
2. Google/Kakao/Naver 중 하나로 로그인
3. 성공적으로 로그인되는지 확인
4. 로그인 후 대시보드 접속 확인
```

### 4.3 검색 기능 테스트

```
1. 검색어 입력 (예: "javascript")
2. "검색" 버튼 클릭
3. YouTube 검색 결과 표시되는지 확인
4. 채널 정보 모달 열기
5. 댓글 보기 모달 열기
```

### 4.4 성능 확인

```
1. F12 → Network 탭 열기
2. API 응답 시간 확인
3. 예상:
   - youtube_search: 2-5초
   - youtube_channel: 1-2초
   - youtube_comments: 1-2초
```

---

## 📊 배포 완료!

축하합니다! 🎉 당신의 앱이 인터넷에 공개되었습니다!

```
배포된 URL: https://youtube-scout.vercel.app
GitHub: 자동 동기화 (git push → 자동 배포)
```

---

## 🔄 이후 업데이트 방법

```bash
# 로컬에서 코드 수정
git add .
git commit -m "수정 사항"
git push origin main

# Vercel이 자동으로:
# 1. 코드 감지
# 2. 빌드 시작 (3-5분)
# 3. 배포 완료 (자동)
# 4. 새 버전 반영 (다운타임 0초)

# Vercel 대시보드에서 배포 진행 상황 확인 가능
```

---

## 🚀 커스텀 도메인 연결 (선택사항)

나중에 `youtubescout.com` 같은 커스텀 도메인을 추가하려면:

```
1. Vercel 프로젝트 → Settings → Domains
2. "Add Domain" 클릭
3. 도메인 입력
4. DNS 설정 (Vercel이 안내)
5. SSL 자동 발급 (1-2분 후)
```

---

## ❌ 문제 해결

### Q1: "MongoDB 연결 오류" 표시됨

```
원인:
- 연결 문자열이 잘못됨
- IP Whitelist 설정 안 됨

해결:
1. 연결 문자열 다시 확인
2. <password> 부분이 정확한지 확인
3. MongoDB Atlas에서 IP Whitelist 확인 (0.0.0.0/0)
4. Vercel 환경변수 다시 확인
```

### Q2: "OAuth 로그인 안 됨"

```
원인:
- 콜백 URL이 등록 안 됨

해결:
1. Google/Kakao/Naver 콘솔 확인
2. 콜백 URL이 정확히 등록되었는지 확인:
   https://youtube-scout.vercel.app/api/auth/callback/google (등)
3. 앗! 도메인 변경 시 모두 수정 필요
```

### Q3: "YouTube 검색 안 됨"

```
원인:
- YouTube API 키 미설정
- API 할당량 초과

해결:
1. 환경변수 YOUTUBE_API_KEY 확인
2. Google Cloud Console에서 API 활성화 확인
3. 할당량 사용량 확인 (일일 10,000단위 무료)
```

### Q4: "Vercel 배포 실패"

```
해결 단계:
1. Vercel 대시보드에서 빌드 로그 확인
2. 에러 메시지 읽기
3. 일반적인 에러:
   - 환경변수 누락 → 모두 입력되었는지 확인
   - 빌드 에러 → npm run build 로컬에서 테스트
   - 의존성 문제 → npm install 다시 실행
```

---

## 📞 지원

```
- Vercel 문서: https://vercel.com/docs
- Next.js 문서: https://nextjs.org/docs
- MongoDB 문서: https://docs.mongodb.com
- NextAuth.js: https://authjs.dev
```

---

**배포 완료! 모두 수고하셨습니다! 🎉**
