export default function AppPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-10 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">App Home</h1>
        <p className="mt-4 text-slate-600">
          This is the main app entry page. Navigate to the dashboard to see your user workspace.
        </p>
      </div>
    </main>
  )
}
