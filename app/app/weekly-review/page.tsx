'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

function startOfWeekISO(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export default function WeeklyReviewPage() {
  const [wins, setWins] = useState('')
  const [challenges, setChallenges] = useState('')
  const [nextFocus, setNextFocus] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const weekStart = startOfWeekISO()

  useEffect(() => {
    async function loadReview() {
      try {
        const data = await api<{
          reviews: Array<{
            wins: string | null
            challenges: string | null
            next_focus: string | null
          }>
        }>(`/api/weekly-reviews?week_start=${weekStart}`)

        const review = data.reviews[0]

        if (review) {
          setWins(review.wins ?? '')
          setChallenges(review.challenges ?? '')
          setNextFocus(review.next_focus ?? '')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load review')
      }
    }

    loadReview()
  }, [weekStart])

  async function handleSave() {
    setSaved(false)
    setError('')

    try {
      await api('/api/weekly-reviews', {
        method: 'POST',
        body: JSON.stringify({
          week_start: weekStart,
          wins,
          challenges,
          next_focus: nextFocus,
        }),
      })

      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save review')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          Weekly Review
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Reflect before the next week starts
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400 md:text-base">
          Live weekly review connected to Supabase.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              What health habits went well this week?
            </label>
            <textarea
              value={wins}
              onChange={(e) => {
                setWins(e.target.value)
                setSaved(false)
              }}
              className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              placeholder="Type your reflection here..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              What made consistency harder?
            </label>
            <textarea
              value={challenges}
              onChange={(e) => {
                setChallenges(e.target.value)
                setSaved(false)
              }}
              className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              placeholder="Type your reflection here..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Which metric needs more focus next week?
            </label>
            <textarea
              value={nextFocus}
              onChange={(e) => {
                setNextFocus(e.target.value)
                setSaved(false)
              }}
              className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              placeholder="Type your reflection here..."
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white"
          >
            Save weekly review
          </button>

          {saved ? (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Saved.
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}