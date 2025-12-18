import { MongoClient, Db } from 'mongodb'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null
let indexesInitialized = false

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const mongoUri = process.env.MONGODB_URI

  if (!mongoUri) {
    throw new Error('Please define MONGODB_URI in .env.local')
  }

  const client = new MongoClient(mongoUri, {
    maxPoolSize: 100,               // 최대 동시 연결 수: 10 → 100 (동접 500명 대응)
    minPoolSize: 10,                // 최소 연결 유지: 10개
    maxIdleTimeMS: 30000,           // 30초간 미사용 시 연결 반환
    waitQueueTimeoutMS: 5000,       // 5초 대기 후 타임아웃
    serverSelectionTimeoutMS: 5000, // 서버 선택 타임아웃
    connectTimeoutMS: 10000,        // 연결 타임아웃: 10초
  })

  try {
    await client.connect()
    const db = client.db('youtube-search')

    cachedClient = client
    cachedDb = db

    // 인덱스 초기화 (최초 1회만)
    if (!indexesInitialized) {
      await initializeIndexes(db)
      indexesInitialized = true
    }

    return { client, db }
  } catch (error) {
    throw error
  }
}

/**
 * MongoDB 인덱스 초기화
 */
async function initializeIndexes(db: Db) {
  try {
    const usageCollection = db.collection('api_usage')
    const usersCollection = db.collection('users')

    // api_usage: email + date 복합 인덱스 (email 기반)
    await usageCollection.createIndex(
      { email: 1, date: 1 },
      { unique: true, sparse: true }
    )

    // 조회 성능을 위한 인덱스
    await usageCollection.createIndex({ email: 1, date: -1 })

    // users: email unique 인덱스 (Primary Key)
    await usersCollection.createIndex({ email: 1 }, { unique: true })

    // users: 조회 성능 인덱스
    await usersCollection.createIndex({ isActive: 1, isBanned: 1 })
    await usersCollection.createIndex({ lastActive: -1 })
    await usersCollection.createIndex({ createdAt: -1 })
  } catch (error) {
    if ((error as any).code === 48 || (error as any).code === 68) {
      // 인덱스 이미 존재 (정상)
      return
    }
  }
}

export async function closeDatabase() {
  if (cachedClient) {
    await cachedClient.close()
    cachedClient = null
    cachedDb = null
  }
}
