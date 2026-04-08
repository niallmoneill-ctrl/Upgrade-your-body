import Sidebar from '@/components/sidebar'
import NotificationBell from '@/components/notification-bell'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--uyb-bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header
          className="flex items-center justify-end px-6 py-3 md:px-6"
          style={{ borderBottom: '1px solid var(--uyb-card-border)' }}
        >
          {/* Spacer on mobile for hamburger button */}
          <div className="md:hidden flex-1" />
          <NotificationBell />
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}