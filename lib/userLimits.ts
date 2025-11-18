import { Collection, Db, ObjectId } from 'mongodb'
import { connectToDatabase } from './mongodb'

interface User {
  _id?: ObjectId
  userId: string
  email: string
  name?: string
  image?: string
  provider: string
  providerId: string
  emailVerified?: boolean
  locale?: string
  isActive: boolean
  dailyLimit: number
  todayUsed: number
  remaining: number
  lastResetDate: string
  isDeactivated: boolean
  lastLogin: Date
  createdAt: Date
  updatedAt: Date
}

function getUsersCollection(db: Db): Collection<User> {
  return db.collection<User>('users')
}

/**
 * 사용자 정보를 MongoDB에 저장/업데이트 (user_limits 통합)
 * 로그인 시마다 호출되며, lastLogin을 갱신합니다
 */
export async function upsertUser(
  userId: string,
  email: string,
  name?: string,
  image?: string,
  provider?: string,
  providerId?: string,
  emailVerified?: boolean,
  locale?: string
): Promise<User> {
  const { db } = await connectToDatabase()

  const collection = getUsersCollection(db)

  // 인덱스 생성 (중복 방지)
  await collection.createIndex({ userId: 1 }, { unique: true })
  await collection.createIndex({ email: 1 })

  const now = new Date()

  const result = await collection.findOneAndUpdate(
    { userId },
    {
      $set: {
        email,
        name,
        image,
        emailVerified,
        locale,
        lastLogin: now, // 로그인할 때마다 갱신
        updatedAt: now,
      },
      $setOnInsert: {
        userId,
        provider: provider || 'unknown',
        providerId: providerId || 'unknown',
        isActive: true, // 기본값: 활성
        dailyLimit: 15, // 기본값: 15회
        todayUsed: 0, // 기본값: 0 (오늘 사용한 횟수)
        remaining: 15, // 기본값: 15 (남은 횟수)
        lastResetDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        isDeactivated: false, // 기본값: 활성화
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: 'after' }
  )

  return result!
}



/**
 * 사용자의 일일 제한 횟수 조회 (user_limits 컬렉션에서)
 * 관리앱에서 관리하는 user_limits에서 할당량을 가져옴
 */
export async function getUserDailyLimit(userId: string): Promise<number> {
  const { db } = await connectToDatabase()

  try {
    // user_limits 컬렉션에서 조회 (관리앱이 관리)
    const userLimitsCollection = db.collection('user_limits')
    const userLimit = await userLimitsCollection.findOne({ userId })

    if (userLimit) {
      return userLimit.dailyLimit ?? 15
    }
  } catch (error) {
    console.error('❌ user_limits 조회 에러:', error)
  }

  // user_limits에 없으면 users 컬렉션 확인
  const usersCollection = getUsersCollection(db)
  const user = await usersCollection.findOne({ userId })
  return user?.dailyLimit ?? 15 // 기본값: 15
}

/**
 * 사용자의 API 사용량을 1 증가시킴 + remaining 갱신
 */
export async function incrementUserUsage(userId: string): Promise<User | null> {
  const { db } = await connectToDatabase()
  const collection = getUsersCollection(db)

  const user = await collection.findOne({ userId })
  if (!user) return null

  const today = new Date().toISOString().split('T')[0]

  // 날짜가 바뀌었으면 리셋
  let newTodayUsed = user.todayUsed + 1
  let newRemaining = user.dailyLimit - newTodayUsed
  let lastResetDate = user.lastResetDate

  if (user.lastResetDate !== today) {
    newTodayUsed = 1
    newRemaining = user.dailyLimit - 1
    lastResetDate = today
  }

  const result = await collection.findOneAndUpdate(
    { userId },
    {
      $set: {
        todayUsed: newTodayUsed,
        remaining: newRemaining,
        lastResetDate: lastResetDate,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  )

  return result || null
}


