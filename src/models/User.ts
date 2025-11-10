import { ObjectId } from 'mongodb'

export interface User {
  _id?: ObjectId
  email: string
  name: string
  image?: string
  provider: 'google' | 'kakao' | 'naver'
  providerId: string
  apiKey?: string // 개인 YouTube API 키 (선택사항)
  createdAt: Date
  updatedAt: Date
  lastLogin: Date
}

export interface CreateUserInput {
  email: string
  name: string
  image?: string
  provider: 'google' | 'kakao' | 'naver'
  providerId: string
}
