'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/theme-provider'
import {
  LayoutDashboard, Target, CalendarCheck, Bell,
  Settings, LogOut, Sun, Moon, Menu, X,
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)

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

  const SidebarContent = () => (
    <div
      className="flex h-full w-64 flex-col p-5"
      style={{
        background: 'var(--uyb-sidebar-bg)',
        borderRight: '1px solid var(--uyb-sidebar-border)',
      }}
    >
      {/* Logo */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-lg font-bold tracking-tight">
            <span className="uyb-gradient-text">Upgrade</span> Your Body
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--uyb-muted)' }}>
            Health tracking made simple
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          className="md:hidden"
          onClick={() => setOpen(false)}
          style={{ color: 'var(--uyb-muted)' }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
              style={
                active
                  ? { background: 'var(--uyb-btn-gradient)', color: '#041019', boxShadow: '0 4px 16px rgba(42,157,110,0.2)' }
                  : { color: 'var(--uyb-muted)' }
              }
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--uyb-surface)' }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom buttons — always pinned */}
      <div
        className="space-y-1 pt-4"
        style={{ borderTop: '1px solid var(--uyb-card-border)' }}
      >
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

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 min-h-screen"
        style={{ background: 'var(--uyb-sidebar-bg)', borderRight: '1px solid var(--uyb-sidebar-border)' }}
      >
        <SidebarContent />
      </div>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-3 left-4 z-50 rounded-xl p-2"
        style={{ background: 'var(--uyb-surface)', color: 'var(--uyb-muted)' }}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile slide-in sidebar */}
      <div
        className="md:hidden fixed top-0 left-0 z-50 h-full transition-transform duration-300"
        style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <SidebarContent />
      </div>
    </>
  )
}