export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          Settings
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Profile and preferences
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400 md:text-base">
          Starter account and preference settings for the app.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="font-semibold">Profile</div>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Name</label>
              <input
                defaultValue="Founder Preview"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <input
                defaultValue="founder@example.com"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="font-semibold">Preferences</div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <div>
                <div className="font-medium">Theme</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Controlled in the app shell later
                </div>
              </div>
              <div className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-300">
                Active
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <div>
                <div className="font-medium">Plan</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Free early access
                </div>
              </div>
              <div className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-300">
                Free
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}