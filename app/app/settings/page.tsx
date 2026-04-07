'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, User, Palette, CreditCard } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'

export default function SettingsPage() {
  const [email, setEmail] = useState(''); const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false)
  const { theme, toggle } = useTheme()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) { setEmail(user.email ?? ''); setDisplayName(user.user_metadata?.display_name ?? user.user_metadata?.name ?? '') }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false)
    try {
      const supabase = createClient()
      await supabase.auth.updateUser({ data: { display_name: displayName } })
      setSaved(true); setTimeout(() => setSaved(false), 4000)
    } catch {} finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: 'var(--uyb-green)' }}>Settings</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Profile and <span className="uyb-gradient-text">preferences</span></h1>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--uyb-muted)' }}>Manage your account details and app preferences.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="uyb-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="uyb-icon-box"><User className="h-5 w-5" style={{ color: 'var(--uyb-green)' }} /></div>
            <div className="font-semibold">Profile</div>
          </div>
          {loading ? <div className="py-4 text-sm" style={{ color: 'var(--uyb-muted)' }}>Loading…</div> : (
            <div className="space-y-4">
              <div><label className="mb-1.5 block text-sm font-medium">Display name</label><input value={displayName} onChange={(e) => { setDisplayName(e.target.value); setSaved(false) }} placeholder="Your name" className="uyb-input" /></div>
              <div><label className="mb-1.5 block text-sm font-medium">Email</label><input value={email} disabled className="uyb-input" style={{ opacity: 0.5 }} /><p className="mt-1 text-xs" style={{ color: 'var(--uyb-muted)' }}>Email cannot be changed here</p></div>
              <button onClick={handleSave} disabled={saving} className="uyb-btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save profile'}</button>
              {saved && <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--uyb-green)' }}><Check className="h-4 w-4" />Profile updated</span>}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="uyb-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="uyb-icon-box"><Palette className="h-5 w-5" style={{ color: 'var(--uyb-blue)' }} /></div>
              <div className="font-semibold">Appearance</div>
            </div>
            <div className="uyb-surface flex items-center justify-between p-4">
              <div><div className="font-medium">Theme</div><div className="text-sm" style={{ color: 'var(--uyb-muted)' }}>Currently using {theme} mode</div></div>
              <button onClick={toggle} className="uyb-btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>Switch to {theme === 'dark' ? 'light' : 'dark'}</button>
            </div>
          </div>

          <div className="uyb-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="uyb-icon-box"><CreditCard className="h-5 w-5" style={{ color: 'var(--uyb-orange)' }} /></div>
              <div className="font-semibold">Plan</div>
            </div>
            <div className="uyb-surface flex items-center justify-between p-4">
              <div><div className="font-medium">Free early access</div><div className="text-sm" style={{ color: 'var(--uyb-muted)' }}>All features included during beta</div></div>
              <span style={{ background: 'rgba(65,217,138,0.15)', color: 'var(--uyb-green)', borderRadius: 999, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>Free</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
