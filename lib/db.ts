import { MongoClient } from 'mongodb'

let cachedClient: MongoClient | null = null
let cachedPromise: Promise<MongoClient> | null = null

// MongoDBAdapter가 기대하는 Promise 형태
const clientPromise = (async () => {
  if (cachedClient) {
    return cachedClient
  }

  if (cachedPromise) {
    return cachedPromise
  }

  const uri = process.env.MONGODB_URI || ''

  if (!uri) {
    throw new Error('Please define MONGODB_URI in environment variables')
  }

  cachedPromise = new Promise<MongoClient>((resolve, reject) => {
    const client = new MongoClient(uri, {
      retryWrites: true,
      w: 'majority',
    })

    client
      .connect()
      .then(() => {
        console.log('✓ Connected to MongoDB')
        cachedClient = client
        resolve(client)
      })
      .catch((error) => {
        console.error('✗ MongoDB connection error:', error)
        reject(error)
      })
  })

  return cachedPromise
})()

export default clientPromise
