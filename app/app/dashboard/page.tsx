'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Footprints, Droplets, Bed, Candy, Wine, Brain, Dumbbell, Activity,
  Heart, Flame, Apple, Salad, Timer, Moon, Sun, TrendingUp, Zap,
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

const ICONS: Record<string, typeof Activity> = {
  steps: Footprints, water: Droplets, sleep: Bed, sugar: Candy,
  alcohol: Wine, meditation: Brain, pressups: Dumbbell, workout: Activity,
  heart: Heart, calories: Flame, fruit: Apple, salad: Salad,
  timer: Timer, moon: Moon, sun: Sun, trending: TrendingUp,
}

function iconFor(name: string | null) { return ICONS[name ?? ''] ?? Activity }

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await api<{ metrics: Metric[] }>('/api/metrics')
        setMetrics(data.metrics)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const categoryCounts = useMemo(() => ({
    Movement: metrics.filter((m) => m.category === 'Movement').length,
    Nutrition: metrics.filter((m) => m.category === 'Nutrition').length,
    Recovery: metrics.filter((m) => m.category === 'Recovery').length,
    Mindset: metrics.filter((m) => m.category === 'Mindset').length,
  }), [metrics])

  const activeCategories = Object.values(categoryCounts).filter((n) => n > 0).length
  const consistencyScore = metrics.length === 0 ? 0 : Math.round(
    (metrics.filter((m) => m.target_value !== null && m.target_value > 0).length / metrics.length) * 100
  )

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: 'var(--uyb-green)' }}>Dashboard</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Your full <span className="uyb-gradient-text">health picture</span></h1>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--uyb-muted)' }}>
          Live overview of all your tracked metrics and categories.
        </p>
      </div>

      {error && (
        <div className="uyb-card" style={{ borderColor: '#f87171', background: 'rgba(248,113,113,0.1)' }}>
          <span className="text-sm" style={{ color: '#fca5a5' }}>{error}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Zap, label: 'Consistency score', value: `${loading ? '…' : consistencyScore}%`, bar: true },
          { icon: TrendingUp, label: 'Active metrics', value: loading ? '…' : metrics.length },
          { icon: Activity, label: 'Categories active', value: loading ? '…' : `${activeCategories}/4` },
        ].map((stat, i) => (
          <div key={i} className="uyb-card">
            <div className="flex items-center gap-3">
              <div className="uyb-icon-box"><stat.icon className="h-5 w-5" style={{ color: 'var(--uyb-green)' }} /></div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm" style={{ color: 'var(--uyb-muted)' }}>{stat.label}</div>
              </div>
            </div>
            {stat.bar && (
              <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: 'var(--uyb-surface)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${consistencyScore}%`, background: 'linear-gradient(90deg, var(--uyb-blue), var(--uyb-green))' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Metrics grid */}
        <div className="uyb-card">
          <div className="flex items-center justify-between mb-5">
            <div className="font-semibold">All metrics</div>
            <span className="uyb-btn-secondary" style={{ padding: '4px 14px', fontSize: '12px', cursor: 'default' }}>
              {loading ? 'Loading…' : 'Live'}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => {
              const Icon = iconFor(metric.icon)
              return (
                <div key={metric.id} className="uyb-surface p-4 transition hover:opacity-80" style={{ borderRadius: '16px' }}>
                  <div className="flex items-center gap-3">
                    <div className="uyb-icon-box" style={{ width: 36, height: 36, borderRadius: 10 }}>
                      <Icon className="h-4 w-4" style={{ color: 'var(--uyb-green)' }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{metric.name}</div>
                      <div className="text-xs" style={{ color: 'var(--uyb-green)' }}>{metric.category}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-bold">
                    {metric.target_value ?? '-'}
                    <span className="text-sm font-normal" style={{ color: 'var(--uyb-muted)' }}>
                      {metric.unit ? ` ${metric.unit}` : ''}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--uyb-muted)' }}>target</div>
                </div>
              )
            })}
          </div>
          {!loading && metrics.length === 0 && (
            <div className="uyb-surface p-4 text-center text-sm" style={{ color: 'var(--uyb-muted)' }}>
              No metrics yet. Go to Tracker to create your first one.
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="space-y-4">
          <div className="uyb-card">
            <div className="font-semibold mb-4">Categories</div>
            <div className="space-y-3">
              {(['Movement', 'Nutrition', 'Recovery', 'Mindset'] as const).map((cat) => (
                <div key={cat} className="uyb-surface flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--uyb-green)' }} />
                    <span className="font-medium text-sm">{cat}</span>
                  </div>
                  <span className="text-sm font-semibold">{categoryCounts[cat]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="uyb-card">
            <div className="font-semibold mb-4">Quick stats</div>
            <div className="space-y-3">
              {[
                ['Total metrics', metrics.length],
                ['With targets', metrics.filter((m) => m.target_value).length],
                ['Status', loading ? 'Loading' : metrics.length > 0 ? 'Active' : 'Getting started'],
              ].map(([label, value], i) => (
                <div key={i} className="uyb-surface flex items-center justify-between px-4 py-3">
                  <span className="text-sm">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
