import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { LogOut, Video } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '#/lib/auth.store'
import { useUserStore } from '#/lib/user.store'
import { api } from '#/lib/api'
import type { User } from '#/lib/user.store'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    if (!useAuthStore.getState().tokens) {
      throw redirect({ to: '/auth' })
    }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clear)
  const clearUser = useUserStore((s) => s.clear)
  const setUser = useUserStore((s) => s.setUser)

  // Fetch current user if not in store
  useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const u = await api.get<User & { accesses?: string[] }>('/api/auth/me')
      setUser({
        id: u.id,
        email: u.email,
        name: u.name,
        provider: u.provider,
        isAdmin: u.accesses?.includes('superadmin') ?? false,
        avatarUrl: u.avatarUrl,
      })
      return u
    },
    enabled: !user,
  })

  async function handleLogout() {
    try {
      const refreshToken = useAuthStore.getState().tokens?.refreshToken
      if (refreshToken) {
        await api.post('/api/auth/logout', { refresh_token: refreshToken })
      }
    } catch {
      // ignore logout errors
    } finally {
      clearAuth()
      clearUser()
      navigate({ to: '/auth' })
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <span className="font-semibold">Bedrud</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">{user?.name ?? '…'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</p>
              </div>
              <DropdownMenuSeparator />
              {user?.isAdmin && (
                <DropdownMenuItem onClick={() => navigate({ to: '/admin' })}>
                  Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
