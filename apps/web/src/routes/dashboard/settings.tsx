import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { User, Lock, Mic } from 'lucide-react'

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsLayout,
})

const TABS = [
  { to: '/dashboard/settings' as const, label: 'Profile', icon: User, isIndex: true },
  { to: '/dashboard/settings/security' as const, label: 'Security', icon: Lock },
  { to: '/dashboard/settings/audio' as const, label: 'Audio', icon: Mic },
]

function SettingsLayout() {
  const { location } = useRouterState()
  const path = location.pathname

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Account{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}
          >
            settings
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, security, and audio preferences.
        </p>
      </div>

      {/* Tab strip */}
      <div
        className="flex gap-1 rounded-xl border p-1"
        style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
      >
        {TABS.map(({ to, label, icon: Icon, isIndex }) => {
          const active = isIndex
            ? path === '/dashboard/settings' || path === '/dashboard/settings/'
            : path.startsWith(to)

          return (
            <Link
              key={to}
              to={to}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150"
              style={
                active
                  ? {
                      background: 'linear-gradient(135deg, #6366f115 0%, #8b5cf615 100%)',
                      color: '#818cf8',
                      boxShadow: 'inset 0 0 0 1px #6366f125',
                    }
                  : { color: 'hsl(var(--muted-foreground))' }
              }
            >
              <Icon className="h-4 w-4 shrink-0" style={{ color: active ? '#818cf8' : undefined }} />
              {label}
            </Link>
          )
        })}
      </div>

      {/* Active tab content */}
      <Outlet />
    </div>
  )
}
