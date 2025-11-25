/**
 * DB 마이그레이션 스크립트 (JavaScript)
 * node scripts/migrate-db.js
 */

const fs = require('fs')
const path = require('path')
const { MongoClient } = require('mongodb')

// .env.local 파일 읽기
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const env = {}

  envContent.split('\n').forEach(line => {
    line = line.trim()
    if (line && !line.startsWith('#')) {
      const equalIdx = line.indexOf('=')
      if (equalIdx > -1) {
        const key = line.substring(0, equalIdx).trim()
        const value = line.substring(equalIdx + 1).trim()
        env[key] = value
      }
    }
  })

  return env
}

const env = loadEnv()
const MONGODB_URI = env.MONGODB_URI
const DB_NAME = 'youtube-search'

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI을 .env.local에서 읽을 수 없습니다')
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
      { $rename: { remaining: 'remainingLimit' } }
    )

    // isDeactivated -> isBanned (반전)
    const usersWithIsDeactivated = await usersCollection
      .find({ isDeactivated: { $exists: true } })
      .toArray()

    for (const user of usersWithIsDeactivated) {
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: { isBanned: user.isDeactivated === true },
          $unset: { isDeactivated: '' }
        }
      )
    }

    // 새로운 필드 추가
    await usersCollection.updateMany(
      { isBanned: { $exists: false } },
      { $set: { isBanned: false, isOnline: false } }
    )

    // Email Primary Key 인덱스 생성 (기존 제거 후)
    try {
      const indexes = await usersCollection.indexes()
      for (const idx of indexes) {
        if (idx.name === 'email_1' && !idx.unique) {
          await usersCollection.dropIndex('email_1')
        }
      }
    } catch (err) {
      // 무시
    }

    try {
      await usersCollection.createIndex({ email: 1 }, { unique: true })
    } catch (err) {
      if (err.code !== 68) throw err
    }
    console.log('✅ users 컬렉션 업데이트 완료\n')

    // 2. api_usage 컬렉션 마이그레이션
    console.log('📋 [2/5] api_usage 컬렉션 마이그레이션...')
    const apiUsageCollection = db.collection('api_usage')

    // users에서 userId와 email 매핑
    const users = await usersCollection.find({}).toArray()
    const userIdToEmail = {}

    for (const user of users) {
      if (user.userId) {
        userIdToEmail[user.userId] = user.email
      }
    }

    // 기존 인덱스 제거
    try {
      const existingIndexes = await apiUsageCollection.indexes()
      for (const idx of existingIndexes) {
        if (idx.name && idx.name !== '_id_') {
          await apiUsageCollection.dropIndex(idx.name)
        }
      }
    } catch (err) {
      // 무시
    }

    // api_usage 모든 문서 email 필드 설정
    const apiRecords = await apiUsageCollection.find({}).toArray()
    for (const record of apiRecords) {
      const email = record.userId ? userIdToEmail[record.userId] : record.email
      if (email && email !== record.email) {
        await apiUsageCollection.updateOne(
          { _id: record._id },
          { $set: { email } }
        )
      }
    }

    // 중복 문서 찾아서 삭제 (email + date 기준)
    const duplicatePipeline = [
      {
        $group: {
          _id: { email: '$email', date: '$date' },
          docs: { $push: '$_id' },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]

    const duplicateGroups = await apiUsageCollection.aggregate(duplicatePipeline).toArray()
    let deletedCount = 0

    for (const group of duplicateGroups) {
      // 첫 번째를 제외한 나머지 삭제
      const toDelete = group.docs.slice(1)
      if (toDelete.length > 0) {
        const result = await apiUsageCollection.deleteMany({ _id: { $in: toDelete } })
        deletedCount += result.deletedCount || 0
      }
    }

    if (deletedCount > 0) {
      console.log(`   - 중복 레코드 ${deletedCount}개 삭제`)
    }

    // 인덱스 생성
    await apiUsageCollection.createIndex(
      { email: 1, date: 1 },
      { unique: true, sparse: true }
    )

    console.log('✅ api_usage 컬렉션 업데이트 완료\n')

    // 3. 통계
    console.log('📊 [3/5] 마이그레이션 통계...')
    const totalUsers = await usersCollection.countDocuments()
    const totalApiUsage = await apiUsageCollection.countDocuments()

    console.log(`- 총 사용자 수: ${totalUsers}명`)
    console.log(`- 총 API 사용 기록: ${totalApiUsage}건\n`)

    // 4. 검증
    console.log('✅ [4/5] 데이터 검증...')
    const validUsers = await usersCollection.countDocuments({
      remainingLimit: { $exists: true }
    })
    console.log(`- remainingLimit 필드 있는 사용자: ${validUsers}명`)

    const indexes = await usersCollection.indexes()
    console.log(`- 생성된 인덱스: ${indexes.length}개\n`)

    // 5. 완료
    console.log('✅ [5/5] 마이그레이션 완료!')
    console.log('\n📌 다음 단계:')
    console.log('1. node scripts/create-indexes.js (인덱스 생성)')
    console.log('2. npm run dev (서버 재시작)\n')

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message)
    process.exit(1)
  } finally {
    await client.close()
  }
}

migrate()
