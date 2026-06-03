import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboardData, submitLeaderboardResult } from '@/lib/leaderboard'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const playerName = request.nextUrl.searchParams.get('name') || undefined

  try {
    const data = await getLeaderboardData(playerName)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('Failed to load leaderboard.', error)
    return NextResponse.json(
      {
        error: 'Failed to load leaderboard',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const result = await submitLeaderboardResult({
      name: payload.name,
      mode: payload.mode,
      score: payload.score,
      totalQuestions: payload.totalQuestions,
      answeredCount: payload.answeredCount,
    })

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('Failed to save leaderboard result.', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to save leaderboard result',
      },
      { status: 400 }
    )
  }
}
