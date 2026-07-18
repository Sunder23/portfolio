import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { isPendingImage } from '@/admin/lib/resolvePendingImages'

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

// Global staging store for the admin's "Save all" flow — keyed by the GitHub file path (or a
// synthetic key for not-yet-created entities like a new project). Lives above <Outlet/> in
// AdminLayout so a draft survives navigating between editors, and is mirrored to localStorage
// (see persistEntries/loadInitialEntries below) so it also survives a reload or closed tab.
const STORAGE_KEY = 'admin-draft-v1'

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.readAsDataURL(blob)
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = /data:(.*);base64/.exec(header)?.[1] ?? 'application/octet-stream'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

// A PendingImage's `blob` isn't JSON-serializable, so it's base64-encoded for localStorage and
// rebuilt into a fresh Blob (with a fresh object URL — the old one dies with the page) on read.
// Walks the same kind of arbitrary data/projects/*.json-shaped tree as resolvePendingImages.ts.
async function serializeForStorage(value: unknown): Promise<unknown> {
  if (isPendingImage(value)) {
    return { __pendingImageDataUrl: await blobToDataUrl(value.blob) }
  }
  if (Array.isArray(value)) {
    return Promise.all(value.map(serializeForStorage))
  }
  if (value !== null && typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value as Record<string, unknown>).map(async ([k, v]) => [k, await serializeForStorage(v)] as const),
    )
    return Object.fromEntries(entries)
  }
  return value
}

function deserializeFromStorage(value: unknown): unknown {
  if (value !== null && typeof value === 'object' && '__pendingImageDataUrl' in value) {
    const blob = dataUrlToBlob((value as { __pendingImageDataUrl: string }).__pendingImageDataUrl)
    return { blob, previewUrl: URL.createObjectURL(blob) }
  }
  if (Array.isArray(value)) {
    return value.map(deserializeFromStorage)
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, deserializeFromStorage(v)]))
  }
  return value
}

function loadInitialEntries(): Record<string, DraftEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, DraftEntry>
    const restored: Record<string, DraftEntry> = {}
    for (const [path, entry] of Object.entries(parsed)) {
      restored[path] = { data: deserializeFromStorage(entry.data), baseline: entry.baseline }
    }
    console.info(`[admin/draft] restored ${Object.keys(restored).length} entries from localStorage`)
    return restored
  } catch (err) {
    console.error('[admin/draft] failed to restore drafts from localStorage', err)
    return {}
  }
}

async function persistEntries(entries: Record<string, DraftEntry>): Promise<void> {
  try {
    if (Object.keys(entries).length === 0) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    const serializable: Record<string, DraftEntry> = {}
    for (const [path, entry] of Object.entries(entries)) {
      serializable[path] = { data: await serializeForStorage(entry.data), baseline: entry.baseline }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
    console.info(`[admin/draft] persisted ${Object.keys(serializable).length} entries to localStorage`)
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      console.error('[admin/draft] localStorage quota exceeded, drafts will not survive a reload this session', err)
      toast.error('Черновик слишком большой для сохранения между перезагрузками (много несохранённых картинок). Правки видны, пока открыта вкладка.')
      return
    }
    console.error('[admin/draft] failed to persist drafts to localStorage', err)
  }
}

export function AdminDraftProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, DraftEntry>>(loadInitialEntries)
  const flushers = useRef<Record<string, FlushFn>>({})

  useEffect(() => {
    void persistEntries(entries)
  }, [entries])

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

  // [FIX] Used to unconditionally overwrite data+baseline on every call, so re-mounting any
  // consumer of a path — including a read-only one, like ProjectForm loading taxonomies.json
  // just to populate its dropdowns — refetched from GitHub and wiped an in-progress, unsaved
  // draft for that same path (e.g. editing Taxonomies, then navigating to "Add project" and
  // back). A baseline now belongs to the first load of a session only; an existing entry
  // (dirty or not) is left alone until it's explicitly cleared via clearEntry (saved or the
  // tab reloaded past a quota failure), matching what Save All already assumes.
  const captureBaseline = useCallback(<T,>(path: string, data: T) => {
    setEntries((prev) => {
      if (prev[path] !== undefined) {
        console.info(`[admin/draft] baseline already present for ${path}, keeping in-progress draft`)
        return prev
      }
      return { ...prev, [path]: { data, baseline: JSON.stringify(data) } }
    })
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
