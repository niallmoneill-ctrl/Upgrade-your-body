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

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await api<{ metrics: Metric[] }>('/api/metrics')
        setMetrics(data.metrics)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  const consistencyScore = useMemo(() => {
    if (metrics.length === 0) return 0

    const completed = metrics.filter((metric) => {
      if (metric.target_value === null || metric.target_value === 0) return false
      return true
    }).length

    return Math.round((completed / metrics.length) * 100)
  }, [metrics])

  const categoryCounts = useMemo(() => {
    return {
      Movement: metrics.filter((m) => m.category === 'Movement').length,
      Nutrition: metrics.filter((m) => m.category === 'Nutrition').length,
      Recovery: metrics.filter((m) => m.category === 'Recovery').length,
      Mindset: metrics.filter((m) => m.category === 'Mindset').length,
    }
  }, [metrics])

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          Dashboard
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Your full health picture in one place
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400 md:text-base">
          Live dashboard connected to your metrics in Supabase.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Consistency score</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Based on your current metric setup
              </div>
            </div>
            <div className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-300">
              {loading ? 'Loading…' : 'Live'}
            </div>
          </div>

          <div className="mt-6 flex items-end gap-4">
            <div className="text-5xl font-bold">{consistencyScore}%</div>
            <div className="pb-2 text-sm text-slate-500 dark:text-slate-400">
              dashboard score
            </div>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
              style={{ width: `${consistencyScore}%` }}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {metrics.slice(0, 6).map((metric) => {
              const Icon = iconFor(metric.icon)
              return (
                <div key={metric.id} className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-200 p-2 dark:bg-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{metric.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {metric.category}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-2xl font-bold">
                    {metric.target_value ?? '-'}
                    {metric.unit ?? ''}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Target
                  </div>
                </div>
              )
            })}
          </div>

          {!loading && metrics.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              No metrics yet. Go to Tracker to create your first one.
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="text-sm font-semibold">Categories</div>
            <div className="mt-4 space-y-3">
              {[
                ['Movement', categoryCounts.Movement],
                ['Nutrition', categoryCounts.Nutrition],
                ['Recovery', categoryCounts.Recovery],
                ['Mindset', categoryCounts.Mindset],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                  <span className="font-medium">{label}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {value} metrics
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="text-sm font-semibold">This week</div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <span className="text-sm">Metrics created</span>
                <span className="font-semibold">{metrics.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <span className="text-sm">Core categories used</span>
                <span className="font-semibold">
                  {[categoryCounts.Movement, categoryCounts.Nutrition, categoryCounts.Recovery, categoryCounts.Mindset].filter((n) => n > 0).length}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <span className="text-sm">Status</span>
                <span className="font-semibold">
                  {loading ? 'Loading' : metrics.length > 0 ? 'Active' : 'Getting started'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}