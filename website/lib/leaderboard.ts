import { Buffer } from 'buffer'
import fs from 'fs/promises'
import path from 'path'
import { resolveWebsitePath } from './project-paths'

export type LeaderboardMode = 'jft' | 'kanji'

type ModeStats = {
  attempts: number
  totalQuestionsAnswered: number
  totalCorrectAnswers: number
  bestPercentage: number
  bestCorrectAnswers: number
  bestQuestions: number
  lastPlayedAt: string | null
}

type PlayerRecord = {
  id: string
  name: string
  updatedAt: string
  stats: Record<LeaderboardMode, ModeStats>
}

type LeaderboardSnapshot = {
  version: number
  cycleKey: string
  cycleLabel: string
  resetAt: string
  updatedAt: string
  players: PlayerRecord[]
}

type PublicModeStats = ModeStats & {
  averagePercentage: number
}

export type RankedEntry = {
  rank: number
  id: string
  name: string
  attempts: number
  totalQuestionsAnswered: number
  averagePercentage: number
  bestPercentage: number
  bestCorrectAnswers: number
  bestQuestions: number
  lastPlayedAt: string | null
}

export type LeaderboardView = {
  cycleKey: string
  cycleLabel: string
  resetAt: string
  updatedAt: string
  totalPlayers: number
  source: 'github' | 'local'
  leaderboards: Record<LeaderboardMode, RankedEntry[]>
  player: {
    id: string
    name: string
    jft: PublicModeStats
    kanji: PublicModeStats
  } | null
}

type SubmissionPayload = {
  name: string
  mode: LeaderboardMode
  score: number
  totalQuestions: number
  answeredCount?: number
}

const LEADERBOARD_FILE = resolveWebsitePath('output', 'leaderboard.json')
const DEFAULT_REPO_PATH = 'qcxint-crypto/web-JFT'
const DEFAULT_LEADERBOARD_PATH = 'website/output/leaderboard.json'
const DEFAULT_SOURCE_BRANCH = (process.env.GITHUB_BRANCH || 'main').trim() || 'main'
const DEFAULT_LEADERBOARD_BRANCH =
  (process.env.LEADERBOARD_GITHUB_BRANCH || 'leaderboard-data').trim() || 'leaderboard-data'
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000

function parseEnvLine(line: string) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
    return null
  }

  const separatorIndex = trimmed.indexOf('=')
  const key = trimmed.slice(0, separatorIndex).trim()
  let value = trimmed.slice(separatorIndex + 1).trim()

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }

  return { key, value }
}

async function hydrateRootEnv() {
  const candidatePaths = [
    resolveWebsitePath('.env'),
    path.resolve(resolveWebsitePath('..'), '.env'),
  ]

  for (const candidatePath of candidatePaths) {
    try {
      const raw = await fs.readFile(candidatePath, 'utf8')

      for (const line of raw.split(/\r?\n/)) {
        const parsed = parseEnvLine(line)
        if (!parsed) continue

        if (!process.env[parsed.key]) {
          process.env[parsed.key] = parsed.value
        }
      }
    } catch {
      continue
    }
  }
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function roundToSingle(value: number) {
  return Math.round(value * 10) / 10
}

function collapseWhitespace(input: string) {
  return input.replace(/\s+/g, ' ').trim()
}

function sanitizeName(input: string) {
  return collapseWhitespace(input.replace(/[\u0000-\u001f\u007f]/g, '')).slice(0, 32)
}

function createPlayerId(name: string) {
  const normalized = name
    .toLocaleLowerCase('en-US')
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || `player-${Date.now()}`
}

function createEmptyStats(): ModeStats {
  return {
    attempts: 0,
    totalQuestionsAnswered: 0,
    totalCorrectAnswers: 0,
    bestPercentage: 0,
    bestCorrectAnswers: 0,
    bestQuestions: 0,
    lastPlayedAt: null,
  }
}

function createWeekCycle(now = new Date()) {
  const jakartaDate = new Date(now.getTime() + JAKARTA_OFFSET_MS)
  const dayIndex = (jakartaDate.getUTCDay() + 6) % 7
  const cycleStart = new Date(jakartaDate)
  cycleStart.setUTCHours(0, 0, 0, 0)
  cycleStart.setUTCDate(cycleStart.getUTCDate() - dayIndex)

  const resetAt = new Date(cycleStart)
  resetAt.setUTCDate(resetAt.getUTCDate() + 7)

  const yyyy = cycleStart.getUTCFullYear()
  const mm = String(cycleStart.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(cycleStart.getUTCDate()).padStart(2, '0')

  return {
    cycleKey: `${yyyy}-${mm}-${dd}`,
    cycleLabel: `Weekly reset ${dd}/${mm}/${yyyy}`,
    resetAt: new Date(resetAt.getTime() - JAKARTA_OFFSET_MS).toISOString(),
  }
}

function createEmptySnapshot(now = new Date()): LeaderboardSnapshot {
  const cycle = createWeekCycle(now)

  return {
    version: 1,
    cycleKey: cycle.cycleKey,
    cycleLabel: cycle.cycleLabel,
    resetAt: cycle.resetAt,
    updatedAt: now.toISOString(),
    players: [],
  }
}

function normalizeStats(stats: Partial<ModeStats> | null | undefined): ModeStats {
  const safeStats = stats || {}

  return {
    attempts: Number(safeStats.attempts) || 0,
    totalQuestionsAnswered: Number(safeStats.totalQuestionsAnswered) || 0,
    totalCorrectAnswers: Number(safeStats.totalCorrectAnswers) || 0,
    bestPercentage: Number(safeStats.bestPercentage) || 0,
    bestCorrectAnswers: Number(safeStats.bestCorrectAnswers) || 0,
    bestQuestions: Number(safeStats.bestQuestions) || 0,
    lastPlayedAt: safeStats.lastPlayedAt || null,
  }
}

function normalizeSnapshot(snapshot: unknown, now = new Date()): LeaderboardSnapshot {
  const empty = createEmptySnapshot(now)

  if (!snapshot || typeof snapshot !== 'object') {
    return empty
  }

  const candidate = snapshot as Partial<LeaderboardSnapshot>
  if (candidate.cycleKey !== empty.cycleKey) {
    return empty
  }

  return {
    version: 1,
    cycleKey: empty.cycleKey,
    cycleLabel: empty.cycleLabel,
    resetAt: empty.resetAt,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : now.toISOString(),
    players: Array.isArray(candidate.players)
      ? candidate.players.map((player) => ({
          id: String(player.id || createPlayerId(String(player.name || 'anonymous'))),
          name: sanitizeName(String(player.name || 'anonymous')) || 'anonymous',
          updatedAt: typeof player.updatedAt === 'string' ? player.updatedAt : now.toISOString(),
          stats: {
            jft: normalizeStats(player.stats?.jft),
            kanji: normalizeStats(player.stats?.kanji),
          },
        }))
      : [],
  }
}

function extractRepoPath(repoUrl?: string) {
  const value = (repoUrl || '').trim()
  if (!value) return DEFAULT_REPO_PATH

  if (value.startsWith('git@github.com:')) {
    return value.split(':', 2)[1].replace(/\.git$/, '').replace(/^\/+|\/+$/g, '')
  }

  const marker = 'github.com/'
  if (value.includes(marker)) {
    return value.split(marker, 2)[1].replace(/\.git$/, '').replace(/^\/+|\/+$/g, '')
  }

  if (value.split('/').length === 2) {
    return value.replace(/\.git$/, '').replace(/^\/+|\/+$/g, '')
  }

  return DEFAULT_REPO_PATH
}

function buildPublicStats(stats: ModeStats): PublicModeStats {
  const totalQuestionsAnswered = Math.max(0, stats.totalQuestionsAnswered)
  const totalCorrectAnswers = clampNumber(stats.totalCorrectAnswers, 0, totalQuestionsAnswered || stats.totalCorrectAnswers)

  return {
    ...stats,
    totalQuestionsAnswered,
    totalCorrectAnswers,
    averagePercentage:
      totalQuestionsAnswered > 0 ? roundToSingle((totalCorrectAnswers / totalQuestionsAnswered) * 100) : 0,
  }
}

function buildRankedEntries(players: PlayerRecord[], mode: LeaderboardMode) {
  return players
    .map((player) => ({
      id: player.id,
      name: player.name,
      ...buildPublicStats(player.stats[mode]),
    }))
    .filter((player) => player.attempts > 0)
    .sort((left, right) => {
      if (right.bestPercentage !== left.bestPercentage) return right.bestPercentage - left.bestPercentage
      if (right.bestCorrectAnswers !== left.bestCorrectAnswers) return right.bestCorrectAnswers - left.bestCorrectAnswers
      if (right.bestQuestions !== left.bestQuestions) return right.bestQuestions - left.bestQuestions
      if (right.averagePercentage !== left.averagePercentage) return right.averagePercentage - left.averagePercentage
      if (right.totalQuestionsAnswered !== left.totalQuestionsAnswered) {
        return right.totalQuestionsAnswered - left.totalQuestionsAnswered
      }
      return left.name.localeCompare(right.name)
    })
    .map((player, index) => ({
      rank: index + 1,
      ...player,
    }))
}

function createView(snapshot: LeaderboardSnapshot, playerName?: string, source: 'github' | 'local' = 'local'): LeaderboardView {
  const leaderboards = {
    jft: buildRankedEntries(snapshot.players, 'jft').slice(0, 20),
    kanji: buildRankedEntries(snapshot.players, 'kanji').slice(0, 20),
  }

  const normalizedName = sanitizeName(playerName || '')
  const playerId = normalizedName ? createPlayerId(normalizedName) : ''
  const playerRecord = snapshot.players.find((player) => player.id === playerId) || null

  return {
    cycleKey: snapshot.cycleKey,
    cycleLabel: snapshot.cycleLabel,
    resetAt: snapshot.resetAt,
    updatedAt: snapshot.updatedAt,
    totalPlayers: snapshot.players.filter((player) => player.stats.jft.attempts > 0 || player.stats.kanji.attempts > 0).length,
    source,
    leaderboards,
    player: playerRecord
      ? {
          id: playerRecord.id,
          name: playerRecord.name,
          jft: buildPublicStats(playerRecord.stats.jft),
          kanji: buildPublicStats(playerRecord.stats.kanji),
        }
      : null,
  }
}

async function readLocalSnapshot() {
  try {
    const raw = await fs.readFile(LEADERBOARD_FILE, 'utf8')
    return normalizeSnapshot(JSON.parse(raw))
  } catch {
    return createEmptySnapshot()
  }
}

async function writeLocalSnapshot(snapshot: LeaderboardSnapshot) {
  await fs.mkdir(path.dirname(LEADERBOARD_FILE), { recursive: true })
  await fs.writeFile(LEADERBOARD_FILE, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
}

function getGitHubConfig() {
  return {
    repoPath: extractRepoPath(process.env.LEADERBOARD_REPO_PATH || process.env.GITHUB_REPO_URL),
    token: (process.env.GITHUB_TOKEN || '').trim(),
    sourceBranch: DEFAULT_SOURCE_BRANCH,
    leaderboardBranch: DEFAULT_LEADERBOARD_BRANCH,
    filePath: (process.env.LEADERBOARD_FILE_PATH || DEFAULT_LEADERBOARD_PATH).trim() || DEFAULT_LEADERBOARD_PATH,
  }
}

async function githubRequest(url: string, init: RequestInit = {}, token = '') {
  const headers = new Headers(init.headers || {})
  headers.set('Accept', 'application/vnd.github+json')
  headers.set('Content-Type', 'application/json')
  headers.set('User-Agent', 'rananwari-jft-lab')

  if (token) {
    headers.set('Authorization', `token ${token}`)
  }

  return fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  })
}

async function ensureLeaderboardBranch(config: ReturnType<typeof getGitHubConfig>) {
  const refUrl = `https://api.github.com/repos/${config.repoPath}/git/ref/heads/${config.leaderboardBranch}`
  const existing = await githubRequest(refUrl, {}, config.token)

  if (existing.ok) {
    return config.leaderboardBranch
  }

  const sourceRefUrl = `https://api.github.com/repos/${config.repoPath}/git/ref/heads/${config.sourceBranch}`
  const sourceRef = await githubRequest(sourceRefUrl, {}, config.token)
  if (!sourceRef.ok) {
    throw new Error('Failed to read source branch for leaderboard bootstrap.')
  }

  const sourceRefJson = await sourceRef.json()
  const sourceSha = sourceRefJson?.object?.sha

  const createRefResponse = await githubRequest(
    `https://api.github.com/repos/${config.repoPath}/git/refs`,
    {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${config.leaderboardBranch}`,
        sha: sourceSha,
      }),
    },
    config.token
  )

  if (!createRefResponse.ok && createRefResponse.status !== 422) {
    throw new Error('Failed to create leaderboard branch in GitHub.')
  }

  return config.leaderboardBranch
}

async function readGithubSnapshot() {
  const config = getGitHubConfig()
  const branch = config.leaderboardBranch
  const url = `https://api.github.com/repos/${config.repoPath}/contents/${config.filePath}?ref=${encodeURIComponent(branch)}`
  const response = await githubRequest(url, {}, config.token)

  if (response.status === 404) {
    return {
      snapshot: createEmptySnapshot(),
      source: 'github' as const,
      sha: null as string | null,
      branch,
    }
  }

  if (!response.ok) {
    throw new Error(`Failed to read leaderboard from GitHub (${response.status}).`)
  }

  const payload = await response.json()
  const raw = Buffer.from(payload.content || '', 'base64').toString('utf8')

  return {
    snapshot: normalizeSnapshot(JSON.parse(raw)),
    source: 'github' as const,
    sha: typeof payload.sha === 'string' ? payload.sha : null,
    branch,
  }
}

async function writeGithubSnapshot(snapshot: LeaderboardSnapshot) {
  const config = getGitHubConfig()
  if (!config.token) {
    throw new Error('GITHUB_TOKEN is required for remote leaderboard writes.')
  }

  const branch = await ensureLeaderboardBranch(config)
  const url = `https://api.github.com/repos/${config.repoPath}/contents/${config.filePath}`
  const existing = await readGithubSnapshot()
  const content = Buffer.from(`${JSON.stringify(snapshot, null, 2)}\n`, 'utf8').toString('base64')

  const response = await githubRequest(
    url,
    {
      method: 'PUT',
      body: JSON.stringify({
        message: `Update weekly leaderboard ${new Date().toISOString()}`,
        content,
        sha: existing.sha || undefined,
        branch,
      }),
    },
    config.token
  )

  if (!response.ok) {
    throw new Error(`Failed to write leaderboard to GitHub (${response.status}).`)
  }
}

async function loadSnapshot() {
  await hydrateRootEnv()
  const config = getGitHubConfig()

  if (!config.token && process.env.NODE_ENV !== 'production') {
    return {
      snapshot: await readLocalSnapshot(),
      source: 'local' as const,
      sha: null,
      branch: 'local',
    }
  }

  if (config.repoPath) {
    try {
      return await readGithubSnapshot()
    } catch (error) {
      console.error('GitHub leaderboard read failed, falling back to local file.', error)
    }
  }

  return {
    snapshot: await readLocalSnapshot(),
    source: 'local' as const,
    sha: null,
    branch: 'local',
  }
}

async function persistSnapshot(snapshot: LeaderboardSnapshot, source: 'github' | 'local') {
  if (source === 'github') {
    try {
      await writeGithubSnapshot(snapshot)
      return 'github' as const
    } catch (error) {
      console.error('GitHub leaderboard write failed, falling back to local file.', error)
    }
  }

  await writeLocalSnapshot(snapshot)
  return 'local' as const
}

export async function getLeaderboardData(playerName?: string) {
  const { snapshot, source } = await loadSnapshot()
  return createView(snapshot, playerName, source)
}

export async function submitLeaderboardResult(payload: SubmissionPayload) {
  const playerName = sanitizeName(payload.name)
  if (playerName.length < 2) {
    throw new Error('Player name must contain at least 2 characters.')
  }

  const totalQuestions = Math.max(1, Math.round(payload.answeredCount || payload.totalQuestions))
  const score = clampNumber(Math.round(payload.score), 0, totalQuestions)
  const percentage = roundToSingle((score / totalQuestions) * 100)
  const now = new Date().toISOString()

  const loaded = await loadSnapshot()
  const snapshot = normalizeSnapshot(loaded.snapshot)
  const playerId = createPlayerId(playerName)
  const existingPlayer = snapshot.players.find((player) => player.id === playerId)

  const player =
    existingPlayer ||
    ({
      id: playerId,
      name: playerName,
      updatedAt: now,
      stats: {
        jft: createEmptyStats(),
        kanji: createEmptyStats(),
      },
    } satisfies PlayerRecord)

  player.name = playerName
  player.updatedAt = now

  const modeStats = player.stats[payload.mode]
  modeStats.attempts += 1
  modeStats.totalQuestionsAnswered += totalQuestions
  modeStats.totalCorrectAnswers += score
  modeStats.lastPlayedAt = now

  const bestShouldUpdate =
    percentage > modeStats.bestPercentage ||
    (percentage === modeStats.bestPercentage && totalQuestions > modeStats.bestQuestions) ||
    (percentage === modeStats.bestPercentage &&
      totalQuestions === modeStats.bestQuestions &&
      score > modeStats.bestCorrectAnswers)

  if (bestShouldUpdate) {
    modeStats.bestPercentage = percentage
    modeStats.bestQuestions = totalQuestions
    modeStats.bestCorrectAnswers = score
  }

  if (!existingPlayer) {
    snapshot.players.push(player)
  }

  snapshot.updatedAt = now
  const persistedSource = await persistSnapshot(snapshot, loaded.source)
  const view = createView(snapshot, playerName, persistedSource)
  const rank = view.leaderboards[payload.mode].find((entry) => entry.id === playerId)?.rank || null

  return {
    saved: true,
    source: persistedSource,
    rank,
    player: view.player,
    leaderboards: view.leaderboards,
    resetAt: view.resetAt,
  }
}
