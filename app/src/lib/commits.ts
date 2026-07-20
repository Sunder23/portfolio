import type { CommitActivityWeek, CommitSummary } from '@/types'
import type { Locale } from '@/lib/locale'

// Public repo — GitHub's REST API allows unauthenticated reads, no PAT needed.
// Not to be confused with admin/lib/github.ts (the authenticated Contents-API write client).
const REPO = 'Sunder23/portfolio'

interface GithubCommitResponse {
  sha: string
  html_url: string
  commit: {
    message: string
    author: { date: string }
  }
}

export async function getRecentCommits(): Promise<CommitSummary[]> {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=5`)
    if (!response.ok) {
      console.error('[commits] failed to load recent commits', response.status, response.statusText)
      return []
    }

    const data = (await response.json()) as GithubCommitResponse[]
    const commits: CommitSummary[] = data.map((item) => ({
      shortSha: item.sha.slice(0, 7),
      message: item.commit.message.split('\n')[0],
      date: item.commit.author.date,
      url: item.html_url,
    }))

    console.debug('[commits] loaded recent commits', { count: commits.length })
    return commits
  } catch (error) {
    console.error('[commits] failed to load recent commits', error)
    return []
  }
}

const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

export function formatRelativeCommitDate(isoDate: string, locale: Locale): string {
  const diffSeconds = (new Date(isoDate).getTime() - Date.now()) / 1000
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (Math.abs(diffSeconds) < HOUR) {
    return formatter.format(Math.round(diffSeconds / MINUTE), 'minute')
  }
  if (Math.abs(diffSeconds) < DAY) {
    return formatter.format(Math.round(diffSeconds / HOUR), 'hour')
  }
  return formatter.format(Math.round(diffSeconds / DAY), 'day')
}

interface GithubCommitActivityResponse {
  week: number
  days: number[]
}

// GitHub returns 202 (empty body) on the first request while it computes stats for a repo —
// not an error, so we wait and retry once before giving up.
const STATS_RETRY_DELAY_MS = 1500

async function fetchCommitActivityOnce(): Promise<CommitActivityWeek[] | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO}/stats/commit_activity`)

    if (response.status === 202) {
      console.debug('[commits] commit activity stats are still being computed by GitHub, will retry once')
      return null
    }

    if (!response.ok) {
      console.error('[commits] failed to load commit activity', response.status, response.statusText)
      return []
    }

    const data = (await response.json()) as GithubCommitActivityResponse[]
    const weeks: CommitActivityWeek[] = data.map((entry) => ({
      weekStart: new Date(entry.week * 1000).toISOString(),
      days: entry.days,
    }))

    console.debug('[commits] loaded commit activity', { weeks: weeks.length })
    return weeks
  } catch (error) {
    console.error('[commits] failed to load commit activity', error)
    return []
  }
}

export async function getCommitActivity(): Promise<CommitActivityWeek[]> {
  const firstAttempt = await fetchCommitActivityOnce()
  if (firstAttempt !== null) return firstAttempt

  await new Promise((resolve) => setTimeout(resolve, STATS_RETRY_DELAY_MS))
  const secondAttempt = await fetchCommitActivityOnce()
  return secondAttempt ?? []
}
