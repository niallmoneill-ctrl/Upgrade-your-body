import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* App card */}
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
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
              href="/pricing"
              className="inline-flex rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white"
            >
              View pricing
            </Link>

            <Link
              href="/login"
              className="inline-flex rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Audiobook card */}
        <div
          style={{
            borderRadius: '32px',
            padding: '2rem 2rem',
            background: '#0a0f1a',
            border: '2px solid rgba(65,217,138,0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <p style={{ fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', color: '#6b7280', margin: 0 }}>
            Audiobook
          </p>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f3f4f6', margin: 0, lineHeight: 1.2 }}>
            Now Available as an Audiobook
          </h2>

          <p style={{ fontSize: '1rem', color: '#9ca3af', margin: 0, lineHeight: 1.6, maxWidth: '520px' }}>
            Upgrade Your Body — narrated by Niall O&apos;Neill. 15 chapters. All the frameworks. Your voice in your ear.
          </p>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#41d98a' }}>$4.99</span>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>one-time</span>
          </div>

          <div>
            <a
              href="https://buy.stripe.com/8x228rgun0Dw0qUaBA8bS00"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '13px 28px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                textDecoration: 'none',
                background: '#41d98a',
                color: '#0a0f1a',
                letterSpacing: '0.01em',
              }}
            >
              Buy Audiobook
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}