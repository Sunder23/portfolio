import { useEffect, useState } from 'react'
import { validateToken } from '@/admin/lib/github'

export function useSessionCheck(token: string | null, logout: () => void): { checking: boolean; valid: boolean } {
  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)

  useEffect(() => {
    if (!token) {
      setChecking(false)
      setValid(false)
      return
    }

    let cancelled = false
    setChecking(true)

    validateToken(token)
      .then((ok) => {
        if (cancelled) return
        setValid(ok)
        if (!ok) {
          console.warn('[admin/useSessionCheck] stored token is no longer valid, logging out')
          logout()
        }
      })
      .catch((err) => {
        if (cancelled) return
        // fetch() throwing (offline, blocked request, DNS) means we couldn't reach GitHub at
        // all — it says nothing about whether the stored token is actually valid. Treating it
        // the same as a definitive 401 forces a working session back to TokenGate on every
        // transient network hiccup. Only a real 401 (handled in .then above and in
        // SaveAllButton's flush loop) should log the user out.
        console.error('[FIX:admin-session-network-error] could not verify stored token (network error), keeping existing session', err)
        setValid(true)
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, logout])

  return { checking, valid }
}
