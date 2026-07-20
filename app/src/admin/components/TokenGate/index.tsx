import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAdminAuth } from '@/admin/context/AdminAuthContext'
import { validateToken } from '@/admin/lib/github'

export default function TokenGate() {
  const { setToken } = useAdminAuth()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setValidating(true)
    // Trim before use: a trailing newline/space from copy-paste (common when a PAT is copied
    // from a password manager or terminal) makes fetch() throw when building the Authorization
    // header, which previously surfaced as a misleading "network error".
    const token = value.trim()
    console.info('[admin/TokenGate] validating token')

    try {
      const ok = await validateToken(token)
      if (ok) {
        console.info('[admin/TokenGate] validation succeeded')
        setToken(token)
      } else {
        console.warn('[admin/TokenGate] validation failed')
        setError('Неверный токен или нет доступа к репозиторию')
      }
    } catch (err) {
      console.error('[FIX:admin-token-validation] validation failed (network error)', err)
      setError('Не удалось проверить токен. Проверьте соединение и попробуйте снова')
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
        <h1 className="text-2xl font-medium">Admin</h1>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pat">GitHub fine-grained PAT</Label>
          <Input
            id="pat"
            type="password"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={error ? true : undefined}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={validating || !value}>
          {validating ? 'Проверка…' : 'Войти'}
        </Button>
      </form>
    </div>
  )
}
