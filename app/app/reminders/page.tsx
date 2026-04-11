'use client'

import { useEffect, useState } from 'react'
import { Bell, Plus, Check, X, Clock, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'

type Reminder = { id: string; title: string; reminder_time: string; enabled: boolean }

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [success, setSuccess] = useState('')
  const [showCreate, setShowCreate] = useState(false); const [draftTitle, setDraftTitle] = useState(''); const [draftTime, setDraftTime] = useState('08:00')

  async function loadReminders() {
    setLoading(true)
    try { const d = await api<{ reminders: Reminder[] }>('/api/reminders'); setReminders(d.reminders ?? []) }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { loadReminders() }, [])

  async function handleCreate() {
    if (!draftTitle.trim() || !draftTime) return
    try {
      const d = await api<{ reminder: Reminder }>('/api/reminders', { method: 'POST', body: JSON.stringify({ title: draftTitle.trim(), reminder_time: draftTime, enabled: true }) })
      setReminders((p) => [...p, d.reminder]); setDraftTitle(''); setDraftTime('08:00'); setShowCreate(false); flash('Reminder created!')
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create') }
  }

  async function handleDelete(id: string) {
    try {
      await api('/api/reminders', { method: 'DELETE', body: JSON.stringify({ id }) })
      setReminders((p) => p.filter((r) => r.id !== id)); flash('Reminder deleted')
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete') }
  }

  async function handleToggle(id: string, enabled: boolean) {
    try {
      await api('/api/reminders', { method: 'PATCH', body: JSON.stringify({ id, enabled: !enabled }) })
      setReminders((p) => p.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r))
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to update') }
  }

  function flash(msg: string) { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }
  function formatTime(t: string) { const [h, m] = t.split(':'); const hr = parseInt(h, 10); return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}` }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: 'var(--uyb-green)' }}>Reminders</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Stay <span className="uyb-gradient-text">consistent</span> with gentle nudges</h1>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--uyb-muted)' }}>Set reminders for your health habits. Toggle them on or off as needed.</p>
      </div>

      {error && <div className="uyb-card flex items-center justify-between" style={{ borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', padding: '12px 16px' }}><span className="text-sm" style={{ color: '#fca5a5' }}>{error}</span><button onClick={() => setError('')}><X className="h-4 w-4" style={{ color: '#fca5a5' }} /></button></div>}
      {success && <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--uyb-green)' }}><Check className="h-4 w-4" />{success}</div>}

      {showCreate ? (
        <div className="uyb-card">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">New reminder</div>
            <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl" style={{ color: 'var(--uyb-muted)' }}><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1.5 block text-sm font-medium">Title</label><input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="e.g. Morning check-in" className="uyb-input" /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Time</label><input value={draftTime} onChange={(e) => setDraftTime(e.target.value)} type="time" className="uyb-input" /></div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={handleCreate} className="uyb-btn-primary"><Plus className="h-4 w-4" />Create reminder</button>
            <button onClick={() => setShowCreate(false)} className="uyb-btn-secondary">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowCreate(true)} className="uyb-btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
          <Plus className="h-4 w-4" />New reminder
        </button>
      )}

      <div className="uyb-card">
        {loading ? <div className="py-8 text-center text-sm" style={{ color: 'var(--uyb-muted)' }}>Loading reminders…</div> : reminders.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="mx-auto h-8 w-8" style={{ color: 'var(--uyb-muted)', opacity: 0.4 }} />
            <div className="mt-3 text-sm" style={{ color: 'var(--uyb-muted)' }}>No reminders yet. Create one to stay on track.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((item) => (
              <div key={item.id} className="uyb-surface flex items-center justify-between p-4" style={{ opacity: item.enabled ? 1 : 0.5 }}>
                <div className="flex items-center gap-4">
                  <div className="uyb-icon-box" style={{ width: 40, height: 40, borderRadius: 12 }}>
                    <Bell className="h-4 w-4" style={{ color: 'var(--uyb-green)' }} />
                  </div>
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--uyb-muted)' }}>
                      <Clock className="h-3.5 w-3.5" />{formatTime(item.reminder_time)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggle(item.id, item.enabled)}
                    className="relative h-7 w-12 rounded-full transition"
                    style={{ background: item.enabled ? 'linear-gradient(90deg, var(--uyb-green), #64f0b1)' : 'var(--uyb-surface)', border: item.enabled ? 'none' : '1px solid var(--uyb-card-border)' }}>
                    <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition" style={{ left: item.enabled ? 20 : 2 }} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg transition" style={{ color: 'var(--uyb-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fca5a5')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--uyb-muted)')}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
