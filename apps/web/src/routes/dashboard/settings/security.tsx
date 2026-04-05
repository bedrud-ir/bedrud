import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useUserStore } from '#/lib/user.store'
import { api } from '#/lib/api'
import { Loader2, Check, Lock, LogIn } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/dashboard/settings/security')({
  component: SecurityPage,
})

/* ── Shared section wrapper ───────────────────────────────────────────────── */
function Section({
  title,
  sub,
  icon: Icon,
  children,
}: {
  title: string
  sub: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
      <div
        className="flex items-center gap-3 px-6 py-4 border-b"
        style={{ background: 'linear-gradient(135deg, #6366f108, #8b5cf608)' }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'linear-gradient(135deg, #6366f120, #8b5cf620)', color: '#818cf8' }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

/* ── Alert ────────────────────────────────────────────────────────────────── */
function Alert({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
      style={
        type === 'success'
          ? { background: '#10b98112', border: '1px solid #10b98130', color: '#10b981' }
          : { background: '#ef444412', border: '1px solid #ef444430', color: '#ef4444' }
      }
    >
      {type === 'success' && <Check className="h-4 w-4 shrink-0" />}
      {message}
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
function SecurityPage() {
  const user = useUserStore((s) => s.user)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const isOAuthOnly = user?.provider && !['local', 'passkey'].includes(user.provider)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const currentPassword = fd.get('currentPassword') as string
    const newPassword = fd.get('newPassword') as string
    const confirmPassword = fd.get('confirmPassword') as string

    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'New password must be at least 6 characters' })
      return
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match' })
      return
    }

    setIsLoading(true)
    setStatus(null)
    try {
      await api.put('/api/auth/password', { currentPassword, newPassword })
      setStatus({ type: 'success', message: 'Password updated. You can log in with your new password.' })
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update password' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Section title="Password" sub="Change your account password" icon={Lock}>
      {isOAuthOnly ? (
        <div
          className="flex items-start gap-3 rounded-xl border p-4 text-sm"
          style={{ borderColor: '#8b5cf630', background: '#8b5cf608' }}
        >
          <LogIn className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#a78bfa' }} />
          <p className="text-muted-foreground">
            Your account uses{' '}
            <span className="font-medium text-foreground capitalize">{user?.provider}</span> for
            sign-in. Password management is handled by your identity provider.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              placeholder="••••••••"
              required
              onChange={() => setStatus(null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="Min. 6 characters"
              required
              onChange={() => setStatus(null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              onChange={() => setStatus(null)}
            />
          </div>
          {status && <Alert {...status} />}
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 4px 14px #6366f138' }}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Update password
          </button>
        </form>
      )}
    </Section>
  )
}
