'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import QuestionCard from '@/components/QuestionCard'
import ProgressBar from '@/components/ProgressBar'

interface Question {
  question_id: string
  question: string
  choices: Array<{ text: string; image?: { url: string; path: string } }>
  images: Array<{ url: string; path: string; index: number }>
  audio: string
  category: string
  categoryKey?: string
  correctAnswer?: string | number
}

const CATEGORY_COPY: Record<string, { label: string; tone: string }> = {
  moji_goi: { label: 'Kosakata / Moji Goi', tone: 'bg-emerald-100 text-emerald-900' },
  kaiwa_hyougen: { label: 'Kaiwa / Hyougen', tone: 'bg-orange-100 text-orange-900' },
  choukai: { label: 'Listening / Choukai', tone: 'bg-sky-100 text-sky-900' },
  dokkai: { label: 'Reading / Dokkai', tone: 'bg-amber-100 text-amber-900' },
}

export default function QuizPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    const initSession = async () => {
      try {
        let sid = localStorage.getItem('jft_session_id')
        if (!sid) {
          sid = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
          localStorage.setItem('jft_session_id', sid)
        }

        const response = await fetch(`/api/quiz?session=${sid}`)
        const data = await response.json()
        setQuestions(data.questions)
        setAnswers(new Array(data.questions.length).fill(-1))
      } catch (error) {
        console.error('Failed to load quiz:', error)
      } finally {
        setLoading(false)
      }
    }

    initSession()
  }, [])

  const handleAnswer = (choiceIndex: number) => {
    if (submitted) return

    const nextAnswers = [...answers]
    nextAnswers[currentIndex] = choiceIndex
    setAnswers(nextAnswers)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1 && answers[currentIndex] !== -1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleSubmit = () => {
    if (answers.every((answer) => answer !== -1) || window.confirm('Belum semua soal dijawab. Tetap submit?')) {
      setSubmitted(true)
      setShowResults(true)
    }
  }

  const handleNewSession = () => {
    localStorage.removeItem('jft_session_id')
    window.location.reload()
  }

  const handleGoHome = (force = false) => {
    if (
      force ||
      window.confirm('Kembali ke menu utama? Progress quiz di halaman ini akan hilang jika belum disubmit.')
    ) {
      router.push('/')
    }
  }

  const calculateScore = () => {
    let score = 0
    let answeredCount = 0

    answers.forEach((answer, index) => {
      if (answer === -1) return

      answeredCount += 1
      const question = questions[index]

      if (question.correctAnswer !== undefined) {
        if (typeof question.correctAnswer === 'number') {
          if (answer === question.correctAnswer) score += 1
        } else if (question.choices[answer]?.text === question.correctAnswer) {
          score += 1
        }
      } else {
        score += 1
      }
    })

    return { score, total: questions.length, answeredCount }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="glass-panel w-full max-w-xl rounded-[34px] px-8 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-900 text-2xl text-white shadow-[0_18px_36px_-24px_rgba(15,23,42,0.75)]">
            ...
          </div>
          <div className="mt-6 text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Preparing Session</div>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.05em] text-slate-950">
            Sedang menyiapkan quiz JFT Anda
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Menyusun soal random, kategori, dan media supaya sesi langsung siap dipakai.
          </p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="glass-panel max-w-xl rounded-[34px] px-8 py-10 text-center">
          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500">Data Missing</div>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.05em] text-slate-950">
            Soal belum tersedia
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Cek hasil scrape dan file data quiz Anda, lalu coba buka kembali halaman ini.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            Kembali ke Menu Utama
          </button>
        </div>
      </div>
    )
  }

  if (showResults) {
    const { score, total, answeredCount } = calculateScore()
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0

    return (
      <div className="mx-auto max-w-4xl">
        <div className="glass-panel overflow-hidden rounded-[40px] px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Result Capsule</div>
              <h1 className="font-display mt-3 text-4xl font-bold tracking-[-0.06em] text-slate-950 sm:text-5xl">
                Session selesai. Lanjut review atau mulai batch baru.
              </h1>
            </div>
            <button
              onClick={() => handleGoHome(true)}
              className="rounded-full border border-slate-900/10 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5"
            >
              Menu Utama
            </button>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[32px] bg-slate-900 p-7 text-white shadow-[0_28px_70px_-38px_rgba(15,23,42,0.85)]">
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-white/55">Score Drop</div>
              <div className="font-display mt-4 text-7xl font-bold tracking-[-0.08em]">
                {score}
                <span className="text-2xl text-white/35"> / {total}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/72">
                Nilai ini dihitung dari jawaban yang punya kunci. Jika ada soal tanpa kunci, sistem tetap menghitung progress supaya sesi tidak terasa kosong.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] border border-slate-900/10 bg-white/90 p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Percentage</div>
                <div className="font-display mt-2 text-4xl font-bold tracking-[-0.05em] text-slate-950">{percentage}%</div>
              </div>
              <div className="rounded-[24px] border border-slate-900/10 bg-white/90 p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Answered</div>
                <div className="font-display mt-2 text-4xl font-bold tracking-[-0.05em] text-slate-950">{answeredCount}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 h-3 overflow-hidden rounded-full bg-slate-900/8">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#11203a_0%,#2a4e87_42%,#00d7a0_100%)]"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <button
              onClick={handleNewSession}
              className="inline-flex items-center justify-center rounded-[20px] bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              Start New Random Quiz
            </button>
            <button
              onClick={() => setShowResults(false)}
              className="inline-flex items-center justify-center rounded-[20px] border border-slate-900/10 bg-white/90 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5"
            >
              Review My Answers
            </button>
            <button
              onClick={() => handleGoHome(true)}
              className="inline-flex items-center justify-center rounded-[20px] border border-slate-900/10 bg-white/90 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5"
            >
              Kembali ke Halaman Utama
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const isAnswered = answers[currentIndex] !== -1
  const answeredCount = answers.filter((answer) => answer !== -1).length
  const categoryTheme = CATEGORY_COPY[currentQuestion.categoryKey || ''] || {
    label: currentQuestion.category || 'General',
    tone: 'bg-slate-100 text-slate-800',
  }

  return (
    <div className="space-y-6 pb-24">
      <section className="glass-panel relative overflow-hidden rounded-[38px] px-6 py-7 sm:px-8">
        <div
          aria-hidden="true"
          className="absolute right-[-3rem] top-[-2rem] h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,_rgba(91,168,255,0.24),_transparent_72%)] blur-2xl"
        />
        <div className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Randomized JFT Session</div>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.06em] text-slate-950 sm:text-4xl">
              Sesi latihan yang lebih fokus, lebih enak dilihat, dan tetap cepat dipakai.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Soal tetap berjalan sesuai flow JFT: kosakata, percakapan, listening, lalu reading. Anda bisa kembali ke menu utama kapan saja lewat tombol yang ada di layar ini.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
            <div className="rounded-[24px] border border-slate-900/10 bg-white/88 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Answered</div>
              <div className="font-display mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950">{answeredCount}</div>
            </div>
            <div className="rounded-[24px] border border-slate-900/10 bg-white/88 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Current</div>
              <div className="font-display mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950">{currentIndex + 1}</div>
            </div>
            <div className="rounded-[24px] border border-slate-900/10 bg-white/88 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Question Bank</div>
              <div className="font-display mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950">{questions.length}</div>
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4">
          <span className={`inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.22em] ${categoryTheme.tone}`}>
            {categoryTheme.label}
          </span>
          <button
            onClick={() => handleGoHome()}
            className="inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5"
          >
            Menu Utama
          </button>
        </div>
      </section>

      <ProgressBar current={currentIndex + 1} total={questions.length} />

      <section className="glass-panel rounded-[34px] px-5 py-6 sm:px-7 sm:py-8">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-slate-900/8 bg-white/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
              Question {currentIndex + 1} of {questions.length}
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Pilih jawaban terbaik. Progress akan tetap berada di halaman ini sampai Anda submit atau keluar ke menu utama.
            </p>
          </div>

          {isAnswered && !submitted && (
            <span className="animate-fade-in rounded-full bg-emerald-100 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-900">
              Answer saved
            </span>
          )}
        </div>

        <QuestionCard
          question={currentQuestion}
          selectedAnswer={answers[currentIndex]}
          onSelectAnswer={handleAnswer}
          submitted={submitted}
        />
      </section>

      <div className="sticky bottom-4 z-30">
        <div className="glass-panel rounded-[30px] p-3 sm:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
              Navigation Deck
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="inline-flex items-center justify-center rounded-[18px] border border-slate-900/10 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Back
              </button>

              <button
                onClick={() => handleGoHome()}
                className="inline-flex items-center justify-center rounded-[18px] border border-slate-900/10 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5"
              >
                Menu Utama
              </button>

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={!isAnswered && answers.some((answer) => answer === -1)}
                  className={`inline-flex items-center justify-center rounded-[18px] px-6 py-3 text-sm font-semibold transition ${
                    isAnswered
                      ? 'bg-slate-900 text-white shadow-[0_16px_28px_-18px_rgba(15,23,42,0.8)] hover:-translate-y-0.5'
                      : 'cursor-not-allowed bg-slate-200 text-slate-400'
                  }`}
                >
                  Finish Quiz
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!isAnswered}
                  className={`inline-flex items-center justify-center rounded-[18px] px-6 py-3 text-sm font-semibold transition ${
                    isAnswered
                      ? 'bg-slate-900 text-white shadow-[0_16px_28px_-18px_rgba(15,23,42,0.8)] hover:-translate-y-0.5'
                      : 'cursor-not-allowed bg-slate-200 text-slate-400'
                  }`}
                >
                  Next Question
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
