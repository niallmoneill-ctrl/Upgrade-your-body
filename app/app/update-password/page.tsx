'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setMessage({ text: 'Passwords do not match.', type: 'error' })
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else {
      setMessage({ text: 'Password updated! Redirecting...', type: 'success' })
      setTimeout(() => { window.location.href = '/app/dashboard' }, 2000)
    }
    setLoading(false)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Account
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Set your password</h1>
        <p className="mt-2 text-sm text-slate-500">
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Updating...' : 'Set password'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            message.type === 'error'
              ? 'bg-red-50 text-red-500'
              : 'bg-emerald-50 text-emerald-600'
          }`}>
            {message.text}
          </p>
        )}
      </div>
    </main>
  )
}
