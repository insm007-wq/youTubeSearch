import { MongoClient } from 'mongodb'

// 환경변수 확인 (빌드 타임이 아닌 모듈 로드 시점)
const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error('Please define MONGODB_URI in environment variables')
}

// Promise 생성 (즉시 연결 시작, MongoDBAdapter가 기대하는 형태)
const clientPromise = (async () => {
  const client = new MongoClient(uri, {
    retryWrites: true,
    w: 'majority',
  })

  await client.connect()
  console.log('✓ Connected to MongoDB')

  return client
})()

export default clientPromise
