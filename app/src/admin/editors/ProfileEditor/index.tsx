import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LocalizedField } from '@/admin/components/LocalizedField'
import { ImageUploadField } from '@/admin/components/ImageUploadField'
import { useEditorData } from '@/admin/hooks/useEditorData'
import type { PendingImage } from '@/admin/lib/resolvePendingImages'
import type { Profile, SocialLink } from '@/types'

const PROFILE_PATH = 'app/data/profile.json'

// avatar can hold a locally compressed-but-not-yet-uploaded image while editing —
// resolved back to a plain path by resolvePendingImages() at Save-all time.
type ProfileDraft = Omit<Profile, 'avatar'> & { avatar: string | PendingImage }

export default function ProfileEditor() {
  const [profile, setProfile] = useEditorData<ProfileDraft>(PROFILE_PATH)

  if (!profile) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  function update<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
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
      <LocalizedField label="bio" value={profile.bio} onChange={(v) => update('bio', v)} richText />

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

      <ImageUploadField label="avatar" value={profile.avatar} onChange={(path) => update('avatar', path)} />

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
    </div>
  )
}
