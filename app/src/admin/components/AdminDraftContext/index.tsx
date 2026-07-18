import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type DraftEntry<T = unknown> = { data: T; baseline: string }
export type FlushFn = (data: unknown, token: string) => Promise<void>

interface AdminDraftValue {
  getEntry<T>(path: string): T | undefined
  setEntry<T>(path: string, data: T): void
  captureBaseline<T>(path: string, data: T): void
  isDirty(path: string): boolean
  dirtyPaths: string[]
  registerFlush(path: string, fn: FlushFn): void
  getFlush(path: string): FlushFn | undefined
  clearEntry(path: string): void
  clearAll(): void
}

const AdminDraftContext = createContext<AdminDraftValue | null>(null)

// Global in-memory staging store for the admin's "Save all" flow — keyed by the
// GitHub file path (or a synthetic key for not-yet-created entities like a new
// project). Lives above <Outlet/> in AdminLayout so a draft survives navigating
// between editors, but intentionally NOT persisted anywhere else (single-user
// admin — losing an unsaved draft on tab close is an accepted tradeoff).
export function AdminDraftProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, DraftEntry>>({})
  const flushers = useRef<Record<string, FlushFn>>({})

  const getEntry = useCallback(
    <T,>(path: string): T | undefined => entries[path]?.data as T | undefined,
    [entries],
  )

  const isDirty = useCallback(
    (path: string): boolean => {
      const entry = entries[path]
      return entry !== undefined && JSON.stringify(entry.data) !== entry.baseline
    },
    [entries],
  )

  const setEntry = useCallback(<T,>(path: string, data: T) => {
    setEntries((prev) => ({ ...prev, [path]: { data, baseline: prev[path]?.baseline ?? JSON.stringify(data) } }))
    console.info(`[admin/draft] entry updated ${path}`)
  }, [])

  const captureBaseline = useCallback(<T,>(path: string, data: T) => {
    setEntries((prev) => ({ ...prev, [path]: { data, baseline: JSON.stringify(data) } }))
    console.info(`[admin/draft] baseline captured for ${path}`)
  }, [])

  const registerFlush = useCallback((path: string, fn: FlushFn) => {
    flushers.current[path] = fn
    console.info(`[admin/draft] flush registered for ${path}`)
  }, [])

  const getFlush = useCallback((path: string): FlushFn | undefined => flushers.current[path], [])

  const clearEntry = useCallback((path: string) => {
    setEntries((prev) => {
      const next = { ...prev }
      delete next[path]
      return next
    })
    delete flushers.current[path]
    console.info(`[admin/draft] cleared ${path}`)
  }, [])

  const clearAll = useCallback(() => {
    setEntries({})
    flushers.current = {}
    console.info('[admin/draft] cleared all entries')
  }, [])

  const dirtyPaths = Object.keys(entries).filter((path) => isDirty(path))

  return (
    <AdminDraftContext.Provider
      value={{ getEntry, setEntry, captureBaseline, isDirty, dirtyPaths, registerFlush, getFlush, clearEntry, clearAll }}
    >
      {children}
    </AdminDraftContext.Provider>
  )
}

export function useAdminDraft(): AdminDraftValue {
  const ctx = useContext(AdminDraftContext)
  if (!ctx) {
    throw new Error('useAdminDraft must be used within AdminDraftProvider')
  }
  return ctx
}
