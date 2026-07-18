const ADMIN_PAT_STORAGE_KEY = 'portfolio-admin-pat'

export { ADMIN_PAT_STORAGE_KEY }

export function getStoredPat(): string | null {
  return localStorage.getItem(ADMIN_PAT_STORAGE_KEY)
}

export function storePat(token: string): void {
  localStorage.setItem(ADMIN_PAT_STORAGE_KEY, token)
  console.info('[admin/pat] token stored')
}

export function clearPat(): void {
  localStorage.removeItem(ADMIN_PAT_STORAGE_KEY)
  console.info('[admin/pat] token cleared')
}
