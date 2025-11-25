import { Collection, Db, ObjectId } from 'mongodb'
import { connectToDatabase } from './mongodb'

interface User {
  _id?: ObjectId
  email: string  // Primary Key
  name?: string
  image?: string
  provider: string
  providerId?: string
  dailyLimit: number
  remainingLimit: number
  todayUsed: number
  lastResetDate: string
  isActive: boolean  // true: 활성, false: 비활성화
  isBanned: boolean
  bannedAt?: Date
  bannedReason?: string
  isOnline: boolean
  lastActive: Date
  lastLogin: Date
  createdAt: Date
  updatedAt: Date
}

function getUsersCollection(db: Db): Collection<User> {
  return db.collection<User>('users')
}

/**
 * 사용자 정보를 MongoDB에 저장/업데이트
 * Email을 Primary Key로 사용
 * 로그인 시마다 호출되며, lastLogin을 갱신합니다
 */
export async function upsertUser(
  email: string,
  name?: string,
  image?: string,
  provider?: string,
  providerId?: string
): Promise<User> {
  const { db } = await connectToDatabase()

  const collection = getUsersCollection(db)

  // Email을 Primary Key로 사용
  await collection.createIndex({ email: 1 }, { unique: true })

  const now = new Date()

  const result = await collection.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        image,
        provider: provider || 'unknown',
        providerId: providerId || 'unknown',
        lastLogin: now,
        lastActive: now,
        isOnline: true,
        updatedAt: now,
      },
      $setOnInsert: {
        email,
        dailyLimit: 20,
        remainingLimit: 20,
        todayUsed: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
        isActive: true,
        isBanned: false,
        isOnline: true,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: 'after' }
  )

  return result!
}



/**
 * 사용자의 일일 제한 횟수 조회 (email 기반)
 */
export async function getUserDailyLimit(email: string): Promise<number> {
  const { db } = await connectToDatabase()

  try {
    const collection = getUsersCollection(db)
    const user = await collection.findOne({ email })
    return user?.dailyLimit ?? 20 // 기본값: 20
  } catch (error) {
    console.error('❌ 사용자 할당량 조회 에러:', error)
    return 20
  }
}

/**
 * 사용자의 할당량을 원자적으로 차감
 * Atomic 연산으로 동시성 보장
 */
export async function decrementUserQuota(email: string): Promise<boolean> {
  const { db } = await connectToDatabase()
  const collection = getUsersCollection(db)

  const today = new Date().toISOString().split('T')[0]

  const result = await collection.findOneAndUpdate(
    {
      email,
      remainingLimit: { $gt: 0 }, // 0보다 클 때만
      isActive: true,
      isBanned: false,
    },
    {
      $inc: { remainingLimit: -1, todayUsed: 1 },
      $set: { lastResetDate: today, updatedAt: new Date() },
    },
    { returnDocument: 'after' }
  )

  return result !== null
}


