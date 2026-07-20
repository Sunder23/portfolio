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

// GitHub's `stats/commit_activity` endpoint computes results asynchronously and can return
// 202 (empty) for an unbounded amount of time on a cold cache — observed to still be 202 after
// more than a minute of polling on this repo. Rather than depend on that, we derive the same
// weeks x days grid ourselves from the plain `commits` endpoint (same one getRecentCommits uses),
// which is small and reliable for a solo-dev repo (a few dozen to a few hundred commits/year).
const WEEKS_TO_SHOW = 52
const MAX_COMMIT_PAGES = 5
const DAY_MS = DAY * 1000

function parseNextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null
  const nextPart = linkHeader.split(',').find((part) => part.includes('rel="next"'))
  if (!nextPart) return null
  const match = nextPart.match(/<([^>]+)>/)
  return match ? match[1] : null
}

async function fetchCommitDatesSince(sinceIso: string): Promise<string[]> {
  const dates: string[] = []
  let url: string | null = `https://api.github.com/repos/${REPO}/commits?per_page=100&since=${sinceIso}`

  for (let page = 0; url && page < MAX_COMMIT_PAGES; page += 1) {
    const response: Response = await fetch(url)
    if (!response.ok) {
      throw new Error(`GitHub commits request failed with status ${response.status}`)
    }

    const data = (await response.json()) as { commit: { author: { date: string } } }[]
    dates.push(...data.map((item) => item.commit.author.date))
    url = parseNextPageUrl(response.headers.get('link'))
  }

  return dates
}

function weekStartOf(date: Date): Date {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  start.setUTCDate(start.getUTCDate() - start.getUTCDay())
  return start
}

export async function getCommitActivity(): Promise<CommitActivityWeek[]> {
  try {
    const since = new Date(Date.now() - WEEKS_TO_SHOW * 7 * DAY_MS)
    const commitDates = await fetchCommitDatesSince(since.toISOString())

    const firstWeekStart = weekStartOf(since)
    const weeks: CommitActivityWeek[] = Array.from({ length: WEEKS_TO_SHOW + 1 }, (_, index) => ({
      weekStart: new Date(firstWeekStart.getTime() + index * 7 * DAY_MS).toISOString(),
      days: [0, 0, 0, 0, 0, 0, 0],
    }))

    for (const dateStr of commitDates) {
      const date = new Date(dateStr)
      const weekIndex = Math.round((weekStartOf(date).getTime() - firstWeekStart.getTime()) / (7 * DAY_MS))
      if (weekIndex >= 0 && weekIndex < weeks.length) {
        weeks[weekIndex].days[date.getUTCDay()] += 1
      }
    }

    console.debug('[commits] built commit activity from commit history', {
      weeks: weeks.length,
      commits: commitDates.length,
    })
    return weeks
  } catch (error) {
    console.error('[commits] failed to build commit activity', error)
    return []
  }
}
