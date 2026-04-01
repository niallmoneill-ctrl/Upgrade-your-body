'use client'

import { useState } from 'react'

const initialReminders = [
  { id: 1, title: 'Morning check-in', time: '08:00', enabled: true },
  { id: 2, title: 'Drink water', time: '11:30', enabled: true },
  { id: 3, title: 'Meditation reset', time: '20:30', enabled: true },
  { id: 4, title: 'Weekly review', time: 'Sunday 18:00', enabled: false },
]

export default function RemindersPage() {
  const [reminders, setReminders] = useState(initialReminders)

  function toggleReminder(id: number) {
    setReminders((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          Reminders
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Keep users consistent without overwhelming them
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400 md:text-base">
          Set simple reminders to support healthy habits and weekly reflection.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <div className="space-y-3">
          {reminders.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl bg-slate-100 p-4 dark:bg-slate-800"
            >
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {item.time}
                </div>
              </div>

              <button
                onClick={() => toggleReminder(item.id)}
                className={`relative h-8 w-16 rounded-full transition ${
                  item.enabled
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                    item.enabled ? 'left-9' : 'left-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}