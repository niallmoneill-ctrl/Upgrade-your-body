'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, User, Palette, CreditCard, Globe, Download } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'

const TIMEZONES = [
  { value: 'Europe/Dublin', label: 'Dublin (GMT/IST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
  { value: 'Europe/Brussels', label: 'Brussels (CET/CEST)' },
  { value: 'Europe/Lisbon', label: 'Lisbon (WET/WEST)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)' },
  { value: 'Europe/Oslo', label: 'Oslo (CET/CEST)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (EET/EEST)' },
  { value: 'Europe/Athens', label: 'Athens (EET/EEST)' },
  { value: 'Europe/Bucharest', label: 'Bucharest (EET/EEST)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'Denver (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'America/Toronto', label: 'Toronto (EST/EDT)' },
  { value: 'America/Vancouver', label: 'Vancouver (PST/PDT)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST/CDT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'Mumbai / Delhi (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'Africa/Cairo', label: 'Cairo (EET)' },
  { value: 'UTC', label: 'UTC' },
]

export default function SettingsPage() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [timezone, setTimezone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [ebookPurchased, setEbookPurchased] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const { theme, toggle } = useTheme()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email ?? '')
        setDisplayName(user.user_metadata?.display_name ?? user.user_metadata?.name ?? '')
        setTimezone(user.user_metadata?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Europe/Dublin')

        // Check subscription for eBook purchase
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('ebook_purchased')
          .eq('user_id', user.id)
          .single()
        if (sub?.ebook_purchased) setEbookPurchased(true)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false)
    try {
      const supabase = createClient()
      await supabase.auth.updateUser({
        data: { display_name: displayName, timezone },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch {} finally { setSaving(false) }
  }

  // Detect user's browser timezone for the hint
  const detectedTz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : ''

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: 'var(--uyb-green)' }}>Settings</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Profile and <span className="uyb-gradient-text">preferences</span></h1>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--uyb-muted)' }}>Manage your account, timezone, and app preferences.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile */}
        <div className="uyb-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="uyb-icon-box"><User className="h-5 w-5" style={{ color: 'var(--uyb-green)' }} /></div>
            <div className="font-semibold">Profile</div>
          </div>
          {loading ? <div className="py-4 text-sm" style={{ color: 'var(--uyb-muted)' }}>Loading…</div> : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Display name</label>
                <input value={displayName} onChange={(e) => { setDisplayName(e.target.value); setSaved(false) }} placeholder="Your name" className="uyb-input" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <input value={email} disabled className="uyb-input" style={{ opacity: 0.5 }} />
                <p className="mt-1 text-xs" style={{ color: 'var(--uyb-muted)' }}>Email cannot be changed here</p>
              </div>

              <button onClick={handleSave} disabled={saving} className="uyb-btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Save profile'}
              </button>

              {saved && <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--uyb-green)' }}><Check className="h-4 w-4" />Profile updated</span>}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Timezone */}
          <div className="uyb-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="uyb-icon-box"><Globe className="h-5 w-5" style={{ color: 'var(--uyb-blue)' }} /></div>
              <div className="font-semibold">Timezone</div>
            </div>
            <p className="text-sm mb-3" style={{ color: 'var(--uyb-muted)' }}>
              Your reminders and emails are sent based on this timezone.
            </p>
            <select value={timezone} onChange={(e) => { setTimezone(e.target.value); setSaved(false) }} className="uyb-input">
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            {detectedTz && detectedTz !== timezone && (
              <button
                onClick={() => { setTimezone(detectedTz); setSaved(false) }}
                className="mt-2 text-xs font-medium"
                style={{ color: 'var(--uyb-blue)' }}
              >
                Detected: {detectedTz} — click to use
              </button>
            )}
          </div>

          {/* Appearance */}
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

          {/* Plan */}
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

          {/* eBook Download */}
          {ebookPurchased && (
            <div className="uyb-card">
              <div className="flex items-center gap-3 mb-5">
                <div className="uyb-icon-box"><Download className="h-5 w-5" style={{ color: 'var(--uyb-green)' }} /></div>
                <div className="font-semibold">Your eBook</div>
              </div>
              <div className="uyb-surface p-4">
                <div className="font-medium">Upgrade Your Body</div>
                <div className="text-sm mt-1" style={{ color: 'var(--uyb-muted)' }}>PDF format · Download anytime</div>
                <button
                  disabled={downloading}
                  onClick={async () => {
                    setDownloading(true)
                    try {
                      const res = await fetch('/api/ebook/download')
                      const data = await res.json()
                      if (data.url) window.open(data.url, '_blank')
                    } catch (err) { console.error(err) }
                    finally { setDownloading(false) }
                  }}
                  className="uyb-btn-primary mt-3"
                  style={{ opacity: downloading ? 0.6 : 1 }}
                >
                  {downloading ? 'Preparing...' : 'Download PDF'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
