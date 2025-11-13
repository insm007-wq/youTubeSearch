import { MongoClient } from 'mongodb'

// Promise 생성 (지연 로딩: 실제 연결 시점에 환경변수 확인)
const clientPromise = (async () => {
  // 환경변수 확인은 이 시점에서 (모듈 로드 후)
  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error('Please define MONGODB_URI in environment variables')
  }

  const client = new MongoClient(uri, {
    retryWrites: true,
    w: 'majority',
  })

  await client.connect()
  console.log('✓ Connected to MongoDB')

  return client
})()

export default clientPromise
