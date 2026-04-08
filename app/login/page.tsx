'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'magic' | 'password' | 'reset'

function LoginForm() {
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

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `https://app.oneill-labs.com/auth/callback`,
      },
    })
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
          emailRedirectTo: `https://app.oneill-labs.com/auth/callback`,
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
        redirectTo: `https://app.oneill-labs.com/auth/callback?next=/app/update-password`,
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

      {authError === 'auth_failed' && (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-500">
          Login link expired or invalid. Please try again.
        </p>
      )}

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

      {mode === 'reset' && (
        <button
          type="button"
          onClick={() => switchMode('password')}
          className="mt-4 w-full text-center text-xs text-slate-400 hover:text-slate-600"
        >
          ← Back to login
        </button>
      )}

      {mode !== 'reset' && (
        <>
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or continue with</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-slate-400">
        Don't have an account?{' '}
        <a href="/signup" className="text-cyan-600 hover:underline">
          Sign up
        </a>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Suspense fallback={<div className="text-sm text-slate-400">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}