import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, Fingerprint, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '#/lib/api'
import { useAuthStore } from '#/lib/auth.store'
import { useUserStore } from '#/lib/user.store'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/auth/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' && search.redirect.startsWith('/') ? search.redirect : undefined,
  }),
  component: LoginPage,
})

interface AuthResponse {
  user: { id: string; email: string; name: string; provider: string; accesses: string[] | null; avatarUrl?: string }
  tokens: { accessToken: string; refreshToken: string }
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}
function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function LoginPage() {
  const navigate = useNavigate()
  const { redirect } = Route.useSearch()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useUserStore((s) => s.setUser)

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState('')

  function handleSuccess(res: AuthResponse) {
    setTokens(res.tokens)
    setUser({
      id: res.user.id,
      email: res.user.email,
      name: res.user.name,
      provider: res.user.provider,
      isAdmin: res.user.accesses?.includes('superadmin') ?? false,
      accesses: res.user.accesses ?? [],
      avatarUrl: res.user.avatarUrl,
    })
    navigate({ to: redirect ?? '/dashboard' })
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = (fd.get('email') as string).trim()
    const password = fd.get('password') as string
    const errs: typeof fieldErrors = {}
    if (!email || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email'
    if (!password || password.length < 6) errs.password = 'At least 6 characters'
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    setError('')
    setIsLoading(true)
    try {
      const res = await api.post<AuthResponse>('/api/auth/login', { email, password })
      handleSuccess(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePasskey() {
    setIsPasskeyLoading(true)
    setError('')
    try {
      const opts = await api.post<Record<string, unknown>>('/api/auth/passkey/login/begin')
      const cred = (await navigator.credentials.get({
        publicKey: {
          challenge: base64ToBuffer(opts['challenge'] as string),
          timeout: opts['timeout'] as number | undefined,
          rpId: opts['rpId'] as string | undefined,
          userVerification: opts['userVerification'] as UserVerificationRequirement | undefined,
          allowCredentials: (opts['allowCredentials'] as Array<{ id: string; type: 'public-key' }> | undefined)?.map(
            (c) => ({ id: base64ToBuffer(c.id), type: c.type }),
          ),
        },
      })) as PublicKeyCredential
      const assertion = cred.response as AuthenticatorAssertionResponse
      const res = await api.post<AuthResponse>('/api/auth/passkey/login/finish', {
        credentialId: bufferToBase64(cred.rawId),
        clientDataJSON: bufferToBase64(assertion.clientDataJSON),
        authenticatorData: bufferToBase64(assertion.authenticatorData),
        signature: bufferToBase64(assertion.signature),
      })
      handleSuccess(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passkey authentication failed')
    } finally {
      setIsPasskeyLoading(false)
    }
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account to continue.</p>
      </div>

      {/* Global error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Email/password form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            onChange={() => setFieldErrors((p) => ({ ...p, email: undefined }))}
          />
          {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pr-10"
              onChange={() => setFieldErrors((p) => ({ ...p, password: undefined }))}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground">or continue with</span>
        </div>
      </div>

      {/* Passkey */}
      <Button variant="outline" className="w-full gap-2" onClick={handlePasskey} disabled={isPasskeyLoading}>
        {isPasskeyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
        {isPasskeyLoading ? 'Authenticating…' : 'Sign in with Passkey'}
      </Button>

      {/* OAuth */}
      <OAuthButtons />

      {/* Footer links */}
      <p className="text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link to="/auth/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Register
        </Link>
        {' · '}
        <Link to="/auth" className="font-medium text-foreground underline-offset-4 hover:underline">
          Guest mode
        </Link>
      </p>
    </div>
  )
}
