'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/theme-provider'
import {
  LayoutDashboard,
  Target,
  CalendarCheck,
  Bell,
  Settings,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggle } = useTheme()

  const nav = [
    { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Tracker', href: '/app/tracker', icon: Target },
    { name: 'Weekly Review', href: '/app/weekly-review', icon: CalendarCheck },
    { name: 'Reminders', href: '/app/reminders', icon: Bell },
    { name: 'Settings', href: '/app/settings', icon: Settings },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div
      className="flex w-64 flex-col p-5"
      style={{
        background: 'var(--uyb-sidebar-bg)',
        borderRight: '1px solid var(--uyb-sidebar-border)',
      }}
    >
      <div className="mb-8">
        <div className="text-lg font-bold tracking-tight">
          <span className="uyb-gradient-text">Upgrade</span> Your Body
        </div>
        <div className="mt-1 text-xs" style={{ color: 'var(--uyb-muted)' }}>
          Health tracking made simple
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
              style={
                active
                  ? {
                      background: 'linear-gradient(90deg, var(--uyb-green), #64f0b1)',
                      color: '#041019',
                      boxShadow: '0 4px 16px rgba(65,217,138,0.25)',
                    }
                  : {
                      color: 'var(--uyb-muted)',
                    }
              }
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'var(--uyb-surface)'
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent'
              }}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-1 pt-4" style={{ borderTop: '1px solid var(--uyb-card-border)' }}>
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition"
          style={{ color: 'var(--uyb-muted)' }}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition"
          style={{ color: 'var(--uyb-muted)' }}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  )
}
