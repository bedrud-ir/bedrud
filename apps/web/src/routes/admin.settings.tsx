import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Settings, UserPlus, KeyRound, Trash2, Copy, Check, Clock } from 'lucide-react'
import { api } from '#/lib/api'

interface SystemSettings {
  id: number
  registrationEnabled: boolean
  tokenRegistrationOnly: boolean
  updatedAt: string
}

interface InviteToken {
  id: string
  token: string
  email: string
  createdBy: string
  expiresAt: string
  usedAt: string | null
  usedBy: string
  createdAt: string
}

export const Route = createFileRoute('/admin/settings')({ component: AdminSettingsPage })

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className="relative h-6 w-10 rounded-full transition-all duration-200 focus:outline-none disabled:opacity-50"
      style={{
        background: checked
          ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
          : 'hsl(var(--muted))',
        boxShadow: checked ? '0 0 0 1px #6366f140' : undefined,
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

function TokenStatus({ token }: { token: InviteToken }) {
  const now = new Date()
  const expires = new Date(token.expiresAt)
  if (token.usedAt) return <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: '#71717a15', color: '#a1a1aa' }}>Used</span>
  if (now > expires) return <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: '#ef444415', color: '#f87171' }}>Expired</span>
  return <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: '#10b98115', color: '#34d399' }}>Valid</span>
}

function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const [expiresIn, setExpiresIn] = useState(72)
  const [tokenEmail, setTokenEmail] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newToken, setNewToken] = useState<InviteToken | null>(null)

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.get<SystemSettings>('/api/admin/settings'),
  })

  const { data: tokensData, isLoading: tokensLoading } = useQuery({
    queryKey: ['admin', 'invite-tokens'],
    queryFn: () => api.get<{ tokens: InviteToken[] }>('/api/admin/invite-tokens'),
  })

  const updateSettings = useMutation({
    mutationFn: (s: Partial<SystemSettings>) => api.put('/api/admin/settings', s),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  })

  const createToken = useMutation({
    mutationFn: () => api.post<InviteToken>('/api/admin/invite-tokens', {
      email: tokenEmail,
      expiresInHours: expiresIn,
    }),
    onSuccess: (token) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invite-tokens'] })
      setNewToken(token)
      setTokenEmail('')
    },
  })

  const deleteToken = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/invite-tokens/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'invite-tokens'] }),
  })

  function copyToken(token: InviteToken) {
    navigator.clipboard.writeText(token.token)
    setCopiedId(token.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const tokens = tokensData?.tokens ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" style={{ color: '#818cf8' }} />
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}>
            System settings
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure registration, security, and access controls.</p>
      </div>

      {/* Registration section */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
        <div
          className="flex items-center gap-3 border-b px-5 py-4"
          style={{ background: 'linear-gradient(135deg, #6366f108, #8b5cf608)' }}
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: '#6366f115', color: '#818cf8' }}
          >
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Registration</p>
            <p className="text-xs text-muted-foreground">Control who can create new accounts</p>
          </div>
        </div>

        <div className="divide-y px-5" style={{ borderColor: 'hsl(var(--border))' }}>
          {settingsLoading ? (
            <div className="py-4 space-y-3 animate-pulse">
              <div className="h-4 w-48 rounded-full bg-muted" />
              <div className="h-4 w-64 rounded-full bg-muted" />
            </div>
          ) : (
            <>
              <ToggleRow
                label="Allow new registrations"
                description="When disabled, no new accounts can be created (existing users unaffected)"
                checked={settings?.registrationEnabled ?? true}
                onChange={(v) => updateSettings.mutate({ ...settings, registrationEnabled: v })}
                disabled={updateSettings.isPending}
              />
              <ToggleRow
                label="Require invite token"
                description="New users must provide a valid invite token to register"
                checked={settings?.tokenRegistrationOnly ?? false}
                onChange={(v) => updateSettings.mutate({ ...settings, tokenRegistrationOnly: v })}
                disabled={updateSettings.isPending || !settings?.registrationEnabled}
              />
            </>
          )}
        </div>
      </div>

      {/* Invite tokens section */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ background: 'linear-gradient(135deg, #8b5cf608, #06b6d408)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: '#8b5cf615', color: '#a78bfa' }}
            >
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Invite tokens</p>
              <p className="text-xs text-muted-foreground">Generate single-use registration links</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{tokens.length} token{tokens.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Generate form */}
        <div className="border-b px-5 py-4 space-y-3" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={tokenEmail}
              onChange={(e) => setTokenEmail(e.target.value)}
              placeholder="Lock to email (optional)"
              className="flex-1 rounded-xl border px-3 py-2 text-sm bg-transparent outline-none focus:ring-1"
              style={{ borderColor: 'hsl(var(--border))' }}
            />
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(+e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm bg-transparent outline-none cursor-pointer"
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              <option value={24}>24 hours</option>
              <option value={72}>72 hours</option>
              <option value={168}>7 days</option>
              <option value={720}>30 days</option>
            </select>
            <button
              onClick={() => createToken.mutate()}
              disabled={createToken.isPending}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
            >
              {createToken.isPending ? 'Generating…' : 'Generate'}
            </button>
          </div>

          {/* New token reveal */}
          {newToken && (
            <div
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{ borderColor: '#10b98130', background: '#10b98108' }}
            >
              <p className="flex-1 font-mono text-xs break-all" style={{ color: '#34d399' }}>{newToken.token}</p>
              <button
                onClick={() => copyToken(newToken)}
                className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-muted"
                title="Copy token"
              >
                {copiedId === newToken.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </button>
              <button
                onClick={() => setNewToken(null)}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Token list */}
        <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
          {tokensLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 animate-pulse">
                <div className="h-4 flex-1 rounded-full bg-muted" />
                <div className="h-5 w-12 rounded-full bg-muted" />
              </div>
            ))
          ) : tokens.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No invite tokens yet</p>
          ) : tokens.map((tok) => (
            <div key={tok.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-muted-foreground truncate">{tok.token.slice(0, 16)}…</p>
                {tok.email && <p className="text-xs text-muted-foreground">{tok.email}</p>}
                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  expires {new Date(tok.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <TokenStatus token={tok} />
              <button
                onClick={() => copyToken(tok)}
                className="rounded-lg p-1.5 transition-colors hover:bg-muted"
                title="Copy token"
                disabled={!!tok.usedAt || new Date() > new Date(tok.expiresAt)}
              >
                {copiedId === tok.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
              <button
                onClick={() => deleteToken.mutate(tok.id)}
                disabled={deleteToken.isPending}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                title="Revoke token"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
