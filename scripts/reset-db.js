const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function resetDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI 환경변수가 설정되지 않았습니다');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✓ MongoDB 연결됨\n');

    const db = client.db('youtube-search');

    // 모든 컬렉션 조회
    const collections = await db.listCollections().toArray();
    console.log(`🗑️  ${collections.length}개 컬렉션 삭제 중...\n`);

    // 각 컬렉션 삭제
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      await db.collection(collection.name).deleteMany({});
      console.log(`✅ ${collection.name} - ${count}개 문서 삭제됨`);
    }

    console.log('\n✨ DB 초기화 완료!');
    console.log('\n📊 최종 상태:');

    const finalCollections = await db.listCollections().toArray();
    for (const collection of finalCollections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count}개`);
    }

    console.log('\n🚀 다음 단계:');
    console.log('1. npm run dev로 애플리케이션 시작');
    console.log('2. Google/Kakao/Naver로 로그인하여 테스트');
    console.log('3. 새로운 필드 저장 확인\n');

  } catch (error) {
    console.error('❌ DB 초기화 실패:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

resetDatabase();
