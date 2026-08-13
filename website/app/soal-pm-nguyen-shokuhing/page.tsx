'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { allNguyenQuestions, NguyenQuestion } from './data'

const DEFAULT_QUESTION_COUNT = 20
const PLAYER_NAME_KEY = 'rananwari_player_name'
const SEEN_KEY = 'nguyen_seen_v1'

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000
function currentCycleKey(now = new Date()): string {
  const j = new Date(now.getTime() + JAKARTA_OFFSET_MS)
  const dayIndex = (j.getUTCDay() + 6) % 7
  const start = new Date(j)
  start.setUTCHours(0, 0, 0, 0)
  start.setUTCDate(start.getUTCDate() - dayIndex)
  const yyyy = start.getUTCFullYear()
  const mm = String(start.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(start.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

type SeenState = { cycle: string; name: string; ids: number[] }

function loadSeen(name: string): SeenState {
  if (typeof window === 'undefined') return { cycle: currentCycleKey(), name, ids: [] }
  try {
    const raw = window.localStorage.getItem(SEEN_KEY)
    if (raw) {
      const p = JSON.parse(raw) as SeenState
      if (p && p.cycle === currentCycleKey() && p.name === name && Array.isArray(p.ids)) {
        return { cycle: p.cycle, name, ids: p.ids }
      }
    }
  } catch {}
  return { cycle: currentCycleKey(), name, ids: [] }
}

function saveSeen(name: string, ids: number[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify({ cycle: currentCycleKey(), name, ids }))
  } catch {}
}

const clampQuestionCount = (value: number) =>
  Number.isFinite(value) ? Math.max(5, Math.min(allNguyenQuestions.length, Math.round(value))) : DEFAULT_QUESTION_COUNT

function selectQuestions(count: number, name: string): NguyenQuestion[] {
  const state = loadSeen(name)
  const seen = new Set(state.ids)
  const chosen: NguyenQuestion[] = []
  const chosenIds = new Set<number>()
  const n = Math.min(count, allNguyenQuestions.length)

  while (chosen.length < n) {
    let pool = allNguyenQuestions.filter((q) => !seen.has(q.id) && !chosenIds.has(q.id))
    if (pool.length === 0) {
      seen.clear()
      pool = allNguyenQuestions.filter((q) => !chosenIds.has(q.id))
      if (pool.length === 0) break
    }
    const pick = pool[Math.floor(Math.random() * pool.length)]
    chosen.push(pick)
    chosenIds.add(pick.id)
    seen.add(pick.id)
  }

  saveSeen(name, [...seen])
  return chosen
}

function FuriganaPrompt({ html }: { html: string }) {
  return (
    <div
      className="furigana-question font-display text-xl font-bold tracking-[-0.02em] text-slate-950 md:text-2xl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default function NguyenQuizPage() {
  const router = useRouter()
  const [questionsPerSession, setQuestionsPerSession] = useState(DEFAULT_QUESTION_COUNT)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [playerName, setPlayerName] = useState('')
  const [quizInstanceKey, setQuizInstanceKey] = useState('')
  const [savedQuizInstanceKey, setSavedQuizInstanceKey] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizEnded, setQuizEnded] = useState(false)
  const [questions, setQuestions] = useState<NguyenQuestion[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedName = localStorage.getItem(PLAYER_NAME_KEY) || ''
    if (!storedName) {
      router.replace('/')
      return
    }
    setPlayerName(storedName)
    setLoading(false)
  }, [router])

  const generateQuiz = (count: number, name: string) => {
    const selected = selectQuestions(clampQuestionCount(count), name)
    setQuestions(selected)
  }

  const startQuiz = () => {
    generateQuiz(questionsPerSession, playerName)
    setQuizInstanceKey(`nguyen_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`)
    setQuizStarted(true)
    setQuizEnded(false)
    setCurrentIndex(0)
    setScore(0)
    setSelectedKey(null)
    setAnswered(false)
    setSaveState('idle')
    setLeaderboardRank(null)
  }

  const resetQuiz = () => {
    generateQuiz(questionsPerSession, playerName)
    setQuizInstanceKey(`nguyen_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`)
    setQuizEnded(false)
    setCurrentIndex(0)
    setScore(0)
    setSelectedKey(null)
    setAnswered(false)
    setSaveState('idle')
    setLeaderboardRank(null)
  }

  const handleAnswer = (optionKey: string) => {
    if (answered) return
    setSelectedKey(optionKey)
    setAnswered(true)
    const current = questions[currentIndex]
    if (optionKey === current?.answer) {
      setScore((prev) => prev + 1)
    }
  }

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedKey(null)
      setAnswered(false)
      return
    }
    setQuizEnded(true)
  }

  const adjustQuestionCount = (delta: number) => {
    setQuestionsPerSession((prev) => clampQuestionCount(prev + delta))
  }

  const handleGoHome = (force = false) => {
    if (force || !quizStarted || quizEnded || window.confirm('Kembali ke menu utama? Progress sesi Nguyen akan hilang.')) {
      router.push('/')
    }
  }

  useEffect(() => {
    if (!quizEnded || !playerName || !quizInstanceKey || savedQuizInstanceKey === quizInstanceKey || questions.length === 0) return

    const saveResult = async () => {
      setSaveState('saving')
      try {
        const response = await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'pm',
            name: playerName,
            score,
            totalQuestions: questions.length,
            answeredCount: questions.length,
          }),
        })
        if (!response.ok) throw new Error('Failed to save Nguyen leaderboard result.')
        const payload = await response.json()
        setLeaderboardRank(payload.rank ?? null)
        setSavedQuizInstanceKey(quizInstanceKey)
        setSaveState('saved')
      } catch (error) {
        console.error('Failed to save Nguyen result:', error)
        setSaveState('error')
      }
    }

    saveResult()
  }, [playerName, questions.length, quizEnded, quizInstanceKey, savedQuizInstanceKey, score])

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="glass-panel w-full max-w-xl rounded-[34px] px-8 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-900 text-2xl text-white shadow-[0_18px_36px_-24px_rgba(15,23,42,0.75)]">
            食
          </div>
          <div className="mt-6 text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Preparing Session</div>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.05em] text-slate-950">Menyiapkan latihan soal Nguyen</h1>
        </div>
      </div>
    )
  }

  if (!quizStarted) {
    const TOTAL = allNguyenQuestions.length
    return (
      <div className="mx-auto grid max-w-5xl gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <section className="glass-panel relative hidden overflow-hidden rounded-[38px] px-6 py-8 xl:block sm:px-8 sm:py-10">
          <div className="relative space-y-6">
            <span className="inline-flex rounded-full border border-slate-900/10 bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
              Soal PM Nguyen
            </span>
            <div>
              <h1 className="font-display text-4xl font-bold leading-[0.95] tracking-[-0.06em] text-slate-950 sm:text-5xl">
                Latihan Soal Tokutei Shokuhing (Nguyen)
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Soal lengkap dengan furigana. Setiap sesi acak, tanpa pengulangan sampai siklus habis. Atur jumlah soal sesuai keinginan.
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-900/10 bg-white/88 p-6">
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Bank Soal</div>
              <div className="font-display mt-3 text-4xl font-bold tracking-[-0.06em] text-slate-950">{TOTAL}</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">Semua soal digabung dalam satu kategori: soal-pm-nguyen-shokuhing</p>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[38px] px-5 py-6 sm:px-8 sm:py-10">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Setup Session</div>
          <h2 className="font-display mt-3 text-2xl font-bold tracking-[-0.05em] text-slate-950 sm:text-3xl">Atur jumlah soal</h2>

          <div className="mt-6 rounded-[28px] border border-slate-900/10 bg-[color:var(--surface-strong)] p-4 sm:p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Jumlah Soal</div>
            <div className="mt-4 flex items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={() => adjustQuestionCount(-5)}
                className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-slate-900/10 bg-slate-900 text-xl font-black text-white transition hover:-translate-y-0.5"
              >
                −
              </button>
              <input
                type="number"
                min={5}
                max={TOTAL}
                value={questionsPerSession}
                onChange={(e) => setQuestionsPerSession(clampQuestionCount(Number(e.target.value)))}
                className="w-24 rounded-[20px] border border-slate-900/10 bg-white px-3 py-3 text-center text-lg font-black text-slate-950 outline-none focus:border-emerald-400 sm:w-28 sm:text-xl"
              />
              <button
                onClick={() => adjustQuestionCount(5)}
                className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-slate-900/10 bg-white text-xl font-black text-slate-900 transition hover:-translate-y-0.5"
              >
                +
              </button>
            </div>
            <p className="mt-3 text-center text-sm text-slate-500">Minimal 5 soal, maksimal {TOTAL} soal.</p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={startQuiz}
              className="inline-flex w-full items-center justify-center rounded-[22px] bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_32px_-20px_rgba(15,23,42,0.82)] transition hover:-translate-y-0.5"
            >
              Mulai Latihan Sekarang
            </button>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-[22px] border border-slate-900/10 bg-white/90 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5"
            >
              Kembali ke Menu Utama
            </Link>
          </div>
        </section>
      </div>
    )
  }

  if (quizEnded) {
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
    return (
      <div className="mx-auto max-w-4xl">
        <div className="glass-panel overflow-hidden rounded-[40px] px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Nguyen PM Session Complete</div>
              <h1 className="font-display mt-3 text-4xl font-bold tracking-[-0.06em] text-slate-950 sm:text-5xl">
                Sesi selesai. Review atau mulai batch baru.
              </h1>
            </div>
            <button onClick={() => handleGoHome(true)} className="rounded-full border border-slate-900/10 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5">
              Menu Utama
            </button>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[32px] bg-slate-900 p-7 text-white shadow-[0_28px_70px_-38px_rgba(15,23,42,0.85)]">
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-white/55">Score</div>
              <div className="mt-4">
                <div className="font-display text-7xl font-bold leading-none tracking-[-0.08em]">{score}</div>
                <div className="mt-2 text-xl font-semibold text-white/50">/ {questions.length}</div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] border border-slate-900/10 bg-white/90 p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Accuracy</div>
                <div className="font-display mt-2 text-4xl font-bold tracking-[-0.05em] text-slate-950">{percentage}%</div>
              </div>
              <div className="rounded-[24px] border border-slate-900/10 bg-white/90 p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Jumlah Soal</div>
                <div className="font-display mt-2 text-4xl font-bold tracking-[-0.05em] text-slate-950">{questions.length}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 h-3 overflow-hidden rounded-full bg-slate-900/8">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#11203a_0%,#ff7a59_60%,#00d7a0_100%)]" style={{ width: `${percentage}%` }} />
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-900/10 bg-white/90 px-5 py-4 text-sm text-slate-600">
            {saveState === 'saving' && 'Menyimpan skor ke leaderboard...'}
            {saveState === 'saved' && (leaderboardRank ? `Skor tersimpan. Posisi saat ini: #${leaderboardRank}.` : 'Skor tersimpan di leaderboard minggu ini.')}
            {saveState === 'error' && 'Gagal update leaderboard.'}
            {saveState === 'idle' && 'Menyiapkan sinkronisasi leaderboard.'}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <button onClick={resetQuiz} className="inline-flex items-center justify-center rounded-[20px] bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5">Coba Lagi</button>
            <button onClick={startQuiz} className="inline-flex items-center justify-center rounded-[20px] border border-slate-900/10 bg-white/90 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5">Batch Baru</button>
            <button onClick={() => handleGoHome(true)} className="inline-flex items-center justify-center rounded-[20px] border border-slate-900/10 bg-white/90 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5">Kembali ke Menu</button>
          </div>
        </div>
      </div>
    )
  }

  const current = questions[currentIndex]
  const isCorrect = answered && selectedKey === current.answer
  const percentage = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className="space-y-6 pb-24">
      <section className="glass-panel relative overflow-hidden rounded-[38px] px-6 py-7 sm:px-8">
        <div className="relative grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Nguyen PM Soal</div>
            <div className="mt-2 text-sm text-slate-600">Sesi acak • full kanji + furigana</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-slate-900/10 bg-white/88 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Score</div>
              <div className="font-display mt-1 text-3xl font-bold tracking-[-0.05em] text-slate-950">{score}</div>
            </div>
            <div className="rounded-[24px] border border-slate-900/10 bg-white/88 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Soal</div>
              <div className="font-display mt-1 text-3xl font-bold tracking-[-0.05em] text-slate-950">{currentIndex + 1} / {questions.length}</div>
            </div>
            <div className="rounded-[24px] border border-slate-900/10 bg-white/88 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Progress</div>
              <div className="font-display mt-1 text-3xl font-bold tracking-[-0.05em] text-slate-950">{Math.round(percentage)}%</div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button onClick={() => handleGoHome()} className="inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-white/90 px-5 py-2 text-sm font-semibold text-slate-700">Menu Utama</button>
        </div>
      </section>

      <div className="glass-panel rounded-[30px] p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Nguyen PM Flow</p>
            <h3 className="font-display mt-2 text-2xl font-bold tracking-[-0.05em] text-slate-950">Soal {currentIndex + 1}</h3>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-bold tracking-[-0.05em] text-slate-950">
              {currentIndex + 1}
              <span className="text-base text-slate-400"> / {questions.length}</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">question tracked</p>
          </div>
        </div>
        <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-slate-900/8">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#11203a_0%,#ff7a59_60%,#00d7a0_100%)] transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <section className="rounded-[30px] border border-slate-900/8 bg-[color:var(--surface)] p-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.6)] backdrop-blur-sm md:p-7">
          <div className="mb-4 inline-flex rounded-full border border-slate-900/8 bg-white/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
            Prompt
          </div>
          <FuriganaPrompt html={current.promptHtml} />
        </section>

        <div className="mt-6 space-y-3 md:space-y-4">
          <p className="px-1 text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 md:text-xs">
            Pilihan Jawaban
          </p>
          {current.choices.map((choice) => {
            const isSelected = selectedKey === choice.key
            const isRight = choice.key === current.answer

            let buttonClass = 'w-full overflow-hidden rounded-[26px] border p-4 text-left transition-all duration-200 active:scale-[0.985] md:p-5 '
            let markerClass = 'bg-slate-900/5 text-slate-600'

            if (answered) {
              if (isRight) {
                buttonClass += 'border-emerald-400 bg-emerald-50 text-emerald-950 kanji-choice kanji-choice--correct'
                markerClass = 'bg-emerald-500 text-white'
              } else if (isSelected) {
                buttonClass += 'border-rose-400 bg-rose-50 text-rose-950 kanji-choice kanji-choice--wrong'
                markerClass = 'bg-rose-500 text-white'
              } else {
                buttonClass += 'border-slate-900/8 bg-white/70 text-slate-400 opacity-60 kanji-choice kanji-choice--idle'
                markerClass = 'bg-slate-900/5 text-slate-400 opacity-55'
              }
            } else if (isSelected) {
              buttonClass += 'border-[#4f7cff] bg-[#dcecff] text-[#101828] ring-1 ring-[#4f7cff]/35 kanji-choice'
              markerClass = 'bg-[#101828] text-white'
            } else {
              buttonClass += 'border-slate-900/10 bg-white/88 text-slate-800 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.55)] hover:-translate-y-0.5 hover:border-slate-400/30 hover:bg-white kanji-choice kanji-choice--idle'
            }

            return (
              <button
                key={choice.key}
                onClick={() => handleAnswer(choice.key)}
                disabled={answered}
                className={buttonClass}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-[14px] text-xs font-black transition-colors md:h-10 md:w-10 ${markerClass}`}>
                      {answered ? (isRight ? '✓' : isSelected ? '✕' : choice.key) : choice.key}
                    </div>
                  </div>
                  <div
                    className="furigana-choice flex-1 text-sm font-semibold leading-7 text-inherit md:text-base"
                    dangerouslySetInnerHTML={{ __html: choice.html }}
                  />
                </div>
              </button>
            )
          })}
        </div>

        {answered && (
          <div
            className={`mt-8 rounded-[28px] border p-6 ${
              isCorrect
                ? 'kanji-result-panel kanji-result-panel--correct border-emerald-200 bg-emerald-50/75'
                : 'kanji-result-panel kanji-result-panel--wrong border-rose-200 bg-rose-50/75'
            }`}
          >
            <div className={`mb-3 text-[11px] font-black uppercase tracking-[0.3em] ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isCorrect ? 'Jawaban Benar' : 'Jawaban Salah'}
            </div>
            <div className="text-sm font-semibold text-slate-700">
              Jawaban yang benar: <span className="font-black text-slate-950">{current.answer}</span>
            </div>
            <div
              className="furigana-choice mt-3 text-base font-semibold text-slate-900"
              dangerouslySetInnerHTML={{
                __html: current.choices.find((c) => c.key === current.answer)?.html || current.answer,
              }}
            />
          </div>
        )}
      </div>

      <div className="sticky bottom-4 z-30">
        <div className="glass-panel rounded-[30px] p-3 sm:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              <button onClick={() => handleGoHome()} className="inline-flex items-center justify-center rounded-[18px] border border-slate-900/10 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700">Menu Utama</button>
              {answered && (
                <button onClick={nextQuestion} className="inline-flex items-center justify-center rounded-[18px] bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_-18px_rgba(15,23,42,0.8)]">
                  {currentIndex + 1 === questions.length ? 'Lihat Hasil' : 'Selanjutnya'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
