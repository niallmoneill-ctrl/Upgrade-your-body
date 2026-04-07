'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'magic' | 'password' | 'reset'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [mode, setMode] = useState<Mode>('magic')

  const searchParams = useSearchParams()
  const authError = searchParams.get('error')

  function switchMode(newMode: Mode) {
    setMode(newMode)
    setMessage(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const supabase = createClient()

    if (mode === 'magic') {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      })
      if (error) {
        setMessage({ text: error.message, type: 'error' })
      } else {
        setMessage({ text: 'Check your email for your login link.', type: 'success' })
      }

    } else if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage({ text: error.message, type: 'error' })
      } else {
        window.location.href = '/app/dashboard'
      }

    } else if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/app/update-password`,
      })
      if (error) {
        setMessage({ text: error.message, type: 'error' })
      } else {
        setMessage({ text: 'Check your email for a password reset link.', type: 'success' })
      }
    }

    setLoading(false)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">

        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          {mode === 'reset' ? 'Reset Password' : 'Login'}
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {mode === 'reset' ? 'Forgot your password?' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {mode === 'reset'
            ? "Enter your email and we'll send you a reset link."
            : 'Sign in to access your health dashboard and tracker.'}
        </p>

        {/* Auth error from callback */}
        {authError === 'auth_failed' && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-500">
            Login link expired or invalid. Please try again.
          </p>
        )}

        {/* Mode toggle — only show when not in reset mode */}
        {mode !== 'reset' && (
          <div className="mt-6 flex rounded-2xl border border-slate-200 p-1">
            <button
              type="button"
              onClick={() => switchMode('magic')}
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all ${
                mode === 'magic'
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Magic Link
            </button>
            <button
              type="button"
              onClick={() => switchMode('password')}
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all ${
                mode === 'password'
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Password
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {mode === 'password' && (
            <div>
              <label className="mb-2 block text-sm font-medium">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="mt-2 text-xs text-cyan-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading
              ? 'Please wait...'
              : mode === 'magic'
              ? 'Send magic link'
              : mode === 'password'
              ? 'Sign in'
              : 'Send reset link'}
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

        {/* Back to login from reset mode */}
        {mode === 'reset' && (
          <button
            type="button"
            onClick={() => switchMode('password')}
            className="mt-4 w-full text-center text-xs text-slate-400 hover:text-slate-600"
          >
            ← Back to login
          </button>
        )}

      </div>
    </main>
  )
}