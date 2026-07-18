import { useEffect, useState } from 'react'

// Shared "fetch once on mount" pattern used by every public page (Home, About,
// Projects, ProjectDetail) that reads through lib/data.ts.
export function useAsyncData<T>(fetcher: () => Promise<T>): T | null {
  const [data, setData] = useState<T | null>(null)

  useEffect(() => {
    fetcher().then(setData)
  }, [fetcher])

  return data
}
