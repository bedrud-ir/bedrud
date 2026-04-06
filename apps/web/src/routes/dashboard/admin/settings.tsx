import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { KeyRound, Trash2, Copy, Check, Clock, Globe, Ban, Loader2 } from 'lucide-react'
import { api } from '#/lib/api'
import { cn } from '@/lib/utils'

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

export const Route = createFileRoute('/dashboard/admin/settings')({ component: AdminSettingsPage })

type RegMode = 'open' | 'invite' | 'closed'

function getMode(s: SystemSettings): RegMode {
  if (!s.registrationEnabled) return 'closed'
  if (s.tokenRegistrationOnly) return 'invite'
  return 'open'
}

function modeToSettings(mode: RegMode): Pick<SystemSettings, 'registrationEnabled' | 'tokenRegistrationOnly'> {
  if (mode === 'open')   return { registrationEnabled: true,  tokenRegistrationOnly: false }
  if (mode === 'invite') return { registrationEnabled: true,  tokenRegistrationOnly: true }
  return                        { registrationEnabled: false, tokenRegistrationOnly: false }
}

const MODES: { id: RegMode; icon: React.ElementType; label: string; description: string }[] = [
  { id: 'open',   icon: Globe,    label: 'Open',        description: 'Anyone can create an account' },
  { id: 'invite', icon: KeyRound, label: 'Invite-only', description: 'Valid invite token required' },
  { id: 'closed', icon: Ban,      label: 'Closed',      description: 'No new registrations' },
]

function tokenExpiry(tok: InviteToken): 'used' | 'expired' | 'valid' {
  if (tok.usedAt) return 'used'
  if (new Date() > new Date(tok.expiresAt)) return 'expired'
  return 'valid'
}

function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const [expiresIn, setExpiresIn] = useState(72)
  const [tokenEmail, setTokenEmail] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newToken, setNewToken] = useState<InviteToken | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmGenerate, setConfirmGenerate] = useState(false)

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
      email: tokenEmail || undefined,
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
    void navigator.clipboard.writeText(token.token)
    setCopiedId(token.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const currentMode = settings ? getMode(settings) : null
  const tokens = tokensData?.tokens ?? []
  const validCount = tokens.filter((t) => tokenExpiry(t) === 'valid').length

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-sm font-semibold">System settings</h1>
        <p className="text-xs text-muted-foreground">Registration policy and invite management.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* ── Left: Registration mode ── */}
        <div className="rounded-xl border bg-card/50">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div>
              <p className="text-sm font-semibold">Registration</p>
              <p className="text-xs text-muted-foreground">Who can create accounts</p>
            </div>
            {updateSettings.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
          <div className="space-y-2 p-5">
            {settingsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-lg border bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              MODES.map(({ id, icon: Icon, label, description }) => {
                const active = currentMode === id
                return (
                  <button
                    key={id}
                    onClick={() => updateSettings.mutate({ ...settings, ...modeToSettings(id) })}
                    disabled={updateSettings.isPending}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors disabled:opacity-60',
                      active
                        ? id === 'closed'
                          ? 'border-destructive/40 bg-destructive/5'
                          : 'border-primary/30 bg-primary/5'
                        : 'hover:bg-accent',
                    )}
                  >
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                      active
                        ? id === 'closed'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium',
                        active
                          ? id === 'closed' ? 'text-destructive' : 'text-primary'
                          : 'text-foreground',
                      )}>
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <div className={cn(
                      'h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center',
                      active
                        ? id === 'closed' ? 'border-destructive bg-destructive' : 'border-primary bg-primary'
                        : 'border-muted-foreground/30',
                    )}>
                      {active && <Check className="h-2 w-2 text-white" />}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Right: Invite tokens ── */}
        <div className="rounded-xl border bg-card/50">
          <div className="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Invite tokens</p>
              <p className="text-xs text-muted-foreground">Generate and manage registration tokens</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {validCount > 0 && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {validCount} active
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">{tokens.length} total</span>
            </div>
          </div>

          {/* Generate form */}
          <div className="border-b px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={tokenEmail}
                onChange={(e) => setTokenEmail(e.target.value)}
                placeholder="Lock to email (optional)"
                className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-xs outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
              {/* Select + button share a row on mobile */}
              <div className="flex gap-2 sm:contents">
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(+e.target.value)}
                  className="h-8 w-28 shrink-0 rounded-lg border border-input bg-background px-2.5 text-xs outline-none cursor-pointer text-foreground"
                >
                  <option value={24}>24 h</option>
                  <option value={72}>72 h</option>
                  <option value={168}>7 days</option>
                  <option value={720}>30 days</option>
                </select>
                <button
                  onClick={() => setConfirmGenerate(true)}
                  disabled={createToken.isPending}
                  className="inline-flex h-8 flex-1 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:flex-none"
                >
                  {createToken.isPending
                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</>
                    : <><KeyRound className="h-3 w-3" /> Generate</>}
                </button>
              </div>
            </div>

            {/* Confirm */}
            {confirmGenerate && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                <p className="flex-1 text-xs text-muted-foreground">
                  Generate {tokenEmail ? `token for ${tokenEmail}` : 'invite token'}, expires in{' '}
                  {expiresIn === 24 ? '24h' : expiresIn === 72 ? '72h' : expiresIn === 168 ? '7 days' : '30 days'}?
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setConfirmGenerate(false)}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setConfirmGenerate(false); createToken.mutate() }}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                  >
                    <Check className="h-3 w-3" /> Confirm
                  </button>
                </div>
              </div>
            )}

            {/* New token banner */}
            {newToken && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <p className="flex-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 break-all">{newToken.token}</p>
                <button
                  onClick={() => copyToken(newToken)}
                  className="shrink-0 rounded-md p-1 hover:bg-muted"
                >
                  {copiedId === newToken.id
                    ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                    : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                <button onClick={() => setNewToken(null)} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Token list */}
          {tokensLoading ? (
            <div className="divide-y">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse sm:px-5">
                  <div className="h-3.5 w-40 rounded-full bg-muted" />
                  <div className="flex-1" />
                  <div className="h-4 w-12 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : tokens.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 py-10">
              <KeyRound className="h-5 w-5 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No tokens yet</p>
            </div>
          ) : (
            <div className="max-h-64 divide-y overflow-y-auto sm:max-h-80">
              {tokens.map((tok) => {
                const status = tokenExpiry(tok)
                const isInert = status !== 'valid'
                return (
                  <div
                    key={tok.id}
                    className={cn(
                      'group flex items-center gap-2 px-3 py-2.5 transition-colors sm:gap-3 sm:px-5',
                      isInert ? 'opacity-50' : 'hover:bg-accent/30',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] text-muted-foreground truncate">{tok.token.slice(0, 20)}…</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        {tok.email && <span className="truncate text-[10px] text-muted-foreground/70 max-w-[10rem]">{tok.email}</span>}
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
                          <Clock className="h-2.5 w-2.5 shrink-0" />
                          {new Date(tok.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <span className={cn(
                      'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                      status === 'valid'   && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                      status === 'expired' && 'border-destructive/30 bg-destructive/10 text-destructive',
                      status === 'used'    && 'border-border bg-muted text-muted-foreground',
                    )}>
                      {status === 'valid' ? 'Active' : status === 'expired' ? 'Expired' : 'Used'}
                    </span>

                    <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                      <button
                        onClick={() => copyToken(tok)}
                        disabled={isInert}
                        className="rounded-md p-1.5 hover:bg-muted disabled:pointer-events-none"
                        title="Copy"
                      >
                        {copiedId === tok.id
                          ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                          : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>

                      {confirmDeleteId === tok.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { deleteToken.mutate(tok.id); setConfirmDeleteId(null) }}
                            disabled={deleteToken.isPending}
                            className="rounded-md bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground"
                          >
                            Del
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(tok.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Revoke"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
