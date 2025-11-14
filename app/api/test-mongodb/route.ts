import { connectToDatabase } from '@/lib/mongodb'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 MongoDB 연결 테스트 시작...')

    // 1. MongoDB 연결
    const { client, db } = await connectToDatabase()
    console.log('✓ MongoDB 연결 성공')

    // 2. 테스트 컬렉션 생성/선택
    const testCollection = db.collection('test')
    console.log('✓ 테스트 컬렉션 선택 완료')

    // 3. 테스트 데이터 삽입
    const testData = {
      name: 'MongoDB 연결 테스트',
      timestamp: new Date(),
      message: '이것은 테스트 데이터입니다',
      status: 'success'
    }

    const insertResult = await testCollection.insertOne(testData)
    console.log('✓ 테스트 데이터 삽입 성공', insertResult.insertedId)

    // 4. 방금 삽입한 데이터 조회
    const foundData = await testCollection.findOne({ _id: insertResult.insertedId })
    console.log('✓ 테스트 데이터 조회 성공', foundData)

    // 5. 모든 테스트 데이터 개수 확인
    const count = await testCollection.countDocuments()
    console.log(`✓ 테스트 컬렉션의 총 데이터: ${count}개`)

    // 6. 결과 반환
    return NextResponse.json(
      {
        status: '✓ MongoDB 연동 완벽합니다!',
        details: {
          연결상태: '성공',
          데이터베이스: 'youtube-search',
          컬렉션: 'test',
          삽입된ID: insertResult.insertedId.toString(),
          삽입된데이터: testData,
          조회된데이터: foundData,
          총데이터수: count,
          테스트시간: new Date().toLocaleString('ko-KR')
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('✗ MongoDB 연결 테스트 실패:', error)

    return NextResponse.json(
      {
        status: '✗ MongoDB 연동 실패',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        details: {
          에러타입: error instanceof Error ? error.constructor.name : 'Unknown',
          환경변수확인: process.env.MONGODB_URI ? '설정됨' : '설정 안됨'
        }
      },
      { status: 500 }
    )
  }
}
