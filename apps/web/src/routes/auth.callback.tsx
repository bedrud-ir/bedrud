import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { api } from '#/lib/api'
import { useAuthStore } from '#/lib/auth.store'
import type { User } from '#/lib/user.store'
import { useUserStore } from '#/lib/user.store'

interface MeResponse {
  id: string
  email: string
  name: string
  provider: string
  avatarUrl?: string
  accesses: string[]
}

export const Route = createFileRoute('/auth/callback')({
  component: OAuthCallback,
})

function OAuthCallback() {
  const navigate = useNavigate()
  const clearTokens = useAuthStore((s) => s.clear)
  const setUser = useUserStore((s) => s.setUser)

  useEffect(() => {
    // The server's OAuth callback already set the access_token as an
    // HTTP-only cookie (see server commit be894ef).  The auth middleware
    // reads it from that cookie when no Authorization header is present,
    // so /api/auth/me will authenticate purely via the cookie — no token
    // in the URL, no JS-accessible token needed.
    api
      .get<MeResponse>('/api/auth/me')
      .then((me) => {
        const user: User = {
          id: me.id,
          email: me.email,
          name: me.name,
          provider: me.provider,
          avatarUrl: me.avatarUrl,
          isAdmin: me.accesses?.includes('superadmin') ?? false,
          accesses: me.accesses ?? [],
        }
        setUser(user)
        navigate({ to: '/dashboard' })
      })
      .catch(() => {
        // Cookie missing, expired, or rejected — redirect to login
        clearTokens()
        navigate({ to: '/auth' })
      })
  }, [navigate, clearTokens, setUser])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground text-sm">Signing you in…</p>
    </div>
  )
}
