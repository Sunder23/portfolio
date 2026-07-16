import { createContext, useContext, useState, type ReactNode } from 'react'
import { clearPat, getStoredPat, storePat } from '@/admin/pat'

interface AdminAuthValue {
  token: string | null
  setToken: (token: string) => void
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getStoredPat())

  function setToken(next: string) {
    storePat(next)
    setTokenState(next)
  }

  function logout() {
    clearPat()
    setTokenState(null)
    console.info('[admin/auth] session cleared')
  }

  return <AdminAuthContext.Provider value={{ token, setToken, logout }}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return ctx
}
