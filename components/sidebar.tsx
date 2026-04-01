'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  const nav = [
    { name: 'Dashboard', href: '/app/dashboard' },
    { name: 'Tracker', href: '/app/tracker' },
    { name: 'Weekly Review', href: '/app/weekly-review' },
    { name: 'Reminders', href: '/app/reminders' },
    { name: 'Settings', href: '/app/settings' },
  ]

  return (
    <div className="w-64 border-r border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 text-lg font-bold">
        Upgrade Your Body
      </div>

      <nav className="space-y-2">
        {nav.map((item) => {
          const active = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`block rounded-xl px-3 py-2 text-sm font-medium ${
                active
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}