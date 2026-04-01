'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Footprints,
  Droplets,
  Bed,
  Candy,
  Wine,
  Brain,
  Dumbbell,
  Activity,
  Plus,
} from 'lucide-react'
import { api } from '@/lib/api'

type Metric = {
  id: string
  name: string
  unit: string | null
  target_value: number | null
  category: string
  icon: string | null
  position: number
}

function iconFor(name: string | null) {
  switch (name) {
    case 'steps':
      return Footprints
    case 'water':
      return Droplets
    case 'sleep':
      return Bed
    case 'sugar':
      return Candy
    case 'alcohol':
      return Wine
    case 'meditation':
      return Brain
    case 'pressups':
      return Dumbbell
    case 'workout':
      return Activity
    default:
      return Activity
  }
}

export default function TrackerPage() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [entry, setEntry] = useState('')
  const [filter, setFilter] = useState('All')
  const [draftName, setDraftName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadMetrics() {
    setLoading(true)
    setError('')

    try {
      const data = await api<{ metrics: Metric[] }>('/api/metrics')
      setMetrics(data.metrics)
      if (data.metrics.length > 0 && !selectedId) {
        setSelectedId(data.metrics[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMetrics()
  }, [])

  const visibleMetrics = useMemo(() => {
    return filter === 'All' ? metrics : metrics.filter((m) => m.category === filter)
  }, [filter, metrics])

  const activeMetric = metrics.find((m) => m.id === selectedId) || metrics[0]

  async function handleCreateMetric() {
    if (!draftName.trim()) return

    try {
      const data = await api<{ metric: Metric }>('/api/metrics', {
        method: 'POST',
        body: JSON.stringify({
          name: draftName.trim(),
          unit: '',
          target_value: 1,
          category: 'Movement',
          icon: 'workout',
          position: metrics.length,
        }),
      })

      setMetrics((prev) => [...prev, data.metric])
      setSelectedId(data.metric.id)
      setDraftName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create metric')
    }
  }

  async function handleSaveEntry() {
    if (!activeMetric || entry === '') return

    try {
      await api('/api/metric-entries', {
        method: 'POST',
        body: JSON.stringify({
          metric_id: activeMetric.id,
          value: Number(entry),
        }),
      })

      setEntry('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          Tracker
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Track every health element that matters
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400 md:text-base">
          Live metrics are now loaded from your authenticated API.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {['All', 'Movement', 'Nutrition', 'Recovery', 'Mindset'].map((label) => (
          <button
            key={label}
            onClick={() => setFilter(label)}
            className={`rounded-full px-3 py-2 text-sm font-medium ${
              filter === label
                ? 'border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-300'
                : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">Your metrics</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Loaded from Supabase</div>
            </div>
            <div className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-300">
              {loading ? 'Loading…' : `${visibleMetrics.length} shown`}
            </div>
          </div>

          <div className="space-y-3">
            {visibleMetrics.map((metric) => {
              const Icon = iconFor(metric.icon)
              const selected = selectedId === metric.id
              return (
                <button
                  key={metric.id}
                  onClick={() => setSelectedId(metric.id)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left ${
                    selected
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{metric.name}</div>
                      <div className={`text-xs ${selected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                        {metric.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    Target {metric.target_value ?? '-'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="font-semibold">Log today’s entry</div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Saves through /api/metric-entries</div>

            {activeMetric ? (
              <>
                <div className="mt-5 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Selected metric</div>
                  <div className="mt-1 text-2xl font-bold">{activeMetric.name}</div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Target {activeMetric.target_value ?? '-'}{activeMetric.unit ?? ''}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    type="number"
                    placeholder={`Enter value in ${activeMetric.unit || 'units'}`}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500"
                  />
                  <button
                    onClick={handleSaveEntry}
                    className="rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Create your first metric to start logging entries.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="font-semibold">Create metric</div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Saves through /api/metrics</div>
            <div className="mt-4 flex gap-3">
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g. Protein"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500"
              />
              <button
                onClick={handleCreateMetric}
                className="rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}