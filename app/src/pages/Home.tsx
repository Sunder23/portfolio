import { useEffect, useState } from 'react'
import { getProfile } from '@/lib/data'
import type { Profile } from '@/types'

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    getProfile().then(setProfile)
  }, [])

  return (
    <div className="flex min-h-svh items-center justify-center">
      <h1 className="text-2xl font-medium">{profile?.name || 'Home'}</h1>
    </div>
  )
}
