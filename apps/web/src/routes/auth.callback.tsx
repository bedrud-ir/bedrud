import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
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
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search['token'] as string | undefined) ?? '',
  }),
  component: OAuthCallback,
})

function OAuthCallback() {
  const navigate = useNavigate()
  const { token } = useSearch({ from: '/auth/callback' })
  const setTokens = useAuthStore((s) => s.setTokens)
  const clearTokens = useAuthStore((s) => s.clear)
  const setUser = useUserStore((s) => s.setUser)

  useEffect(() => {
    if (!token) {
      navigate({ to: '/auth' })
      return
    }

    // Store the token first so api.get can attach it as Bearer,
    // then verify via /auth/me — the server validates the JWT signature.
    setTokens({ accessToken: token, refreshToken: null })

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
        // Token rejected by server — clear it and send back to login
        clearTokens()
        navigate({ to: '/auth' })
      })
  }, [token, navigate, setTokens, clearTokens, setUser])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground text-sm">Signing you in…</p>
    </div>
  )
}
