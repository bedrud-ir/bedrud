import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { GuestLoginForm } from '@/components/auth/GuestLoginForm'
import { PasskeyButton } from '@/components/auth/PasskeyButton'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { useAuthStore } from '#/lib/auth.store'
import { useUserStore } from '#/lib/user.store'
import { api } from '#/lib/api'

export const Route = createFileRoute('/auth/')({
  component: AuthPage,
})

interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    provider: string
    accesses: string[] | null
    avatarUrl?: string
  }
  tokens: { accessToken: string; refreshToken: string }
}

function AuthPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useUserStore((s) => s.setUser)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSuccess(res: AuthResponse) {
    setTokens(res.tokens)
    setUser({
      id: res.user.id,
      email: res.user.email,
      name: res.user.name,
      provider: res.user.provider,
      isAdmin: res.user.accesses?.includes('superadmin') ?? false,
      avatarUrl: res.user.avatarUrl,
    })
    navigate({ to: '/dashboard' })
  }

  async function handleLogin(data: { email: string; password: string }) {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.post<AuthResponse>('/api/auth/login', data)
      handleSuccess(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRegister(data: { name: string; email: string; password: string }) {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.post<AuthResponse>('/api/auth/register', data)
      handleSuccess(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGuestLogin(name: string) {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.post<AuthResponse>('/api/auth/guest-login', { name })
      handleSuccess(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Guest login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <Tabs defaultValue="login">
        <TabsList className="w-full">
          <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
          <TabsTrigger value="register" className="flex-1">Register</TabsTrigger>
          <TabsTrigger value="guest" className="flex-1">Guest</TabsTrigger>
          <TabsTrigger value="passkey" className="flex-1">Passkey</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm onLogin={handleLogin} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="register">
          <RegisterForm onRegister={handleRegister} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="guest">
          <GuestLoginForm onGuestLogin={handleGuestLogin} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="passkey">
          <PasskeyButton onSuccess={handleSuccess} />
        </TabsContent>
      </Tabs>
      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
          or continue with
        </span>
      </div>
      <OAuthButtons />
    </div>
  )
}
