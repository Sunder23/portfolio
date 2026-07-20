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

describe('getCommitActivity', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('maps a successful response into CommitActivityWeek[]', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, [{ week: 1752969600, days: [0, 1, 2, 0, 3, 0, 0] }]))

    const result = await getCommitActivity()

    expect(result).toEqual([
      { weekStart: new Date(1752969600 * 1000).toISOString(), days: [0, 1, 2, 0, 3, 0, 0] },
    ])
  })

  it('retries once and succeeds after an initial 202 (stats still computing)', async () => {
    vi.useFakeTimers()
    fetchMock
      .mockResolvedValueOnce(jsonResponse(202, {}))
      .mockResolvedValueOnce(jsonResponse(200, [{ week: 1752969600, days: [1, 0, 0, 0, 0, 0, 0] }]))

    const promise = getCommitActivity()
    await vi.advanceTimersByTimeAsync(1500)
    const result = await promise

    expect(result).toEqual([
      { weekStart: new Date(1752969600 * 1000).toISOString(), days: [1, 0, 0, 0, 0, 0, 0] },
    ])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('returns [] when GitHub returns 202 on both attempts', async () => {
    vi.useFakeTimers()
    fetchMock.mockResolvedValue(jsonResponse(202, {}))

    const promise = getCommitActivity()
    await vi.advanceTimersByTimeAsync(1500)
    const result = await promise

    expect(result).toEqual([])
  })

  it('returns [] on a non-OK, non-202 response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { message: 'Internal Server Error' }))

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
