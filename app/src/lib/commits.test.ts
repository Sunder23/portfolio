import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatRelativeCommitDate, getCommitActivity, getRecentCommits } from '@/lib/commits'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status })
}

describe('getRecentCommits', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('maps a successful GitHub API response into CommitSummary[]', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, [
        {
          sha: 'a3f9c2eabcdef1234567890',
          html_url: 'https://github.com/Sunder23/portfolio/commit/a3f9c2e',
          commit: {
            message: 'feat: add commits section\n\nSome longer body text.\nCo-authored-by: someone',
            author: { date: '2026-07-18T12:00:00Z' },
          },
        },
      ]),
    )

    const result = await getRecentCommits()

    expect(result).toEqual([
      {
        shortSha: 'a3f9c2e',
        message: 'feat: add commits section',
        date: '2026-07-18T12:00:00Z',
        url: 'https://github.com/Sunder23/portfolio/commit/a3f9c2e',
      },
    ])
  })

  it('returns [] instead of throwing on a non-OK response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(403, { message: 'API rate limit exceeded' }))

    const result = await getRecentCommits()

    expect(result).toEqual([])
  })

  it('returns [] instead of throwing when fetch itself rejects', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'))

    const result = await getRecentCommits()

    expect(result).toEqual([])
  })
})

function jsonResponseWithLink(status: number, body: unknown, link?: string): Response {
  return new Response(JSON.stringify(body), { status, headers: link ? { link } : undefined })
}

describe('getCommitActivity', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-20T12:00:00Z'))
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('buckets commit dates from the commits endpoint into the matching week/day cell', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, [
        // 2026-07-20 is a Monday (day index 1)
        { commit: { author: { date: '2026-07-20T09:00:00Z' } } },
        { commit: { author: { date: '2026-07-20T15:00:00Z' } } },
      ]),
    )

    const result = await getCommitActivity()

    const currentWeek = result[result.length - 1]
    expect(currentWeek.days[1]).toBe(2)
    expect(currentWeek.days.reduce((total, count) => total + count, 0)).toBe(2)
    expect(result).toHaveLength(53)
  })

  it('follows Link-header pagination across multiple pages', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponseWithLink(
          200,
          [{ commit: { author: { date: '2026-07-20T09:00:00Z' } } }],
          '<https://api.github.com/repositories/1/commits?page=2>; rel="next"',
        ),
      )
      .mockResolvedValueOnce(jsonResponse(200, [{ commit: { author: { date: '2026-07-13T09:00:00Z' } } }]))

    const result = await getCommitActivity()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const totalCommits = result.reduce((total, week) => total + week.days.reduce((t, c) => t + c, 0), 0)
    expect(totalCommits).toBe(2)
  })

  it('returns [] instead of a zeroed-out grid when the commits request fails', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { message: 'Internal Server Error' }))

    const result = await getCommitActivity()

    expect(result).toEqual([])
  })

  it('returns [] instead of throwing when fetch itself rejects', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'))

    const result = await getCommitActivity()

    expect(result).toEqual([])
  })
})

describe('formatRelativeCommitDate', () => {
  it('returns a non-empty relative string for a past date', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

    const result = formatRelativeCommitDate(threeDaysAgo, 'en')

    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('ago')
  })
})
