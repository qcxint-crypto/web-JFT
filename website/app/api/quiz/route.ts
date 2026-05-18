import { NextRequest, NextResponse } from 'next/server'
import { buildStructuredQuiz, getStructuredAvailability, loadQuestions } from '@/lib/quiz-data'

export async function GET(request: NextRequest) {
  const session = request.nextUrl.searchParams.get('session') || 'default'
  const perCategoryCount = 15

  const allQuestions = loadQuestions()
  if (allQuestions.length === 0) {
    return NextResponse.json({ error: 'No questions found' }, { status: 404 })
  }

  const questions = buildStructuredQuiz(session, perCategoryCount)
  const availability = getStructuredAvailability(perCategoryCount)

  const response = NextResponse.json({
    questions,
    meta: {
      total: questions.length,
      targetStructure: {
        moji_goi: perCategoryCount,
        kaiwa_hyougen: perCategoryCount,
        choukai: perCategoryCount,
        dokkai: perCategoryCount,
      },
      selectedStructure: availability.selectedCounts,
      availableStructure: availability.availableCounts,
    },
  })

  response.cookies.set('jft_session', session, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })

  return response
}
