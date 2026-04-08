'use client'
import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { api } from '@/lib/api'

type Entry = {
  id: string
  metric_id: string
  value: number
  entry_date: string
  note: string | null
}

type Metric = {
  id: string
  name: string
  unit: string | null
  target_value: number | null
  category: string
  icon: string | null
}

type Range = '7' | '30' | '90'

function formatDate(dateStr: string, range: Range) {
  const d = new Date(dateStr)
  if (range === '7') return d.toLocaleDateString('en-IE', { weekday: 'short' })
  return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
}

function fillDateRange(entries: Entry[], days: number): { date: string; value: number | null }[] {
  const result: { date: string; value: number | null }[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const entry = entries.find((e) => e.entry_date === dateStr)
    result.push({ date: dateStr, value: entry ? entry.value : null })
  }
  return result
}

function CustomTooltip({ active, payload, label, unit, target }: any) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value
  const hitTarget = target !== null && value !== null ? value >= target : null
  return (
    <div style={{
      background: 'var(--uyb-card, #1a1a2e)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: '10px 14px',
      fontSize: 13,
    }}>
      <div style={{ color: 'var(--uyb-muted, #888)', marginBottom: 4 }}>{label}</div>
      {value !== null ? (
        <div style={{ fontWeight: 700, fontSize: 16, color: hitTarget === null ? '#41d98a' : hitTarget ? '#41d98a' : '#f87171' }}>
          {value} {unit || ''}
        </div>
      ) : (
        <div style={{ color: 'var(--uyb-muted, #888)' }}>No entry</div>
      )}
      {target !== null && (
        <div style={{ color: 'var(--uyb-muted, #888)', marginTop: 2 }}>Target: {target} {unit || ''}</div>
      )}
    </div>
  )
}

export default function MetricChart({ metric }: { metric: Metric }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [range, setRange] = useState<Range>('7')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const d = await api<{ entries: Entry[] }>(
          `/api/metric-entries?metric_id=${metric.id}&limit=90`
        )
        setEntries(d.entries ?? [])
      } catch {
        setEntries([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [metric.id])

  const data = fillDateRange(entries, Number(range)).map((d) => ({
    ...d,
    label: formatDate(d.date, range),
  }))

  const hasData = data.some((d) => d.value !== null)
  const average = hasData
    ? Math.round(data.filter((d) => d.value !== null).reduce((s, d) => s + (d.value ?? 0), 0) /
        data.filter((d) => d.value !== null).length * 10) / 10
    : null
  const best = hasData
    ? Math.max(...data.filter((d) => d.value !== null).map((d) => d.value ?? 0))
    : null
  const streak = (() => {
    let count = 0
    const sorted = [...data].reverse()
    for (const d of sorted) {
      if (d.value !== null) count++
      else break
    }
    return count
  })()

  return (
    <div style={{
      background: 'var(--uyb-card, #1a1a2e)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 20,
      marginTop: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{metric.name}</div>
          <div style={{ fontSize: 12, color: 'var(--uyb-muted, #888)', marginTop: 2 }}>
            {metric.category} {metric.unit ? `· ${metric.unit}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4 }}>
          {(['7', '30', '90'] as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: range === r ? 'var(--uyb-green, #41d98a)' : 'transparent',
              color: range === r ? '#000' : 'var(--uyb-muted, #888)',
              transition: 'all 0.2s',
            }}>
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Avg', value: average !== null ? `${average} ${metric.unit ?? ''}` : '—' },
          { label: 'Best', value: best !== null ? `${best} ${metric.unit ?? ''}` : '—' },
          { label: '🔥 Streak', value: streak > 0 ? `${streak} days` : '—' },
          ...(metric.target_value ? [{ label: 'Target', value: `${metric.target_value} ${metric.unit ?? ''}` }] : []),
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--uyb-muted, #888)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--uyb-muted, #888)', fontSize: 13 }}>
          Loading chart...
        </div>
      ) : !hasData ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--uyb-muted, #888)', fontSize: 13 }}>
          No entries yet — start logging to see your progress!
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip unit={metric.unit} target={metric.target_value} />} />
            {metric.target_value && (
              <ReferenceLine y={metric.target_value} stroke="rgba(65,217,138,0.4)" strokeDasharray="6 3"
                label={{ value: 'Target', fill: '#41d98a', fontSize: 10, position: 'right' }} />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#41d98a"
              strokeWidth={2.5}
              connectNulls={false}
              dot={(props: any) => {
                const { cx, cy, payload } = props
                if (payload.value === null) return <g key={`dot-${cx}-${cy}`} />
                const hit = metric.target_value === null || payload.value >= metric.target_value
                return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill={hit ? '#41d98a' : '#f87171'} stroke="#000" strokeWidth={1.5} />
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}