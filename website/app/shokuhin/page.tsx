'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { allPmKotoba, PmEntry } from './data'

// Quiz Shokuhin Kakou — hanya dua arah:
//   k2m: Kanji (+furigana) -> pilih Arti (Bahasa Indonesia)
//   m2k: Arti (Bahasa Indonesia) -> pilih Kanji (+furigana)
// Setiap kali kanji ditampilkan, cara bacanya (hiragana/katakana) ditulis di atasnya sebagai furigana.
const DIRECTIONS = ['k2m', 'm2k'] as const
type Direction = typeof DIRECTIONS[number]
type AnswerField = 'kanji' | 'meaning'

type QuizQuestion = {
  id: number
  direction: Direction
  entry: PmEntry
  options: PmEntry[]
  correctOptionId: number
}

const DIRECTION_LABELS: Record<Direction, { from: string; to: string }> = {
  k2m: { from: '漢字 Kanji', to: '意味 Arti' },
  m2k: { from: '意味 Arti', to: '漢字 Kanji' },
}

const DEFAULT_QUESTION_COUNT = 25
const PLAYER_NAME_KEY = 'rananwari_player_name'

const clampQuestionCount = (value: number) =>
  Number.isFinite(value) ? Math.max(5, Math.min(allPmKotoba.length, Math.round(value))) : DEFAULT_QUESTION_COUNT

const pickRandom = <T,>(items: T[], count: number) => {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

const getPmCategory = (entry: PmEntry) => {
  if (!entry) return 'OTHER'
  const k = entry.kanji || ''
  const m = (entry.meaning || '').toLowerCase()

  if (m.includes('suhu') || m.includes('temperatur') || k.includes('温') || k.includes('冷') || k.includes('熱')) return 'TEMP'
  if (m.includes('bakteri') || m.includes('mikroorganisme') || m.includes('racun') || m.includes('spora') || k.includes('菌') || k.includes('毒')) return 'MICRO'
  if (m.includes('proses') || m.includes('produksi') || m.includes('pembekuan') || m.includes('pendinginan') || m.includes('pemanasan') || m.includes('pengemasan') || k.includes('工程')) return 'PROCESS'
  if (m.includes('bersih') || m.includes('steril') || m.includes('antiseptik') || m.includes('higienis') || k.includes('洗') || k.includes('消毒') || k.includes('殺菌')) return 'CLEAN'
  if (m.includes('kecelakaan') || m.includes('bahaya') || m.includes('keselamatan') || m.includes('darurat') || k.includes('災') || k.includes('危') || k.includes('安全')) return 'SAFETY'
  if (m.includes('gejala') || m.includes('sakit') || m.includes('demam') || m.includes('diare') || m.includes('muntah') || m.includes('mual') || m.includes('kejang')) return 'SYMPTOM'
  if (m.includes('mesin') || m.includes('perangkat') || m.includes('instrumen') || m.includes('alat') || k.includes('機') || k.includes('装置') || k.includes('器')) return 'EQUIP'
  if (m.includes('pakaian') || m.includes('sepatu') || m.includes('kacamata') || m.includes('topi') || m.includes('pelindung') || k.includes('靴') || k.includes('服')) return 'ATTIRE'
  if (m.includes('manajemen') || m.includes('standar') || m.includes('peraturan') || m.includes('hukum') || m.includes('dokumen') || k.includes('管理') || k.includes('基準')) return 'MGMT'
  if (m.includes('bahan baku') || m.includes('alergen') || m.includes('kacang') || m.includes('susu') || m.includes('kedelai') || k.includes('材料') || k.includes('アレルギー')) return 'MATERIAL'
  if (m.includes('pekerja') || m.includes('kerja') || m.includes('industri') || m.includes('rekan') || k.includes('労働') || k.includes('作業')) return 'LABOR'
  return 'OTHER'
}

const scoreSimilarity = (candidate: PmEntry, target: PmEntry, field: AnswerField) => {
  if (!candidate || !target) return 0
  const source = target[field]
  const probe = candidate[field]

  if (source === probe) return -999

  let score = 0

  if (field === 'meaning') {
    if (getPmCategory(target) === getPmCategory(candidate)) score += 28
    const srcWords = source.toLowerCase().split(/[\s,()\/]+/).filter((w) => w.length > 2)
    const probeWords = probe.toLowerCase().split(/[\s,()\/]+/).filter((w) => w.length > 2)
    for (const w of srcWords) {
      for (const pw of probeWords) {
        if (w === pw) score += 14
        else if (pw.includes(w) || w.includes(pw)) score += 7
      }
    }
    if (Math.abs(source.length - probe.length) <= 3) score += 3
  } else {
    // field === 'kanji'
    if (source.length === probe.length) score += 10
    else if (Math.abs(source.length - probe.length) <= 1) score += 3
    for (const char of new Set(source)) {
      if (probe.includes(char)) score += 4
    }
    if (source.endsWith('する') && probe.endsWith('する')) score += 12
    if (source.endsWith('ます') && probe.endsWith('ます')) score += 10
    if (source.endsWith('工程') && probe.endsWith('工程')) score += 15
    if (source.endsWith('管理') && probe.endsWith('管理')) score += 14
    // dorong distraktor dengan kategori makna serupa
    if (getPmCategory(target) === getPmCategory(candidate)) score += 6
  }

  return score + Math.random() * 2
}

/**
 * Menampilkan kanji dengan furigana (cara baca) di atasnya menggunakan <ruby>.
 * Jika kata sudah berupa kana murni (reading kosong / '-' / sama dengan teksnya),
 * furigana tidak ditampilkan agar tidak berulang.
 */
function Furigana({ entry, className }: { entry: PmEntry; className?: string }) {
  const kanji = entry.kanji ?? ''
  const reading = (entry.reading ?? '').trim()
  const showRuby =
    reading.length > 0 && reading !== '-' && reading !== 'ー' && reading !== kanji.trim()

  if (!showRuby) {
    return <span className={className}>{kanji}</span>
  }

  return (
    <ruby className={`furigana ${className ?? ''}`}>
      {kanji}
      <rt>{reading}</rt>
    </ruby>
  )
}

function FeedbackRow({
  entry,
  tone,
  badge,
}: {
  entry: PmEntry
  tone: 'correct' | 'wrong'
  badge?: string
}) {
  const toneClasses =
    tone === 'correct'
      ? 'kanji-feedback-row kanji-feedback-row--correct border-emerald-200 bg-white/92 text-emerald-950'
      : 'kanji-feedback-row kanji-feedback-row--wrong border-rose-200 bg-white/92 text-rose-950'

  return (
    <div className={`rounded-[24px] border px-4 py-3 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.35)] ${toneClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-2">
          <Furigana entry={entry} className="font-display text-2xl font-bold leading-[1.5] tracking-[-0.03em] md:text-3xl" />
          <span className="text-slate-400">＝</span>
          <span className="text-sm font-semibold leading-relaxed md:text-base">{entry.meaning}</span>
        </div>
        {badge && (
          <span className="kanji-feedback-badge shrink-0 rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-rose-700">
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}

export default function ShokuhinQuizPage() {
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
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null)
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

  const generateQuiz = (count = questionsPerSession) => {
    const selectedEntries = pickRandom(allPmKotoba, clampQuestionCount(count))

    const nextQuestions = selectedEntries.map((entry) => {
      const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
      const aField: AnswerField = direction === 'k2m' ? 'meaning' : 'kanji'

      const candidateEntries = allPmKotoba
        .filter((item) => item.id !== entry.id && item[aField] !== entry[aField])
        .map((item) => ({ item, score: scoreSimilarity(item, entry, aField) }))
        .sort((a, b) => b.score - a.score)

      // Jaga agar tiap opsi berbeda pada kanji maupun arti (hindari opsi kembar)
      const seenKanji = new Set<string>([entry.kanji])
      const seenMeaning = new Set<string>([entry.meaning])
      const wrongOptions: PmEntry[] = []

      for (const candidate of candidateEntries) {
        if (wrongOptions.length >= 3) break
        const item = candidate.item
        if (seenKanji.has(item.kanji) || seenMeaning.has(item.meaning)) continue
        if (item[aField] === entry[aField]) continue
        wrongOptions.push(item)
        seenKanji.add(item.kanji)
        seenMeaning.add(item.meaning)
      }

      if (wrongOptions.length < 3) {
        const fallback = pickRandom(
          allPmKotoba.filter(
            (item) =>
              item.id !== entry.id &&
              !seenKanji.has(item.kanji) &&
              !seenMeaning.has(item.meaning) &&
              item[aField] !== entry[aField]
          ),
          3 - wrongOptions.length
        )
        for (const candidate of fallback) {
          if (seenKanji.has(candidate.kanji) || seenMeaning.has(candidate.meaning)) continue
          wrongOptions.push(candidate)
          seenKanji.add(candidate.kanji)
          seenMeaning.add(candidate.meaning)
        }
      }

      const options = pickRandom([entry, ...wrongOptions], Math.min(4, 1 + wrongOptions.length))

      return { id: entry.id, direction, entry, options, correctOptionId: entry.id }
    })

    setQuestions(nextQuestions)
  }

  const startQuiz = () => {
    generateQuiz(questionsPerSession)
    setQuizInstanceKey(`pm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`)
    setQuizStarted(true)
    setQuizEnded(false)
    setCurrentIndex(0)
    setScore(0)
    setSelectedAnswerId(null)
    setAnswered(false)
    setSaveState('idle')
    setLeaderboardRank(null)
  }

  const resetQuiz = () => {
    generateQuiz(questionsPerSession)
    setQuizInstanceKey(`pm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`)
    setQuizEnded(false)
    setCurrentIndex(0)
    setScore(0)
    setSelectedAnswerId(null)
    setAnswered(false)
    setSaveState('idle')
    setLeaderboardRank(null)
  }

  const handleAnswer = (answerId: number) => {
    if (answered) return
    setSelectedAnswerId(answerId)
    setAnswered(true)
    if (answerId === questions[currentIndex]?.correctOptionId) {
      setScore((prev) => prev + 1)
    }
  }

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedAnswerId(null)
      setAnswered(false)
      return
    }
    setQuizEnded(true)
  }

  const adjustQuestionCount = (delta: number) => {
    setQuestionsPerSession((prev) => clampQuestionCount(prev + delta))
  }

  const handleGoHome = (force = false) => {
    if (force || !quizStarted || quizEnded || window.confirm('Kembali ke menu utama? Progress sesi Shokuhin yang sedang berjalan akan hilang.')) {
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
        if (!response.ok) throw new Error('Failed to save PM leaderboard result.')
        const payload = await response.json()
        setLeaderboardRank(payload.rank ?? null)
        setSavedQuizInstanceKey(quizInstanceKey)
        setSaveState('saved')
      } catch (error) {
        console.error('Failed to save PM result:', error)
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
          <h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.05em] text-slate-950">Menyiapkan quiz Shokuhin Kakou</h1>
        </div>
      </div>
    )
  }

  if (!quizStarted) {
    return (
      <div className="mx-auto grid max-w-5xl gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <section className="glass-panel relative hidden overflow-hidden rounded-[38px] px-6 py-8 xl:block sm:px-8 sm:py-10">
          <div
            aria-hidden="true"
            className="absolute right-[-3rem] top-[-2rem] h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,122,89,0.22),_transparent_72%)] blur-2xl"
          />
          <div className="relative space-y-6">
            <span className="inline-flex rounded-full border border-slate-900/10 bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
              Shokuhin Kakou Mode
            </span>
            <div>
              <h1 className="font-display text-4xl font-bold leading-[0.95] tracking-[-0.06em] text-slate-950 sm:text-5xl">
                Kanji ⇄ Arti Bahasa Indonesia, lengkap dengan furigana.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Dua arah latihan: baca <span className="font-semibold">Kanji</span> (cara bacanya ditulis di atas dengan hiragana/katakana) lalu pilih artinya, atau baca <span className="font-semibold">arti Bahasa Indonesia</span> lalu pilih kanji yang tepat. Semua kosakata diambil dari materi SSW Pengolahan Makanan.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] bg-slate-900 p-6 text-white shadow-[0_28px_70px_-40px_rgba(15,23,42,0.85)]">
                <div className="text-[11px] font-black uppercase tracking-[0.28em] text-white/55">Contoh Furigana</div>
                <div className="mt-4 flex items-center gap-4">
                  <ruby className="furigana font-display text-4xl font-bold tracking-[-0.04em] text-white">
                    食品安全
                    <rt>しょくひんあんぜん</rt>
                  </ruby>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/72">
                  Cara baca selalu tampil di atas kanji, persis seperti buku pelajaran.
                </p>
              </div>
              <div className="rounded-[26px] border border-slate-900/10 bg-white/88 p-6">
                <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Bank Soal</div>
                <div className="font-display mt-3 text-4xl font-bold tracking-[-0.06em] text-slate-950">{allPmKotoba.length}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Kosakata dari materi & soal latihan SSW Pengolahan Makanan siap dikuiskan.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[38px] px-5 py-6 sm:px-8 sm:py-10">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Setup Session</div>
          <h2 className="font-display mt-3 text-2xl font-bold tracking-[-0.05em] text-slate-950 sm:text-3xl">Atur batch quiz Anda</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Cocok untuk quick warm-up, review tengah malam, atau sesi hafalan panjang.</p>

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
                max={allPmKotoba.length}
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
            <p className="mt-3 text-center text-sm text-slate-500">Minimal 5 soal, maksimal {allPmKotoba.length} soal.</p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={startQuiz}
              className="inline-flex w-full items-center justify-center rounded-[22px] bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_32px_-20px_rgba(15,23,42,0.82)] transition hover:-translate-y-0.5"
            >
              Mulai Quiz Sekarang
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
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Shokuhin Session Complete</div>
              <h1 className="font-display mt-3 text-4xl font-bold tracking-[-0.06em] text-slate-950 sm:text-5xl">
                Batch selesai. Lanjut review atau generate set baru.
              </h1>
            </div>
            <button
              onClick={() => handleGoHome(true)}
              className="rounded-full border border-slate-900/10 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5"
            >
              Menu Utama
            </button>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[32px] bg-slate-900 p-7 text-white shadow-[0_28px_70px_-38px_rgba(15,23,42,0.85)]">
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-white/55">Score Drop</div>
              <div className="mt-4">
                <div className="font-display text-7xl font-bold leading-none tracking-[-0.08em]">{score}</div>
                <div className="mt-2 text-xl font-semibold text-white/50">/ {questions.length}</div>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/72">
                Persentase ini merefleksikan seberapa baik Anda membaca kosakata Shokuhin Kakou dalam satu sesi acak.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] border border-slate-900/10 bg-white/90 p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Accuracy</div>
                <div className="font-display mt-2 text-4xl font-bold tracking-[-0.05em] text-slate-950">{percentage}%</div>
              </div>
              <div className="rounded-[24px] border border-slate-900/10 bg-white/90 p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Question Count</div>
                <div className="font-display mt-2 text-4xl font-bold tracking-[-0.05em] text-slate-950">{questions.length}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 h-3 overflow-hidden rounded-full bg-slate-900/8">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#11203a_0%,#ff7a59_60%,#00d7a0_100%)]"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-900/10 bg-white/90 px-5 py-4 text-sm text-slate-600">
            {saveState === 'saving' && 'Menyimpan skor ke weekly leaderboard Shokuhin...'}
            {saveState === 'saved' &&
              (leaderboardRank
                ? `Skor tersimpan di leaderboard Shokuhin. Posisi Anda saat ini: #${leaderboardRank}.`
                : 'Skor tersimpan di leaderboard Shokuhin minggu ini.')}
            {saveState === 'error' && 'Batch selesai, tetapi leaderboard Shokuhin belum berhasil diperbarui.'}
            {saveState === 'idle' && 'Menyiapkan sinkronisasi leaderboard.'}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <button
              onClick={resetQuiz}
              className="inline-flex items-center justify-center rounded-[20px] bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              Coba Lagi
            </button>
            <button
              onClick={startQuiz}
              className="inline-flex items-center justify-center rounded-[20px] border border-slate-900/10 bg-white/90 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5"
            >
              Batch Baru
            </button>
            <button
              onClick={() => handleGoHome(true)}
              className="inline-flex items-center justify-center rounded-[20px] border border-slate-900/10 bg-white/90 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5"
            >
              Kembali ke Menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const direction = currentQuestion.direction
  const answerField: AnswerField = direction === 'k2m' ? 'meaning' : 'kanji'
  const dirLabel = DIRECTION_LABELS[direction]
  const selectedOption = currentQuestion.options.find((o) => o.id === selectedAnswerId) ?? null
  const correctOption = currentQuestion.options.find((o) => o.id === currentQuestion.correctOptionId) ?? currentQuestion.entry
  const wrongOptions = currentQuestion.options.filter((o) => o.id !== currentQuestion.correctOptionId)
  const isCorrect = answered && selectedAnswerId === currentQuestion.correctOptionId
  const percentage = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className="space-y-6 pb-24">
      <section className="glass-panel relative overflow-hidden rounded-[38px] px-6 py-7 sm:px-8">
        <div
          aria-hidden="true"
          className="absolute left-[-3rem] top-[-2rem] h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,122,89,0.2),_transparent_72%)] blur-2xl"
        />
        <div className="relative grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Shokuhin Focus Mode</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
            <div className="rounded-[24px] border border-slate-900/10 bg-white/88 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Score</div>
              <div className="font-display mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950">{score}</div>
            </div>
            <div className="rounded-[24px] border border-slate-900/10 bg-white/88 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Current</div>
              <div className="font-display mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950">{currentIndex + 1}</div>
            </div>
            <div className="rounded-[24px] border border-slate-900/10 bg-white/88 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Batch</div>
              <div className="font-display mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950">{questions.length}</div>
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white">
              {dirLabel.from}
            </span>
            <span className="text-slate-400">→</span>
            <span className="rounded-full bg-orange-100 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-900">
              {dirLabel.to}
            </span>
          </div>
          <button
            onClick={() => handleGoHome()}
            className="inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5"
          >
            Menu Utama
          </button>
        </div>
      </section>

      <div className="glass-panel rounded-[30px] p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Shokuhin Flow</p>
            <h3 className="font-display mt-2 text-2xl font-bold tracking-[-0.05em] text-slate-950">Progress</h3>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-bold tracking-[-0.05em] text-slate-950">
              {currentIndex + 1}
              <span className="text-base text-slate-400"> / {questions.length}</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">question tracked</p>
          </div>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-900/8">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#11203a_0%,#ff7a59_60%,#00d7a0_100%)] transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <section className="glass-panel rounded-[34px] px-5 py-6 sm:px-7 sm:py-8">
        <div className="mb-3 text-center text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
          {direction === 'k2m' ? 'Apa arti kosakata ini?' : 'Pilih kanji yang tepat'}
        </div>
        <div className="mb-8 flex min-h-[120px] items-center justify-center text-center">
          {direction === 'k2m' ? (
            <Furigana
              entry={currentQuestion.entry}
              className="furigana-question font-display text-5xl font-bold leading-[1.35] tracking-[-0.06em] text-slate-950 md:text-7xl"
            />
          ) : (
            <div className="font-display text-3xl font-bold leading-tight tracking-[-0.04em] text-slate-950 md:text-4xl">
              {currentQuestion.entry.meaning}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswerId === option.id
            const isRight = option.id === currentQuestion.correctOptionId

            let buttonClass = 'rounded-[24px] border p-4 text-left transition-all duration-200 md:p-5 '

            if (answered) {
              if (isRight) buttonClass += 'border-emerald-400 bg-emerald-50 text-emerald-950 kanji-choice kanji-choice--correct'
              else if (isSelected) buttonClass += 'border-rose-400 bg-rose-50 text-rose-950 kanji-choice kanji-choice--wrong'
              else buttonClass += 'border-slate-900/8 bg-white/70 text-slate-400 opacity-60 kanji-choice kanji-choice--idle'
            } else {
              buttonClass += 'border-slate-900/10 bg-white/90 text-slate-800 hover:-translate-y-0.5 hover:border-orange-300 kanji-choice kanji-choice--idle'
            }

            return (
              <button
                key={`${currentQuestion.id}-${option.id}-${index}`}
                onClick={() => handleAnswer(option.id)}
                disabled={answered}
                className={buttonClass}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-slate-900/6 text-xs font-black text-slate-700">
                    {answered ? (isRight ? '✓' : isSelected ? '✕' : String.fromCharCode(65 + index)) : String.fromCharCode(65 + index)}
                  </span>
                  {answerField === 'kanji' ? (
                    <Furigana
                      entry={option}
                      className="font-display text-2xl font-bold leading-[1.5] tracking-[-0.04em] md:text-3xl"
                    />
                  ) : (
                    <span className="text-sm font-semibold leading-6 md:text-base">{option.meaning}</span>
                  )}
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
            <div className={`mb-5 text-[11px] font-black uppercase tracking-[0.3em] ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isCorrect ? 'Jawaban Benar' : 'Jawaban Salah'}
            </div>

            <div className="space-y-5">
              <div>
                <div className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Jawaban yang benar</div>
                <FeedbackRow entry={correctOption} tone="correct" />
              </div>
              <div>
                <div className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Jawaban yang salah</div>
                <div className="space-y-2">
                  {wrongOptions.map((option) => (
                    <FeedbackRow
                      key={`feedback-${currentQuestion.id}-${option.id}`}
                      entry={option}
                      tone="wrong"
                      badge={!isCorrect && selectedOption?.id === option.id ? 'Pilihan Anda' : undefined}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="sticky bottom-4 z-30">
        <div className="glass-panel rounded-[30px] p-3 sm:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Navigation Deck</div>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              <button
                onClick={() => handleGoHome()}
                className="inline-flex items-center justify-center rounded-[18px] border border-slate-900/10 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5"
              >
                Menu Utama
              </button>
              {answered && (
                <button
                  onClick={nextQuestion}
                  className="inline-flex items-center justify-center rounded-[18px] bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_-18px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5"
                >
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
