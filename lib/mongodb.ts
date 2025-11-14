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

  const client = new MongoClient(mongoUri)

  try {
    await client.connect()
    const db = client.db('youtube-search')

    cachedClient = client
    cachedDb = db

    console.log('✓ Connected to MongoDB')

    // 인덱스 초기화 (최초 1회만)
    if (!indexesInitialized) {
      await initializeIndexes(db)
      indexesInitialized = true
    }

    return { client, db }
  } catch (error) {
    console.error('✗ Failed to connect to MongoDB:', error)
    throw error
  }
}

/**
 * MongoDB 인덱스 초기화
 */
async function initializeIndexes(db: Db) {
  try {
    const usageCollection = db.collection('api_usage')

    // userId + date 복합 인덱스
    await usageCollection.createIndex(
      { userId: 1, date: 1 },
      { unique: true, sparse: true }
    )

    // 조회 성능을 위한 인덱스
    await usageCollection.createIndex({ userId: 1, date: -1 })

    console.log('✓ API 사용량 인덱스 생성 완료')
  } catch (error) {
    if ((error as any).code === 48) {
      // 인덱스 이미 존재 (정상)
      return
    }
    console.warn('⚠️ API 사용량 인덱스 생성 경고:', (error as any).message)
  }
}

export async function closeDatabase() {
  if (cachedClient) {
    await cachedClient.close()
    cachedClient = null
    cachedDb = null
    console.log('✓ Disconnected from MongoDB')
  }
}
