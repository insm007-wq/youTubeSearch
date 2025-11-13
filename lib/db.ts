import { MongoClient } from 'mongodb'

let cachedClient: MongoClient | null = null
let cachedPromise: Promise<MongoClient> | null = null

// MongoDBAdapter가 기대하는 Promise 형태 (lazy loading)
const clientPromise = new Promise<MongoClient>((resolve, reject) => {
  // 실제 연결은 처음 사용할 때만 시작
  if (cachedClient) {
    resolve(cachedClient)
    return
  }

  if (cachedPromise) {
    cachedPromise.then(resolve).catch(reject)
    return
  }

  // 첫 호출 시점에 환경변수 확인
  const uri = process.env.MONGODB_URI

  if (!uri) {
    reject(new Error('Please define MONGODB_URI in environment variables'))
    return
  }

  cachedPromise = new Promise<MongoClient>((resolveConn, rejectConn) => {
    const client = new MongoClient(uri, {
      retryWrites: true,
      w: 'majority',
    })

    client
      .connect()
      .then(() => {
        console.log('✓ Connected to MongoDB')
        cachedClient = client
        resolveConn(client)
        resolve(client)
      })
      .catch((error) => {
        console.error('✗ MongoDB connection error:', error)
        rejectConn(error)
        reject(error)
      })
  })
})

export default clientPromise
