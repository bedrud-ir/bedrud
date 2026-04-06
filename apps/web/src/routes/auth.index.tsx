import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, Loader2, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '#/lib/auth.store'
import { useUserStore } from '#/lib/user.store'
import { api } from '#/lib/api'

export const Route = createFileRoute('/auth/')({ component: GuestPage })

interface AuthResponse {
  user: { id: string; email: string; name: string; provider: string; accesses: string[] | null; avatarUrl?: string }
  tokens: { accessToken: string; refreshToken: string }
}

function GuestPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useUserStore((s) => s.setUser)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) { setError('Name must be at least 2 characters'); return }
    setError('')
    setIsLoading(true)
    try {
      const res = await api.post<AuthResponse>('/api/auth/guest-login', { name: trimmed })
      setTokens(res.tokens)
      setUser({ id: res.user.id, email: res.user.email, name: res.user.name, provider: res.user.provider, isAdmin: false, accesses: res.user.accesses ?? [], avatarUrl: res.user.avatarUrl })
      navigate({ to: '/dashboard' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UserRound className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Join as guest</h1>
        <p className="text-sm text-muted-foreground">
          No account needed — just pick a name and you're in.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="guest-name" className="text-sm font-medium">
            Display name
          </label>
          <Input
            id="guest-name"
            placeholder="What should we call you?"
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
            autoFocus
            autoComplete="nickname"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <Button type="submit" className="w-full gap-2" disabled={isLoading}>
          {isLoading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Joining…</>
            : <> Continue as guest <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground">
            have an account?
          </span>
        </div>
      </div>

      {/* Auth links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/auth/login" search={{ redirect: undefined }}>
          <Button variant="outline" className="w-full">
            Sign in
          </Button>
        </Link>
        <Link to="/auth/register">
          <Button variant="outline" className="w-full">
            Register
          </Button>
        </Link>
      </div>
    </div>
  )
}
