import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useUserStore } from '#/lib/user.store'
import { api } from '#/lib/api'
import { Loader2, Check, Shield, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/dashboard/settings/')({
  component: ProfilePage,
})

function Alert({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-md border px-3 py-2 text-xs',
      type === 'success'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : 'border-destructive/30 bg-destructive/10 text-destructive',
    )}>
      {type === 'success'
        ? <Check className="h-3.5 w-3.5 shrink-0" />
        : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
      {message}
    </div>
  )
}

function ProfilePage() {
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)
  const [name, setName] = useState(user?.name ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) { setStatus({ type: 'error', message: 'Name must be at least 2 characters' }); return }
    setIsLoading(true); setStatus(null)
    try {
      const updated = await api.put<{
        id: string; name: string; email: string; provider: string
        accesses: string[] | null; avatarUrl?: string
      }>('/api/auth/me', { name: trimmed })
      if (user) setUser({ ...user, name: updated.name, isAdmin: updated.accesses?.includes('superadmin') ?? user.isAdmin })
      setStatus({ type: 'success', message: 'Name updated.' })
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update name' })
    } finally { setIsLoading(false) }
  }

  const rows = [
    { label: 'Account ID', value: user?.id ?? '—', mono: true },
    { label: 'Sign-in method', value: user?.provider ? user.provider.charAt(0).toUpperCase() + user.provider.slice(1) : '—' },
    { label: 'Role', value: user?.isAdmin ? 'Superadmin' : 'User' },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Profile form */}
      <div className="rounded-xl border bg-card/50">
        <div className="border-b px-5 py-3">
          <p className="text-sm font-semibold">Profile</p>
          <p className="text-xs text-muted-foreground">Update your display name</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          <div className="space-y-1.5">
            <label htmlFor="settings-name" className="text-xs font-medium text-muted-foreground">Display name</label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setStatus(null) }}
              placeholder="Your name"
              className="h-9 text-sm"
            />
          </div>
          {user?.email && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input value={user.email} disabled className="h-9 text-sm opacity-60" />
            </div>
          )}
          {status && <Alert {...status} />}
          <button
            type="submit"
            disabled={isLoading || name.trim() === user?.name}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Save changes
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="rounded-xl border bg-card/50">
        <div className="border-b px-5 py-3">
          <p className="text-sm font-semibold">Account</p>
          <p className="text-xs text-muted-foreground">Your account details</p>
        </div>
        <div className="divide-y p-5">
          {rows.map(({ label, value, mono }) => (
            <div key={label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className={cn('text-xs font-medium truncate max-w-[240px]', mono && 'font-mono')}>{value}</span>
            </div>
          ))}
          {user?.isAdmin && (
            <div className="pt-3 flex items-center gap-1.5 text-xs font-medium text-primary">
              <Shield className="h-3 w-3" /> Superadmin — full system access
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
