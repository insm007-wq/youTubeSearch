import { ObjectId } from 'mongodb'

export interface User {
  _id?: ObjectId

  // 기본 정보
  userId: string // "provider:providerId" 형태 (고유 식별자)
  email: string
  name: string
  image?: string
  provider: 'google' | 'kakao' | 'naver'
  providerId: string

  // 인증 및 설정
  emailVerified?: boolean // OAuth 제공자의 이메일 인증 여부
  locale?: string // 언어 설정 (ko, en 등)

  // 계정 상태
  isActive: boolean // 계정 활성 상태 (기본값: true)
  isDeactivated: boolean // 비활성화 여부 (기본값: false)

  // API 제한
  dailyLimit: number // 일일 검색 제한 횟수 (기본값: 20)
  todayUsed: number // 오늘 사용한 횟수 (기본값: 0)
  remaining: number // 남은 횟수 (계산값: dailyLimit - todayUsed)
  lastResetDate: string // 마지막 리셋 날짜 (YYYY-MM-DD)
  apiKey?: string // 개인 YouTube API 키 (선택사항)

  // 날짜 정보
  createdAt: Date // 가입일
  updatedAt: Date // 마지막 수정일
  lastLogin: Date // 마지막 로그인
}

export interface CreateUserInput {
  email: string
  name: string
  image?: string
  provider: 'google' | 'kakao' | 'naver'
  providerId: string
}
