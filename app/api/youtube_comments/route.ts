import { NextRequest, NextResponse } from 'next/server'

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!videoId) {
    return NextResponse.json(
      { error: '비디오 ID가 필요합니다' },
      { status: 400 }
    )
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API 키가 설정되지 않았습니다' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_URL}/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&textFormat=plainText&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: '댓글을 불러올 수 없습니다' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const comments = data.items || []

    // 댓글 통계 계산
    let totalReplies = 0
    let totalLikes = 0

    const formattedComments = comments.slice(0, 20).map((thread: any) => {
      const snippet = thread.snippet
      const topComment = snippet.topLevelComment.snippet

      totalReplies += snippet.totalReplyCount || 0
      totalLikes += topComment.likeCount || 0

      return {
        author: topComment.authorDisplayName,
        text: topComment.textDisplay,
        likes: topComment.likeCount || 0,
        replies: snippet.totalReplyCount || 0,
      }
    })

    return NextResponse.json({
      comments: formattedComments,
      totalComments: comments.length,
      totalReplies,
      totalLikes,
      avgLikes: comments.length > 0 ? Math.round(totalLikes / comments.length) : 0,
    })
  } catch (error) {
    console.error('댓글 조회 오류:', error)
    return NextResponse.json(
      { error: '댓글 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
