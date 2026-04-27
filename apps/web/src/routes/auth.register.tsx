import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '#/lib/api'
import { useAuthStore } from '#/lib/auth.store'
import { useUserStore } from '#/lib/user.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/auth/register')({ component: RegisterPage })

interface AuthResponse {
  user: { id: string; email: string; name: string; provider: string; accesses: string[] | null; avatarUrl?: string }
  tokens: { accessToken: string; refreshToken: string }
}

interface PublicSettings {
  registrationEnabled: boolean
  tokenRegistrationOnly: boolean
}

function RegisterPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useUserStore((s) => s.setUser)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirm?: string
    inviteToken?: string
  }>({})
  const [settings, setSettings] = useState<PublicSettings | null>(null)

  useEffect(() => {
    api
      .get<PublicSettings>('/api/auth/settings')
      .then(setSettings)
      .catch(() => setSettings({ registrationEnabled: true, tokenRegistrationOnly: false }))
  }, [])

  const requiresToken = settings?.tokenRegistrationOnly === true

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = (fd.get('name') as string).trim()
    const email = (fd.get('email') as string).trim()
    const password = fd.get('password') as string
    const confirm = fd.get('confirm') as string
    const inviteToken = ((fd.get('inviteToken') as string) ?? '').trim()

    const errs: typeof fieldErrors = {}
    if (name.length < 2) errs.name = 'At least 2 characters'
    if (!email || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email'
    if (password.length < 12) errs.password = 'At least 12 characters'
    if (password !== confirm) errs.confirm = 'Passwords do not match'
    if (requiresToken && !inviteToken) errs.inviteToken = 'Invite token is required'
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return
    }

    setFieldErrors({})
    setError('')
    setIsLoading(true)
    try {
      const body: Record<string, string> = { name, email, password }
      if (inviteToken) body.inviteToken = inviteToken
      const res = await api.post<AuthResponse>('/api/auth/register', body)
      setTokens(res.tokens)
      setUser({
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        provider: res.user.provider,
        isAdmin: false,
        accesses: res.user.accesses ?? [],
        avatarUrl: res.user.avatarUrl,
      })
      navigate({ to: '/dashboard' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  function clearField(field: keyof typeof fieldErrors) {
    setFieldErrors((p) => ({ ...p, [field]: undefined }))
  }

  if (settings?.registrationEnabled === false) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Registration closed</h1>
          <p className="text-sm text-muted-foreground">This instance is not accepting new accounts.</p>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          The administrator has disabled new registrations.
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/auth/login"
            search={{ redirect: undefined }}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">Free forever. No credit card required.</p>
      </div>

      {/* Global error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="reg-name" className="text-sm font-medium">
            Full name
          </label>
          <Input
            id="reg-name"
            name="name"
            placeholder="Jane Smith"
            autoComplete="name"
            autoFocus
            onChange={() => clearField('name')}
          />
          {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="reg-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="reg-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            onChange={() => clearField('email')}
          />
          {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="reg-password" className="text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <Input
              id="reg-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              className="pr-10"
              onChange={() => clearField('password')}
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

        {/* Confirm */}
        <div className="space-y-1.5">
          <label htmlFor="reg-confirm" className="text-sm font-medium">
            Confirm password
          </label>
          <Input
            id="reg-confirm"
            name="confirm"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            onChange={() => clearField('confirm')}
          />
          {fieldErrors.confirm && <p className="text-xs text-destructive">{fieldErrors.confirm}</p>}
        </div>

        {/* Invite token — only shown when required by admin settings */}
        {requiresToken && (
          <div className="space-y-1.5">
            <label htmlFor="reg-invite" className="text-sm font-medium flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" style={{ color: 'var(--sky-300)' }} />
              Invite token <span className="text-destructive">*</span>
            </label>
            <Input
              id="reg-invite"
              name="inviteToken"
              placeholder="Paste your invite token…"
              autoComplete="off"
              spellCheck={false}
              onChange={() => clearField('inviteToken')}
            />
            {fieldErrors.inviteToken && <p className="text-xs text-destructive">{fieldErrors.inviteToken}</p>}
            <p className="text-xs text-muted-foreground">Registration on this instance requires an invite token.</p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          to="/auth/login"
          search={{ redirect: undefined }}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
        {' · '}
        <Link to="/auth" className="font-medium text-foreground underline-offset-4 hover:underline">
          Guest mode
        </Link>
      </p>
    </div>
  )
}
