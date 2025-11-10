import { MongoClient, Db } from 'mongodb'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

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

    return { client, db }
  } catch (error) {
    console.error('✗ Failed to connect to MongoDB:', error)
    throw error
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
