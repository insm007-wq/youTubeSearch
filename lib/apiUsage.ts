import { connectToDatabase } from './mongodb'
import { ObjectId } from 'mongodb'

// 환경변수에서 설정, 기본값 20
const DAILY_LIMIT = parseInt(process.env.API_DAILY_LIMIT || '20', 10)

interface ApiUsageRecord {
  _id?: ObjectId
  userId: string
  email: string
  date: string // YYYY-MM-DD
  count: number
  lastReset: Date
  createdAt?: Date
  updatedAt?: Date
}

interface ApiUsageResponse {
  allowed: boolean
  used: number
  remaining: number
  limit: number
  resetTime: string
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환 (KST 기준)
 */
function getTodayDate(): string {
  const today = new Date()
  // KST (UTC+9) 기준으로 날짜 계산
  const kstDate = new Date(today.getTime() + 9 * 60 * 60 * 1000)
  return kstDate.toISOString().split('T')[0]
}

/**
 * MongoDB 인덱스 생성 (최초 1회만 필요)
 * 서버 시작 시 자동으로 호출됨
 */
export async function ensureApiUsageIndexes() {
  try {
    const { db } = await connectToDatabase()
    const usageCollection = db.collection<ApiUsageRecord>('api_usage')

    // userId + date 복합 인덱스 생성 (없으면 무시)
    await usageCollection.createIndex(
      { userId: 1, date: 1 },
      { unique: true, sparse: true }
    )

    // 검색 성능을 위한 인덱스
    await usageCollection.createIndex({ userId: 1, date: -1 })

    console.log('✓ API 사용량 인덱스 생성 완료')
  } catch (error) {
    if ((error as any).code === 48) {
      // 인덱스 이미 존재 (정상)
      return
    }
    console.error('⚠️ API 사용량 인덱스 생성 실패:', error)
  }
}

/**
 * 사용자의 오늘 API 사용량을 확인
 * @param userId - 사용자 ID
 * @param email - 사용자 이메일
 * @returns { allowed, used, remaining, limit, resetTime }
 */
export async function checkApiUsage(
  userId: string,
  email: string
): Promise<ApiUsageResponse> {
  try {
    if (!userId || !email) {
      throw new Error('userId와 email은 필수입니다')
    }

    const { db } = await connectToDatabase()
    const today = getTodayDate()

    const usageCollection = db.collection<ApiUsageRecord>('api_usage')

    // 오늘의 기록만 조회 (생성하지 않음)
    const usageRecord = await usageCollection.findOne({
      userId,
      date: today
    })

    const used = usageRecord?.count ?? 0
    const remaining = Math.max(0, DAILY_LIMIT - used)
    const allowed = used < DAILY_LIMIT

    // 내일 자정의 시간 계산
    const tomorrow = new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
    const resetTime = `${tomorrow.toISOString().split('T')[0]}T00:00:00Z`

    return {
      allowed,
      used,
      remaining,
      limit: DAILY_LIMIT,
      resetTime
    }
  } catch (error) {
    console.error('❌ API 사용량 확인 에러:', {
      userId,
      error: error instanceof Error ? error.message : error
    })
    throw error
  }
}

/**
 * 사용자의 API 사용량을 1 증가시킴 (최적화됨: 1번의 DB 쿼리)
 * @param userId - 사용자 ID
 * @param email - 사용자 이메일
 * @returns 업데이트된 사용량
 */
export async function incrementApiUsage(userId: string, email: string): Promise<number> {
  try {
    if (!userId || !email) {
      throw new Error('userId와 email은 필수입니다')
    }

    const { db } = await connectToDatabase()
    const today = getTodayDate()

    const usageCollection = db.collection<ApiUsageRecord>('api_usage')

    // findOneAndUpdate: 한 번의 쿼리로 처리 (가장 안전한 패턴)
    // 1. 기존 문서면 count +1
    // 2. 없는 문서면 count는 자동으로 1 생성
    // 3. $setOnInsert에서 count를 제외하여 ConflictingUpdateOperators 에러 방지
    const result = await usageCollection.findOneAndUpdate(
      {
        userId,
        date: today
      },
      {
        $inc: { count: 1 },
        $set: { updatedAt: new Date() },
        $setOnInsert: {
          userId,
          email,
          date: today,
          lastReset: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )

    const updatedCount = result?.count ?? 1

    return updatedCount
  } catch (error) {
    console.error('❌ API 사용량 업데이트 에러:', {
      userId,
      error: error instanceof Error ? error.message : error
    })
    throw error
  }
}

/**
 * 사용자의 모든 API 사용 기록 조회
 * @param userId - 사용자 ID
 * @param limit - 조회할 기록 수 (기본 30)
 */
export async function getUserApiUsageHistory(
  userId: string,
  limit: number = 30
): Promise<ApiUsageRecord[]> {
  try {
    if (!userId) {
      throw new Error('userId는 필수입니다')
    }

    if (limit < 1 || limit > 100) {
      limit = 30
    }

    const { db } = await connectToDatabase()
    const usageCollection = db.collection<ApiUsageRecord>('api_usage')

    const records = await usageCollection
      .find({ userId })
      .sort({ date: -1 })
      .limit(limit)
      .toArray()

    return records
  } catch (error) {
    console.error('❌ API 사용 기록 조회 에러:', {
      userId,
      error: error instanceof Error ? error.message : error
    })
    throw error
  }
}

/**
 * 사용자의 오늘 사용량만 조회 (간단 버전)
 * @param userId - 사용자 ID
 */
export async function getTodayUsage(userId: string) {
  try {
    if (!userId) {
      throw new Error('userId는 필수입니다')
    }

    const { db } = await connectToDatabase()
    const today = getTodayDate()

    const usageCollection = db.collection<ApiUsageRecord>('api_usage')
    const record = await usageCollection.findOne({
      userId,
      date: today
    })

    const used = record?.count ?? 0

    return {
      used,
      remaining: Math.max(0, DAILY_LIMIT - used),
      limit: DAILY_LIMIT
    }
  } catch (error) {
    console.error('❌ 오늘 사용량 조회 에러:', {
      userId,
      error: error instanceof Error ? error.message : error
    })
    throw error
  }
}

/**
 * 특정 사용자의 특정 날짜 사용량 조회
 * @param userId - 사용자 ID
 * @param date - 조회할 날짜 (YYYY-MM-DD)
 */
export async function getUsageByDate(userId: string, date: string) {
  try {
    if (!userId || !date) {
      throw new Error('userId와 date는 필수입니다')
    }

    // 날짜 형식 검증
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('날짜는 YYYY-MM-DD 형식이어야 합니다')
    }

    const { db } = await connectToDatabase()
    const usageCollection = db.collection<ApiUsageRecord>('api_usage')

    const record = await usageCollection.findOne({
      userId,
      date
    })

    return {
      date,
      used: record?.count ?? 0,
      email: record?.email ?? 'unknown'
    }
  } catch (error) {
    console.error('❌ 날짜별 사용량 조회 에러:', {
      userId,
      date,
      error: error instanceof Error ? error.message : error
    })
    throw error
  }
}

/**
 * 모든 사용자의 통계 조회 (관리자용)
 */
export async function getGlobalStats() {
  try {
    const { db } = await connectToDatabase()
    const usageCollection = db.collection<ApiUsageRecord>('api_usage')
    const today = getTodayDate()

    // 오늘의 총 검색 수
    const todayStats = await usageCollection
      .aggregate([
        { $match: { date: today } },
        {
          $group: {
            _id: null,
            totalSearches: { $sum: '$count' },
            totalUsers: { $sum: 1 },
            avgPerUser: { $avg: '$count' }
          }
        }
      ])
      .toArray()

    return {
      date: today,
      totalSearches: todayStats[0]?.totalSearches ?? 0,
      totalUsers: todayStats[0]?.totalUsers ?? 0,
      avgPerUser: Math.round((todayStats[0]?.avgPerUser ?? 0) * 100) / 100,
      limit: DAILY_LIMIT
    }
  } catch (error) {
    console.error('❌ 전역 통계 조회 에러:', error)
    throw error
  }
}
