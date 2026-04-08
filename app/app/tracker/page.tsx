'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Footprints, Droplets, Bed, Candy, Wine, Brain, Dumbbell, Activity,
  Heart, Flame, Apple, Salad, Timer, Moon, Sun, Plus, Check, X, TrendingUp, Calendar,
} from 'lucide-react'
import { api } from '@/lib/api'
import MetricChart from '@/components/MetricChart'

type Metric = { id: string; name: string; unit: string | null; target_value: number | null; category: string; icon: string | null; position: number }
type Entry = { id: string; metric_id: string; value: number; entry_date: string; note: string | null }

const ICONS: Record<string, typeof Activity> = {
  steps: Footprints, water: Droplets, sleep: Bed, sugar: Candy, alcohol: Wine,
  meditation: Brain, pressups: Dumbbell, workout: Activity, heart: Heart,
  calories: Flame, fruit: Apple, salad: Salad, timer: Timer, moon: Moon, sun: Sun, trending: TrendingUp,
}
const CATEGORIES = ['Movement', 'Nutrition', 'Recovery', 'Mindset']
const UNITS = [
  { value: '', label: 'No unit' }, { value: 'steps', label: 'Steps' }, { value: 'glasses', label: 'Glasses' },
  { value: 'litres', label: 'Litres' }, { value: 'hours', label: 'Hours' }, { value: 'minutes', label: 'Minutes' },
  { value: 'grams', label: 'Grams' }, { value: 'kcal', label: 'Calories' }, { value: 'reps', label: 'Reps' },
  { value: 'sets', label: 'Sets' }, { value: 'kg', label: 'Kilograms' }, { value: 'lbs', label: 'Pounds' },
  { value: '%', label: 'Percent' }, { value: 'servings', label: 'Servings' },
]
function iconFor(n: string | null) { return ICONS[n ?? ''] ?? Activity }

export default function TrackerPage() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [entryValue, setEntryValue] = useState('')
  const [entryNote, setEntryNote] = useState('')
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftCategory, setDraftCategory] = useState('Movement')
  const [draftUnit, setDraftUnit] = useState('')
  const [draftTarget, setDraftTarget] = useState('')
  const [draftIcon, setDraftIcon] = useState('workout')

  async function loadMetrics() {
    setLoading(true)
    try {
      const data = await api<{ metrics: Metric[] }>('/api/metrics')
      setMetrics(data.metrics)
      if (data.metrics.length > 0 && !selectedId) setSelectedId(data.metrics[0].id)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load') }
    finally { setLoading(false) }
  }
  async function loadEntries(id: string) {
    try { const d = await api<{ entries: Entry[] }>(`/api/metric-entries?metric_id=${id}`); setEntries(d.entries ?? []) }
    catch { setEntries([]) }
  }
  useEffect(() => { loadMetrics() }, [])
  useEffect(() => { if (selectedId) loadEntries(selectedId) }, [selectedId])

  const visibleMetrics = useMemo(() => filter === 'All' ? metrics : metrics.filter((m) => m.category === filter), [filter, metrics])
  const activeMetric = metrics.find((m) => m.id === selectedId) || metrics[0]
  function flash(msg: string) { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

  async function handleCreate() {
    if (!draftName.trim()) return
    try {
      const d = await api<{ metric: Metric }>('/api/metrics', { method: 'POST', body: JSON.stringify({ name: draftName.trim(), unit: draftUnit, target_value: draftTarget ? Number(draftTarget) : null, category: draftCategory, icon: draftIcon, position: metrics.length }) })
      setMetrics((p) => [...p, d.metric]); setSelectedId(d.metric.id)
      setDraftName(''); setDraftCategory('Movement'); setDraftUnit(''); setDraftTarget(''); setDraftIcon('workout'); setShowCreate(false); flash('Metric created!')
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create') }
  }
  async function handleSaveEntry() {
    if (!activeMetric || entryValue === '') return
    try {
      await api('/api/metric-entries', { method: 'POST', body: JSON.stringify({ metric_id: activeMetric.id, value: Number(entryValue), note: entryNote || null }) })
      setEntryValue(''); setEntryNote(''); flash('Entry logged!')
      if (selectedId) loadEntries(selectedId)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save') }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: 'var(--uyb-green)' }}>Tracker</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Track every <span className="uyb-gradient-text">health element</span></h1>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--uyb-muted)' }}>Create custom metrics, log daily entries, and monitor your progress.</p>
      </div>

      {error && <div className="uyb-card flex items-center justify-between" style={{ borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', padding: '12px 16px' }}><span className="text-sm" style={{ color: '#fca5a5' }}>{error}</span><button onClick={() => setError('')}><X className="h-4 w-4" style={{ color: '#fca5a5' }} /></button></div>}
      {success && <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--uyb-green)' }}><Check className="h-4 w-4" />{success}</div>}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {['All', ...CATEGORIES].map((label) => (
          <button key={label} onClick={() => setFilter(label)} className="uyb-btn-secondary" style={filter === label ? { background: 'rgba(65,217,138,0.15)', borderColor: 'var(--uyb-green)', color: 'var(--uyb-green)', padding: '8px 16px', fontSize: 13 } : { padding: '8px 16px', fontSize: 13 }}>
            {label}
          </button>
        ))}
        <button onClick={() => setShowCreate(true)} className="uyb-btn-primary ml-auto" style={{ padding: '8px 18px', fontSize: 13 }}>
          <Plus className="h-4 w-4" />New metric
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="uyb-card">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-lg">Create new metric</div>
            <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl" style={{ color: 'var(--uyb-muted)' }}><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="mb-1.5 block text-sm font-medium">Name</label><input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g. Daily Steps" className="uyb-input" /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Category</label><select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)} className="uyb-input">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="mb-1.5 block text-sm font-medium">Unit</label><select value={draftUnit} onChange={(e) => setDraftUnit(e.target.value)} className="uyb-input">{UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}</select></div>
            <div><label className="mb-1.5 block text-sm font-medium">Daily target</label><input value={draftTarget} onChange={(e) => setDraftTarget(e.target.value)} type="number" placeholder="e.g. 10000" className="uyb-input" /></div>
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium">Icon</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ICONS).map(([key, Icon]) => (
                <button key={key} onClick={() => setDraftIcon(key)} className="p-2.5 rounded-xl transition" style={draftIcon === key ? { background: 'linear-gradient(90deg, var(--uyb-green), #64f0b1)', color: '#041019' } : { background: 'var(--uyb-surface)', color: 'var(--uyb-muted)' }}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={handleCreate} className="uyb-btn-primary">Create metric</button>
            <button onClick={() => setShowCreate(false)} className="uyb-btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        {/* Metric list */}
        <div className="uyb-card">
          <div className="mb-4 flex items-center justify-between">
            <div><div className="font-semibold">Your metrics</div><div className="text-sm" style={{ color: 'var(--uyb-muted)' }}>Tap to log an entry</div></div>
            <span className="uyb-btn-secondary" style={{ padding: '4px 14px', fontSize: 12, cursor: 'default' }}>{loading ? 'Loading…' : `${visibleMetrics.length} shown`}</span>
          </div>
          <div className="space-y-2">
            {visibleMetrics.map((metric) => {
              const Icon = iconFor(metric.icon); const sel = selectedId === metric.id
              return (
                <button key={metric.id} onClick={() => setSelectedId(metric.id)} className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition" style={sel ? { background: 'linear-gradient(90deg, var(--uyb-green), #64f0b1)', color: '#041019', boxShadow: '0 4px 16px rgba(65,217,138,0.25)' } : { background: 'var(--uyb-surface)' }}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl p-2" style={{ background: sel ? 'rgba(255,255,255,0.25)' : 'var(--uyb-card)' }}><Icon className="h-4 w-4" /></div>
                    <div><div className="font-medium">{metric.name}</div><div className="text-xs" style={{ opacity: sel ? 0.7 : 1, color: sel ? 'inherit' : 'var(--uyb-muted)' }}>{metric.category}</div></div>
                  </div>
                  <div className="text-right"><div className="text-sm font-semibold">{metric.target_value ?? '-'}{metric.unit ? ` ${metric.unit}` : ''}</div><div className="text-xs" style={{ opacity: 0.6 }}>target</div></div>
                </button>
              )
            })}
            {!loading && visibleMetrics.length === 0 && <div className="uyb-surface p-4 text-center text-sm" style={{ color: 'var(--uyb-muted)' }}>No metrics yet.</div>}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <div className="uyb-card">
            <div className="font-semibold">Log today&apos;s entry</div>
            {activeMetric ? (<>
              <div className="mt-4 uyb-surface p-4 flex items-center gap-3">
                {(() => { const I = iconFor(activeMetric.icon); return <div className="uyb-icon-box" style={{ width: 36, height: 36, borderRadius: 10 }}><I className="h-4 w-4" style={{ color: 'var(--uyb-green)' }} /></div> })()}
                <div><div className="font-semibold">{activeMetric.name}</div><div className="text-sm" style={{ color: 'var(--uyb-muted)' }}>Target: {activeMetric.target_value ?? '-'}{activeMetric.unit ? ` ${activeMetric.unit}` : ''} · {activeMetric.category}</div></div>
              </div>
              <div className="mt-4 space-y-3">
                <input value={entryValue} onChange={(e) => setEntryValue(e.target.value)} type="number" placeholder={`Value${activeMetric.unit ? ` in ${activeMetric.unit}` : ''}`} className="uyb-input" />
                <input value={entryNote} onChange={(e) => setEntryNote(e.target.value)} placeholder="Note (optional)" className="uyb-input" />
                <button onClick={handleSaveEntry} className="uyb-btn-primary w-full justify-center">Save entry</button>
              </div>
            </>) : <div className="mt-4 uyb-surface p-4 text-sm" style={{ color: 'var(--uyb-muted)' }}>Create a metric to start logging.</div>}
          </div>

          <div className="uyb-card">
            <div className="flex items-center gap-2 font-semibold"><Calendar className="h-4 w-4" style={{ color: 'var(--uyb-muted)' }} />Recent entries</div>
            <div className="mt-3 space-y-2">
              {entries.length === 0 ? <div className="uyb-surface p-3 text-center text-sm" style={{ color: 'var(--uyb-muted)' }}>No entries yet.</div> : entries.slice(0, 10).map((e) => (
                <div key={e.id} className="uyb-surface flex items-center justify-between px-4 py-2.5">
                  <div><div className="text-sm font-medium">{e.value}{activeMetric?.unit ? ` ${activeMetric.unit}` : ''}</div>{e.note && <div className="text-xs" style={{ color: 'var(--uyb-muted)' }}>{e.note}</div>}</div>
                  <div className="text-xs" style={{ color: 'var(--uyb-muted)' }}>{e.entry_date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {activeMetric && <MetricChart metric={activeMetric} />}
    </div>
  )
}
