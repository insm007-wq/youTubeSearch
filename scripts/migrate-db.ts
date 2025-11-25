/**
 * DB 마이그레이션 스크립트
 * - users 테이블: email Primary Key로 통일
 * - api_usage: userId -> email로 변경
 * - 필드명 통일: remaining -> remainingLimit, isDeactivated -> isBanned
 */

import { config } from 'dotenv'
import { MongoClient } from 'mongodb'

// .env.local 로드
config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || ''
const DB_NAME = 'youtube-search'

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI 환경변수가 필요합니다')
  process.exit(1)
}

async function migrate() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    const db = client.db(DB_NAME)

    console.log('🔄 마이그레이션 시작...\n')

    // 1. users 컬렉션 마이그레이션
    console.log('📋 [1/5] users 컬렉션 필드명 통일...')
    const usersCollection = db.collection('users')

    // remaining -> remainingLimit
    await usersCollection.updateMany(
      { remaining: { $exists: true } },
      [{ $set: { remainingLimit: '$remaining' } }]
    )

    // isDeactivated -> isBanned (의미 반대이므로 NOT 연산)
    await usersCollection.updateMany(
      { isDeactivated: { $exists: true } },
      [{ $set: { isBanned: { $cond: ['$isDeactivated', true, false] } } }]
    )

    // 새로운 필드 추가 (없으면)
    await usersCollection.updateMany(
      { isBanned: { $exists: false } },
      { $set: { isBanned: false, isOnline: false } }
    )

    // Email Primary Key 인덱스 생성
    await usersCollection.createIndex({ email: 1 }, { unique: true })
    console.log('✅ users 컬렉션 업데이트 완료\n')

    // 2. api_usage 컬렉션 마이그레이션
    console.log('📋 [2/5] api_usage 컬렉션 마이그레이션...')
    const apiUsageCollection = db.collection('api_usage')

    // users에서 userId와 email 매핑 조회
    const users = await usersCollection.find({}).toArray()
    const userIdToEmail: Record<string, string> = {}

    for (const user of users) {
      if (user.userId) {
        userIdToEmail[user.userId] = user.email
      }
    }

    // api_usage 업데이트: userId가 있는 레코드들을 email로 변환
    const apiUsageRecords = await apiUsageCollection.find({}).toArray()
    for (const record of apiUsageRecords) {
      if (record.userId && userIdToEmail[record.userId]) {
        await apiUsageCollection.updateOne(
          { _id: record._id },
          { $set: { email: userIdToEmail[record.userId] } }
        )
      }
    }

    // email + date 복합 인덱스 생성
    await apiUsageCollection.createIndex(
      { email: 1, date: 1 },
      { unique: true, sparse: true }
    )

    // TTL 인덱스 생성 (90일 후 자동 삭제)
    await apiUsageCollection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 7776000 } // 90일
    )

    console.log('✅ api_usage 컬렉션 업데이트 완료\n')

    // 3. 통계 출력
    console.log('📊 [3/5] 마이그레이션 통계...')
    const totalUsers = await usersCollection.countDocuments()
    const totalApiUsage = await apiUsageCollection.countDocuments()

    console.log(`- 총 사용자 수: ${totalUsers}명`)
    console.log(`- 총 API 사용 기록: ${totalApiUsage}건\n`)

    // 4. 데이터 검증
    console.log('✅ [4/5] 데이터 검증...')

    // remaining이 없고 remainingLimit이 있는 문서 확인
    const validUsers = await usersCollection.countDocuments({
      remainingLimit: { $exists: true }
    })
    console.log(`- remainingLimit 필드 있는 사용자: ${validUsers}명`)

    // email로 조회 가능 확인
    const emailIndexInfo = await usersCollection.indexes()
    console.log(`- 인덱스 생성 확인: ${emailIndexInfo.length}개`)

    // 5. 완료
    console.log('\n✅ [5/5] 마이그레이션 완료!')
    console.log('\n📌 주의사항:')
    console.log('1. 사용자 웹 재시작 후 인덱스 생성 스크립트 실행')
    console.log('2. 기존 사용자는 재로그인 필요 (new Primary Key)')
    console.log('3. 관리자 웹도 동일하게 업데이트 필요\n')

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

migrate()
