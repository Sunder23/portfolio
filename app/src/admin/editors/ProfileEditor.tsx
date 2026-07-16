import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LocalizedField } from '@/admin/LocalizedField'
import { useAdminSave } from '@/admin/useAdminSave'
import { useAdminAuth } from '@/admin/AdminAuthContext'
import { getFile } from '@/admin/github'
import type { Profile, SocialLink } from '@/types'

const PROFILE_PATH = 'app/data/profile.json'

export default function ProfileEditor() {
  const { token } = useAdminAuth()
  const { save, saving } = useAdminSave<Profile>(PROFILE_PATH)

  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!token) return
    console.info(`[admin/ProfileEditor] loading ${PROFILE_PATH}`)
    getFile<Profile>(PROFILE_PATH, token).then(({ data }) => setProfile(data))
  }, [token])

  if (!profile) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  function updateSocial(index: number, patch: Partial<SocialLink>) {
    if (!profile) return
    const next = profile.socials.map((s, i) => (i === index ? { ...s, ...patch } : s))
    update('socials', next)
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Профиль</h2>

      <div className="flex flex-col gap-1.5">
        <Label>name</Label>
        <Input value={profile.name} onChange={(e) => update('name', e.target.value)} />
      </div>

      <LocalizedField label="title" value={profile.title} onChange={(v) => update('title', v)} />
      <LocalizedField label="bio" value={profile.bio} onChange={(v) => update('bio', v)} multiline withPreview />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>location</Label>
          <Input value={profile.location} onChange={(e) => update('location', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>email</Label>
          <Input value={profile.email} onChange={(e) => update('email', e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>avatar</Label>
        <Input value={profile.avatar} onChange={(e) => update('avatar', e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>socials</Label>
        {profile.socials.map((social, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="platform"
              value={social.platform}
              onChange={(e) => updateSocial(index, { platform: e.target.value })}
            />
            <Input
              placeholder="url"
              value={social.url}
              onChange={(e) => updateSocial(index, { url: e.target.value })}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => update('socials', profile.socials.filter((_, i) => i !== index))}
            >
              Убрать
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => update('socials', [...profile.socials, { platform: '', url: '' }])}
        >
          Добавить соцсеть
        </Button>
      </div>

      <Button
        disabled={saving}
        onClick={async () => {
          await save(profile, 'admin: update profile.json')
        }}
      >
        {saving ? 'Сохранение…' : 'Сохранить'}
      </Button>
    </div>
  )
}
