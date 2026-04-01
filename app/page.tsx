import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Upgrade Your Body
        </div>

        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Track your health, habits, and progress in one place
        </h1>

        <p className="mt-4 max-w-2xl text-base text-slate-600">
          A web app for daily tracking, weekly review, reminders, and long-term consistency.
          Free during early access.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Get started free
          </Link>

          <Link
            href="/login"
            className="inline-flex rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  )
}