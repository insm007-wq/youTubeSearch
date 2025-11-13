import { MongoClient } from 'mongodb'

let cachedClient: MongoClient | null = null
let cachedPromise: Promise<MongoClient> | null = null

async function connectToDatabase(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient
  }

  if (cachedPromise) {
    cachedClient = await cachedPromise
    return cachedClient
  }

  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error('Please define MONGODB_URI in environment variables')
  }

  cachedPromise = (async () => {
    const client = new MongoClient(uri, {
      retryWrites: true,
      w: 'majority',
    })

    await client.connect()
    console.log('✓ Connected to MongoDB')

    cachedClient = client
    return client
  })()

  cachedClient = await cachedPromise
  return cachedClient
}

// MongoDBAdapter가 기대하는 Promise 형태로 export
const clientPromise = connectToDatabase()

export default clientPromise
