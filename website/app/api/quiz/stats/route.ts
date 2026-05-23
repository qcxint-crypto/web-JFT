import { NextResponse } from 'next/server'
import { getStructuredAvailability, loadQuestions } from '@/lib/quiz-data'

export async function GET() {
  const questions = loadQuestions()

  if (questions.length === 0) {
    return NextResponse.json({ totalQuestions: 0, error: 'No data found' })
  }

  const availability = getStructuredAvailability(15)

  return NextResponse.json({
    totalQuestions: questions.length,
    availableQuizQuestions: availability.total,
    categories: availability.availableCounts,
    quizStructure: availability.selectedCounts,
    targetQuizStructure: {
      moji_goi: 15,
      kaiwa_hyougen: 15,
      choukai: 15,
      dokkai: 15,
    },
  })
}
