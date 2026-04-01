import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import { useAuthStore } from '#/lib/auth.store'
import { useUserStore } from '#/lib/user.store'

interface JWTPayload {
  userId: string
  email: string
  name: string
  provider: string
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
  const setUser = useUserStore((s) => s.setUser)

  useEffect(() => {
    if (!token) {
      navigate({ to: '/auth' })
      return
    }
    try {
      const payload = jwtDecode<JWTPayload>(token)
      setTokens({ accessToken: token, refreshToken: '' })
      setUser({
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        provider: payload.provider,
        isAdmin: payload.accesses?.includes('superadmin') ?? false,
        accesses: payload.accesses ?? [],
      })
      navigate({ to: '/dashboard' })
    } catch {
      navigate({ to: '/auth' })
    }
  }, [token, navigate, setTokens, setUser])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground text-sm">Signing you in…</p>
    </div>
  )
}
