'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Check, Save } from 'lucide-react'
import { api } from '@/lib/api'

function startOfWeekISO(date = new Date()) {
  const d = new Date(date); const day = d.getDay(); const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff); return d.toISOString().slice(0, 10)
}
function addWeeks(s: string, w: number) { const d = new Date(s); d.setDate(d.getDate() + w * 7); return d.toISOString().slice(0, 10) }
function formatWeekRange(ws: string) {
  const s = new Date(ws); const e = new Date(ws); e.setDate(e.getDate() + 6)
  const o: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString('en-GB', o)} – ${e.toLocaleDateString('en-GB', o)}`
}

export default function WeeklyReviewPage() {
  const [weekStart, setWeekStart] = useState(startOfWeekISO())
  const [wins, setWins] = useState(''); const [challenges, setChallenges] = useState(''); const [nextFocus, setNextFocus] = useState('')
  const [saved, setSaved] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState('')
  const isCurrentWeek = weekStart === startOfWeekISO()

  useEffect(() => {
    async function load() {
      setLoading(true); setSaved(false); setError('')
      try {
        const d = await api<{ reviews: Array<{ wins: string | null; challenges: string | null; next_focus: string | null }> }>(`/api/weekly-reviews?week_start=${weekStart}`)
        const r = d.reviews[0]
        if (r) { setWins(r.wins ?? ''); setChallenges(r.challenges ?? ''); setNextFocus(r.next_focus ?? '') }
        else { setWins(''); setChallenges(''); setNextFocus('') }
      } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load') }
      finally { setLoading(false) }
    }
    load()
  }, [weekStart])

  async function handleSave() {
    setSaved(false); setError('')
    try {
      await api('/api/weekly-reviews', { method: 'POST', body: JSON.stringify({ week_start: weekStart, wins, challenges, next_focus: nextFocus }) })
      setSaved(true); setTimeout(() => setSaved(false), 4000)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save') }
  }

  const fields = [
    { key: 'wins', label: 'What health habits went well this week?', letter: 'W', color: 'var(--uyb-green)', value: wins, set: setWins, placeholder: 'Celebrate your wins…' },
    { key: 'challenges', label: 'What made consistency harder?', letter: 'C', color: 'var(--uyb-orange)', value: challenges, set: setChallenges, placeholder: 'Be honest with yourself…' },
    { key: 'focus', label: 'Which metric needs more focus next week?', letter: 'F', color: 'var(--uyb-blue)', value: nextFocus, set: setNextFocus, placeholder: 'What will you prioritise?' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: 'var(--uyb-green)' }}>Weekly Review</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Reflect before the <span className="uyb-gradient-text">next week</span></h1>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--uyb-muted)' }}>Review your wins, challenges, and set focus. Navigate between weeks to see past reflections.</p>
      </div>

      {error && <div className="uyb-card text-sm" style={{ borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', padding: '12px 16px', color: '#fca5a5' }}>{error}</div>}

      {/* Week nav */}
      <div className="uyb-card flex items-center justify-between" style={{ padding: '12px 20px' }}>
        <button onClick={() => setWeekStart(addWeeks(weekStart, -1))} className="p-2 rounded-xl transition" style={{ color: 'var(--uyb-muted)' }}><ChevronLeft className="h-5 w-5" /></button>
        <div className="text-center"><div className="font-semibold">{formatWeekRange(weekStart)}</div><div className="text-xs" style={{ color: 'var(--uyb-muted)' }}>{isCurrentWeek ? 'This week' : `Week of ${weekStart}`}</div></div>
        <button onClick={() => { if (!isCurrentWeek) setWeekStart(addWeeks(weekStart, 1)) }} disabled={isCurrentWeek} className="p-2 rounded-xl transition" style={{ color: 'var(--uyb-muted)', opacity: isCurrentWeek ? 0.3 : 1 }}><ChevronRight className="h-5 w-5" /></button>
      </div>

      <div className="uyb-card">
        {loading ? <div className="py-8 text-center text-sm" style={{ color: 'var(--uyb-muted)' }}>Loading review…</div> : (
          <div className="space-y-5">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold" style={{ background: `${f.color}22`, color: f.color }}>{f.letter}</span>
                  {f.label}
                </label>
                <textarea value={f.value} onChange={(e) => { f.set(e.target.value); setSaved(false) }} placeholder={f.placeholder} className="uyb-input" style={{ minHeight: 100, resize: 'vertical' }} />
              </div>
            ))}
          </div>
        )}
        <div className="mt-5 flex items-center gap-3">
          <button onClick={handleSave} className="uyb-btn-primary"><Save className="h-4 w-4" />Save weekly review</button>
          {saved && <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--uyb-green)' }}><Check className="h-4 w-4" />Saved successfully</span>}
        </div>
      </div>
    </div>
  )
}
