import { useCallback, useRef } from 'react'

// Shared "has this diverged from what was loaded/saved" check used by useEditorData
// and ProjectForm to disable Save when there's nothing new to persist.
export function useDirtyState<T>() {
  const baselineRef = useRef<string | null>(null)

  const capture = useCallback((value: T) => {
    baselineRef.current = JSON.stringify(value)
  }, [])

  function isDirty(current: T): boolean {
    return baselineRef.current !== null && JSON.stringify(current) !== baselineRef.current
  }

  return { capture, isDirty }
}
