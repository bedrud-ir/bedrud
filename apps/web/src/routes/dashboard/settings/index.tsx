import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useUserStore } from '#/lib/user.store'
import { api } from '#/lib/api'
import { Loader2, Check, User, Shield } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/dashboard/settings/')({
  component: ProfilePage,
})

/* ── Section ──────────────────────────────────────────────────────────────── */
function Section({
  title, sub, icon: Icon, children,
}: {
  title: string; sub: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="flex items-center gap-3 px-6 py-4 border-b"
        style={{ background: 'linear-gradient(135deg, #6366f108, #8b5cf608)' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'linear-gradient(135deg, #6366f120, #8b5cf620)', color: '#818cf8' }}>
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
    <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
      style={type === 'success'
        ? { background: '#10b98112', border: '1px solid #10b98130', color: '#10b981' }
        : { background: '#ef444412', border: '1px solid #ef444430', color: '#ef4444' }}>
      {type === 'success' && <Check className="h-4 w-4 shrink-0" />}
      {message}
    </div>
  )
}

/* ── Profile ──────────────────────────────────────────────────────────────── */
function ProfileSection() {
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
      setStatus({ type: 'success', message: 'Name updated successfully.' })
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update name' })
    } finally { setIsLoading(false) }
  }

  return (
    <Section title="Profile" sub="Update your display name" icon={User}>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <div className="space-y-1.5">
          <Label htmlFor="settings-name">Display name</Label>
          <Input id="settings-name" value={name} onChange={(e) => { setName(e.target.value); setStatus(null) }} placeholder="Your name" />
        </div>
        {user?.email && (
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Email</Label>
            <Input value={user.email} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>
        )}
        {status && <Alert {...status} />}
        <button type="submit" disabled={isLoading || name.trim() === user?.name}
          className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 4px 14px #6366f138' }}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save changes
        </button>
      </form>
    </Section>
  )
}

/* ── Account ──────────────────────────────────────────────────────────────── */
function AccountInfoSection() {
  const user = useUserStore((s) => s.user)
  const rows = [
    { label: 'Account ID',     value: user?.id ?? '—',                                                                mono: true },
    { label: 'Sign-in method', value: user?.provider ? user.provider.charAt(0).toUpperCase() + user.provider.slice(1) : '—' },
    { label: 'Role',           value: user?.isAdmin ? 'Superadmin' : 'User' },
  ]
  return (
    <Section title="Account" sub="Your account details" icon={Shield}>
      <div className="space-y-0 max-w-sm divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
        {rows.map(({ label, value, mono }) => (
          <div key={label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium truncate max-w-[200px]"
              style={mono ? { fontFamily: 'monospace' } : undefined}>{value}</span>
          </div>
        ))}
        {user?.isAdmin && (
          <div className="pt-3 flex items-center gap-2 text-xs font-medium" style={{ color: '#818cf8' }}>
            <Shield className="h-3.5 w-3.5" />
            Superadmin — full system access
          </div>
        )}
      </div>
    </Section>
  )
}

function ProfilePage() {
  return (
    <div className="space-y-6">
      <ProfileSection />
      <AccountInfoSection />
    </div>
  )
}
