import fs from 'fs'
import path from 'path'
import { resolveWebsitePath } from './project-paths'

export type QuizCategoryKey = 'moji_goi' | 'kaiwa_hyougen' | 'choukai' | 'dokkai'

export const QUIZ_CATEGORY_ORDER: QuizCategoryKey[] = [
  'moji_goi',
  'kaiwa_hyougen',
  'choukai',
  'dokkai',
]

export const QUIZ_CATEGORY_LABELS: Record<QuizCategoryKey, string> = {
  moji_goi: 'Kosakata (Moji Goi)',
  kaiwa_hyougen: 'Percakapan dan Ungkapan (Kaiwa / Hyougen)',
  choukai: 'Listening (Choukai)',
  dokkai: 'Reading (Dokkai)',
}

export interface QuizQuestion {
  question_id: string
  form_name: string
  category?: string
  categoryKey?: QuizCategoryKey
  question: string
  choices: Array<{ text: string; image?: { url: string; path: string } }>
  images: Array<{ url: string; path: string; index: number }>
  ocr_text?: string
  audio_url: string
  audio: string
  hash: string
  created_at: string
  correctAnswer?: string | number
}

let cachedQuestions: QuizQuestion[] | null = null
let cachedNormalizedQuestions: QuizQuestion[] | null = null

const QUESTION_PATH = resolveWebsitePath('output', 'all_questions.json')

export function loadQuestions(): QuizQuestion[] {
  if (cachedQuestions) return cachedQuestions

  if (!fs.existsSync(QUESTION_PATH)) {
    return []
  }

  try {
    const data = fs.readFileSync(QUESTION_PATH, 'utf-8')
    cachedQuestions = JSON.parse(data)
    return cachedQuestions || []
  } catch (error) {
    console.error('Failed to load questions:', error)
    return []
  }
}

function parseQuestionSequence(questionId: string) {
  const match = questionId.match(/_(\d+)_/)
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

function parseDisplayedQuestionNumber(text: string) {
  const match = text.match(/^\s*(\d+)\s*[.)．]?/)
  return match ? Number(match[1]) : null
}

function normalizeStoredCategory(category?: string): QuizCategoryKey | null {
  const value = (category || '').toLowerCase().trim()

  if (!value || value === 'general') return null
  if (value.includes('moji') || value.includes('goi') || value.includes('kosakata')) return 'moji_goi'
  if (value.includes('kaiwa') || value.includes('hyougen') || value.includes('ungkapan')) return 'kaiwa_hyougen'
  if (value.includes('choukai') || value.includes('chokai') || value.includes('listening')) return 'choukai'
  if (value.includes('dokkai') || value.includes('reading') || value.includes('bacaan')) return 'dokkai'

  return null
}

function buildSectionText(section: QuizQuestion[]) {
  return section.map(question => question.question || '').join(' ').toLowerCase()
}

function isAudioSection(section: QuizQuestion[]) {
  const blob = buildSectionText(section)

  return (
    section.some(question => Boolean(question.audio)) ||
    blob.includes('audio') ||
    blob.includes('choukai') ||
    blob.includes('cokai') ||
    blob.includes('listening')
  )
}

function isDialogueSection(section: QuizQuestion[]) {
  const blob = buildSectionText(section)

  return (
    blob.includes('percakapan') ||
    blob.includes('ungkapan') ||
    blob.includes('kaiwa') ||
    blob.includes('a :') ||
    blob.includes('b :') ||
    blob.includes('a.') ||
    blob.includes('b.')
  )
}

function isReadingSection(section: QuizQuestion[]) {
  const blob = buildSectionText(section)

  return (
    blob.includes('dokkai') ||
    blob.includes('bacaan') ||
    blob.includes('untuk 2 soal') ||
    blob.includes('untuk 3 soal') ||
    blob.includes('brosur') ||
    blob.includes('jadwal') ||
    blob.includes('pengumuman') ||
    blob.includes('denah') ||
    section.some(question => (question.images || []).length > 0 && (question.question || '').length > 80)
  )
}

function splitFormIntoSections(questions: QuizQuestion[]) {
  const sections: QuizQuestion[][] = []
  let currentSection: QuizQuestion[] = []
  let previousLead: number | null = null

  for (const question of questions) {
    const leadNumber = parseDisplayedQuestionNumber(question.question)
    let startsNewSection = false

    if (currentSection.length > 0 && leadNumber !== null && previousLead !== null) {
      if (leadNumber === 1 && previousLead > 1) {
        startsNewSection = true
      } else if (leadNumber <= 2 && previousLead >= 8 && previousLead - leadNumber >= 5) {
        startsNewSection = true
      }
    }

    if (startsNewSection) {
      sections.push(currentSection)
      currentSection = []
    }

    currentSection.push(question)

    if (leadNumber !== null) {
      previousLead = leadNumber
    }
  }

  if (currentSection.length > 0) {
    sections.push(currentSection)
  }

  return sections
}

function categorizeSections(
  sections: QuizQuestion[][],
  storedCategories: Array<QuizCategoryKey | null>
): QuizCategoryKey[] {
  if (sections.length >= 4) {
    return sections.map((_, index) => QUIZ_CATEGORY_ORDER[Math.min(index, QUIZ_CATEGORY_ORDER.length - 1)])
  }

  if (sections.length === 3) {
    const audioIndex = sections.findIndex(isAudioSection)

    if (audioIndex === 2) {
      return ['moji_goi', 'kaiwa_hyougen', 'choukai']
    }

    if (audioIndex === 1) {
      return ['moji_goi', 'choukai', 'dokkai']
    }

    if (audioIndex === 0) {
      return ['choukai', 'kaiwa_hyougen', 'dokkai']
    }

    return ['moji_goi', 'kaiwa_hyougen', 'dokkai']
  }

  if (sections.length === 2) {
    if (isAudioSection(sections[1])) {
      return ['moji_goi', 'choukai']
    }

    if (isAudioSection(sections[0])) {
      return ['choukai', 'dokkai']
    }

    if (isReadingSection(sections[1])) {
      return ['kaiwa_hyougen', 'dokkai']
    }

    return ['moji_goi', 'dokkai']
  }

  if (sections.length === 1) {
    const storedCategory = storedCategories.find(Boolean)
    if (storedCategory) return [storedCategory]

    if (isAudioSection(sections[0])) return ['choukai']
    if (isReadingSection(sections[0])) return ['dokkai']
    if (isDialogueSection(sections[0])) return ['kaiwa_hyougen']

    return ['moji_goi']
  }

  return []
}

export function normalizeQuestions() {
  if (cachedNormalizedQuestions) return cachedNormalizedQuestions

  const byForm = new Map<string, QuizQuestion[]>()

  for (const question of loadQuestions()) {
    const list = byForm.get(question.form_name) || []
    list.push(question)
    byForm.set(question.form_name, list)
  }

  const normalized: QuizQuestion[] = []

  for (const formQuestions of byForm.values()) {
    const orderedQuestions = [...formQuestions].sort(
      (left, right) => parseQuestionSequence(left.question_id) - parseQuestionSequence(right.question_id)
    )

    const sections = splitFormIntoSections(orderedQuestions)
    const storedCategories = sections.map(section =>
      section.map(question => normalizeStoredCategory(question.category)).find(Boolean) || null
    )
    const derivedCategories = categorizeSections(sections, storedCategories)

    sections.forEach((section, sectionIndex) => {
      const categoryKey = derivedCategories[sectionIndex] || storedCategories[sectionIndex] || 'moji_goi'

      for (const question of section) {
        normalized.push({
          ...question,
          categoryKey,
          category: QUIZ_CATEGORY_LABELS[categoryKey],
        })
      }
    })
  }

  cachedNormalizedQuestions = normalized
  return normalized
}

function hashCode(input: string) {
  let hash = 0

  for (let index = 0; index < input.length; index += 1) {
    const char = input.charCodeAt(index)
    hash = (hash << 5) - hash + char
    hash |= 0
  }

  return Math.abs(hash)
}

function createSeededRandom(seedInput: string) {
  let seed = hashCode(seedInput) || 1

  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

function shuffleWithSeed<T>(items: T[], seedInput: string) {
  const random = createSeededRandom(seedInput)
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]]
  }

  return shuffled
}

export function buildStructuredQuiz(sessionId: string, perCategoryCount = 15) {
  const normalizedQuestions = normalizeQuestions()
  const grouped = new Map<QuizCategoryKey, QuizQuestion[]>()

  for (const category of QUIZ_CATEGORY_ORDER) {
    grouped.set(category, [])
  }

  for (const question of normalizedQuestions) {
    const category = question.categoryKey || normalizeStoredCategory(question.category) || 'moji_goi'
    grouped.get(category)?.push(question)
  }

  const selectedQuestions: QuizQuestion[] = []

  for (const category of QUIZ_CATEGORY_ORDER) {
    const pool = grouped.get(category) || []
    const shuffledPool = shuffleWithSeed(pool, `${sessionId}:${category}`)
    selectedQuestions.push(...shuffledPool.slice(0, Math.min(perCategoryCount, shuffledPool.length)))
  }

  return selectedQuestions
}

export function getNormalizedCategoryCounts() {
  const counts: Record<QuizCategoryKey, number> = {
    moji_goi: 0,
    kaiwa_hyougen: 0,
    choukai: 0,
    dokkai: 0,
  }

  for (const question of normalizeQuestions()) {
    const category = question.categoryKey || 'moji_goi'
    counts[category] += 1
  }

  return counts
}

export function getStructuredAvailability(perCategoryCount = 15) {
  const availableCounts = getNormalizedCategoryCounts()
  const selectedCounts: Record<QuizCategoryKey, number> = {
    moji_goi: Math.min(perCategoryCount, availableCounts.moji_goi),
    kaiwa_hyougen: Math.min(perCategoryCount, availableCounts.kaiwa_hyougen),
    choukai: Math.min(perCategoryCount, availableCounts.choukai),
    dokkai: Math.min(perCategoryCount, availableCounts.dokkai),
  }

  const total = Object.values(selectedCounts).reduce((sum, count) => sum + count, 0)

  return {
    targetPerCategory: perCategoryCount,
    availableCounts,
    selectedCounts,
    total,
  }
}
