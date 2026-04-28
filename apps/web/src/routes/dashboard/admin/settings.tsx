import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Ban, Check, Clock, Copy, Globe, KeyRound, Loader2, RefreshCw, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '#/lib/api'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

interface SystemSettings {
  id: number
  registrationEnabled: boolean
  tokenRegistrationOnly: boolean
  passkeysEnabled: boolean
  googleClientId: string
  googleClientSecret: string
  googleRedirectUrl: string
  githubClientId: string
  githubClientSecret: string
  githubRedirectUrl: string
  twitterClientId: string
  twitterClientSecret: string
  twitterRedirectUrl: string
  jwtSecret: string
  tokenDuration: number
  sessionSecret: string
  frontendUrl: string
  serverPort: string
  serverHost: string
  serverDomain: string
  serverEnableTls: boolean
  serverCertFile: string
  serverKeyFile: string
  serverUseAcme: boolean
  serverEmail: string
  behindProxy: boolean
  livekitHost: string
  livekitApiKey: string
  livekitApiSecret: string
  livekitExternal: boolean
  corsAllowedOrigins: string
  corsAllowedHeaders: string
  corsAllowedMethods: string
  corsAllowCredentials: boolean
  corsMaxAge: number
  chatUploadBackend: string
  chatUploadMaxBytes: number
  chatUploadInlineMax: number
  chatUploadDiskDir: string
  chatUploadS3Endpoint: string
  chatUploadS3Bucket: string
  chatUploadS3Region: string
  chatUploadS3AccessKey: string
  chatUploadS3SecretKey: string
  chatUploadS3PublicUrl: string
  logLevel: string
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
  if (mode === 'open') return { registrationEnabled: true, tokenRegistrationOnly: false }
  if (mode === 'invite') return { registrationEnabled: true, tokenRegistrationOnly: true }
  return { registrationEnabled: false, tokenRegistrationOnly: false }
}

const MODES: { id: RegMode; icon: React.ElementType; label: string; description: string }[] = [
  { id: 'open', icon: Globe, label: 'Open', description: 'Anyone can create an account' },
  { id: 'invite', icon: KeyRound, label: 'Invite-only', description: 'Valid invite token required' },
  { id: 'closed', icon: Ban, label: 'Closed', description: 'No new registrations' },
]

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'auth', label: 'Authentication' },
  { id: 'livekit', label: 'LiveKit' },
  { id: 'server', label: 'Server' },
  { id: 'cors', label: 'CORS' },
  { id: 'chat', label: 'Chat' },
  { id: 'logging', label: 'Logging' },
] as const
type TabId = (typeof TABS)[number]['id']

function tokenExpiry(tok: InviteToken): 'used' | 'expired' | 'valid' {
  if (tok.usedAt) return 'used'
  if (new Date() > new Date(tok.expiresAt)) return 'expired'
  return 'valid'
}

// ── Shared components ──────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="border bg-card/50">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </div>
  )
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground/60">{hint}</p>}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  mono,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  disabled?: boolean
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'h-8 w-full border-b border-transparent bg-transparent px-1 text-xs outline-none transition-colors focus:border-primary disabled:opacity-50',
        mono && 'font-mono',
      )}
    />
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <div
        className={cn(
          'flex h-4 w-7 shrink-0 items-center rounded-full p-px transition-colors',
          checked ? 'bg-primary justify-end' : 'bg-muted',
        )}
        onClick={() => onChange(!checked)}
      >
        <div className="h-3 w-3 rounded-full bg-white transition-transform" />
      </div>
      <span className="text-xs">{label}</span>
    </label>
  )
}

// ── Tab contents ───────────────────────────────────────────────────────────────

function GeneralTab({
  settings,
  onPatch,
  saving,
}: {
  settings: SystemSettings
  onPatch: (p: Partial<SystemSettings>) => void
  saving: boolean
}) {
  const currentMode = getMode(settings)
  return (
    <div className="space-y-4">
      <Section title="Registration" description="Who can create accounts">
        <div className="space-y-2">
          {MODES.map(({ id, icon: Icon, label, description }) => {
            const active = currentMode === id
            return (
              <button
                key={id}
                onClick={() => onPatch({ ...settings, ...modeToSettings(id) })}
                disabled={saving}
                className={cn(
                  'flex w-full items-center gap-3 border p-3 text-left transition-colors disabled:opacity-60',
                  active
                    ? id === 'closed'
                      ? 'border-destructive/40 bg-destructive/5'
                      : 'border-primary/30 bg-primary/5'
                    : 'hover:bg-accent',
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center',
                    active
                      ? id === 'closed'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      active ? (id === 'closed' ? 'text-destructive' : 'text-primary') : 'text-foreground',
                    )}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <div
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center border-2',
                    active
                      ? id === 'closed'
                        ? 'border-destructive bg-destructive'
                        : 'border-primary bg-primary'
                      : 'border-muted-foreground/30',
                  )}
                >
                  {active && <Check className="h-2 w-2 text-white" />}
                </div>
              </button>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

function AuthTab({ settings, setSettings }: { settings: SystemSettings; setSettings: (s: SystemSettings) => void }) {
  return (
    <div className="space-y-4">
      <Section title="Passkeys" description="Biometric and hardware key authentication">
        <Toggle
          checked={settings.passkeysEnabled}
          onChange={(v) => setSettings({ ...settings, passkeysEnabled: v })}
          label="Enable passkey login and registration"
        />
      </Section>

      <OAuthProviderCard
        name="Google"
        clientId={settings.googleClientId}
        clientSecret={settings.googleClientSecret}
        redirectUrl={settings.googleRedirectUrl}
        onChange={(v) => setSettings({ ...settings, ...v })}
        idPrefix="google"
      />

      <OAuthProviderCard
        name="GitHub"
        clientId={settings.githubClientId}
        clientSecret={settings.githubClientSecret}
        redirectUrl={settings.githubRedirectUrl}
        onChange={(v) => setSettings({ ...settings, ...v })}
        idPrefix="github"
      />

      <OAuthProviderCard
        name="Twitter / X"
        clientId={settings.twitterClientId}
        clientSecret={settings.twitterClientSecret}
        redirectUrl={settings.twitterRedirectUrl}
        onChange={(v) => setSettings({ ...settings, ...v })}
        idPrefix="twitter"
      />
    </div>
  )
}

function OAuthProviderCard({
  name,
  clientId,
  clientSecret,
  redirectUrl,
  onChange,
  idPrefix,
}: {
  name: string
  clientId: string
  clientSecret: string
  redirectUrl: string
  onChange: (v: Record<string, string>) => void
  idPrefix: string
}) {
  const configured = clientId !== '' && clientSecret !== '' && clientSecret !== '••••••••'
  return (
    <Section title={name} description={configured ? 'Configured' : 'Not configured'}>
      <div className="space-y-3">
        <Field label="Client ID">
          <TextInput
            value={clientId}
            onChange={(v) => onChange({ [`${idPrefix}ClientId`]: v })}
            placeholder={`Enter ${name} Client ID`}
            mono
          />
        </Field>
        <Field
          label="Client Secret"
          hint={clientSecret === '••••••••' ? 'Hidden — enter new value to change' : undefined}
        >
          <TextInput
            value={clientSecret}
            onChange={(v) => onChange({ [`${idPrefix}ClientSecret`]: v })}
            placeholder={configured ? '••••••••' : `Enter ${name} Client Secret`}
            mono
          />
        </Field>
        <Field label="Redirect URL">
          <TextInput
            value={redirectUrl}
            onChange={(v) => onChange({ [`${idPrefix}RedirectUrl`]: v })}
            placeholder={`https://your-domain.com/auth/${idPrefix}/callback`}
            mono
          />
        </Field>
      </div>
    </Section>
  )
}

function LiveKitTab({ settings, setSettings }: { settings: SystemSettings; setSettings: (s: SystemSettings) => void }) {
  return (
    <Section title="LiveKit" description="Real-time audio/video infrastructure">
      <Toggle
        checked={settings.livekitExternal}
        onChange={(v) => setSettings({ ...settings, livekitExternal: v })}
        label="Use external LiveKit server"
      />
      <Field label="Host">
        <TextInput
          value={settings.livekitHost}
          onChange={(v) => setSettings({ ...settings, livekitHost: v })}
          placeholder="http://localhost:7880"
          mono
        />
      </Field>
      <Field label="API Key">
        <TextInput
          value={settings.livekitApiKey}
          onChange={(v) => setSettings({ ...settings, livekitApiKey: v })}
          placeholder="Enter API key"
          mono
        />
      </Field>
      <Field
        label="API Secret"
        hint={settings.livekitApiSecret === '••••••••' ? 'Hidden — enter new value to change' : undefined}
      >
        <TextInput
          value={settings.livekitApiSecret}
          onChange={(v) => setSettings({ ...settings, livekitApiSecret: v })}
          placeholder="Enter API secret"
          mono
        />
      </Field>
    </Section>
  )
}

function ServerTab({ settings, setSettings }: { settings: SystemSettings; setSettings: (s: SystemSettings) => void }) {
  return (
    <Section title="Server" description="Requires restart to take effect">
      <div className="mb-3 flex items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
        <RefreshCw className="h-3 w-3 shrink-0" />
        Changes here require a server restart to take effect.
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Port">
          <TextInput
            value={settings.serverPort}
            onChange={(v) => setSettings({ ...settings, serverPort: v })}
            placeholder="8090"
          />
        </Field>
        <Field label="Host">
          <TextInput
            value={settings.serverHost}
            onChange={(v) => setSettings({ ...settings, serverHost: v })}
            placeholder="localhost"
          />
        </Field>
        <Field label="Domain">
          <TextInput
            value={settings.serverDomain}
            onChange={(v) => setSettings({ ...settings, serverDomain: v })}
            placeholder="example.com"
          />
        </Field>
        <Field label="Email (ACME)">
          <TextInput
            value={settings.serverEmail}
            onChange={(v) => setSettings({ ...settings, serverEmail: v })}
            placeholder="admin@example.com"
          />
        </Field>
      </div>
      <div className="space-y-2 pt-2">
        <Toggle
          checked={settings.serverEnableTls}
          onChange={(v) => setSettings({ ...settings, serverEnableTls: v })}
          label="Enable TLS"
        />
        <Toggle
          checked={settings.serverUseAcme}
          onChange={(v) => setSettings({ ...settings, serverUseAcme: v })}
          label="Use Let's Encrypt (ACME)"
        />
        <Toggle
          checked={settings.behindProxy}
          onChange={(v) => setSettings({ ...settings, behindProxy: v })}
          label="Behind reverse proxy"
        />
      </div>
      <div className="grid gap-4 pt-2 sm:grid-cols-2">
        <Field label="Cert file">
          <TextInput
            value={settings.serverCertFile}
            onChange={(v) => setSettings({ ...settings, serverCertFile: v })}
            placeholder="/etc/bedrud/cert.pem"
            mono
          />
        </Field>
        <Field label="Key file">
          <TextInput
            value={settings.serverKeyFile}
            onChange={(v) => setSettings({ ...settings, serverKeyFile: v })}
            placeholder="/etc/bedrud/key.pem"
            mono
          />
        </Field>
      </div>
    </Section>
  )
}

function CorsTab({ settings, setSettings }: { settings: SystemSettings; setSettings: (s: SystemSettings) => void }) {
  return (
    <Section title="CORS" description="Cross-origin resource sharing">
      <Field label="Allowed Origins" hint="Comma-separated or *">
        <TextInput
          value={settings.corsAllowedOrigins}
          onChange={(v) => setSettings({ ...settings, corsAllowedOrigins: v })}
          placeholder="http://localhost:5173"
        />
      </Field>
      <Field label="Allowed Headers">
        <TextInput
          value={settings.corsAllowedHeaders}
          onChange={(v) => setSettings({ ...settings, corsAllowedHeaders: v })}
          placeholder="Origin, Content-Type, Accept, Authorization"
        />
      </Field>
      <Field label="Allowed Methods">
        <TextInput
          value={settings.corsAllowedMethods}
          onChange={(v) => setSettings({ ...settings, corsAllowedMethods: v })}
          placeholder="GET, POST, PUT, DELETE, OPTIONS"
        />
      </Field>
      <Field label="Max Age (seconds)">
        <TextInput
          value={String(settings.corsMaxAge)}
          onChange={(v) => setSettings({ ...settings, corsMaxAge: Number(v) || 0 })}
          placeholder="0"
        />
      </Field>
      <Toggle
        checked={settings.corsAllowCredentials}
        onChange={(v) => setSettings({ ...settings, corsAllowCredentials: v })}
        label="Allow credentials"
      />
    </Section>
  )
}

function ChatTab({ settings, setSettings }: { settings: SystemSettings; setSettings: (s: SystemSettings) => void }) {
  return (
    <Section title="Chat Uploads" description="Image upload storage for in-room chat">
      <Field label="Backend">
        <select
          value={settings.chatUploadBackend || 'disk'}
          onChange={(e) => setSettings({ ...settings, chatUploadBackend: e.target.value })}
          className="h-8 w-full border-b border-transparent bg-transparent px-1 text-xs outline-none focus:border-primary cursor-pointer"
        >
          <option value="disk">Disk</option>
          <option value="s3">S3-compatible</option>
          <option value="inline">Inline (base64)</option>
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Max upload size (bytes)">
          <TextInput
            value={String(settings.chatUploadMaxBytes || 0)}
            onChange={(v) => setSettings({ ...settings, chatUploadMaxBytes: Number(v) || 0 })}
            placeholder="10485760"
          />
        </Field>
        <Field label="Inline max bytes">
          <TextInput
            value={String(settings.chatUploadInlineMax || 0)}
            onChange={(v) => setSettings({ ...settings, chatUploadInlineMax: Number(v) || 0 })}
            placeholder="512000"
          />
        </Field>
      </div>
      <Field label="Disk directory">
        <TextInput
          value={settings.chatUploadDiskDir}
          onChange={(v) => setSettings({ ...settings, chatUploadDiskDir: v })}
          placeholder="./data/uploads/chat"
        />
      </Field>

      {settings.chatUploadBackend === 's3' && (
        <div className="space-y-3 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground">S3 Configuration</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Endpoint">
              <TextInput
                value={settings.chatUploadS3Endpoint}
                onChange={(v) => setSettings({ ...settings, chatUploadS3Endpoint: v })}
                placeholder="https://s3.amazonaws.com"
              />
            </Field>
            <Field label="Bucket">
              <TextInput
                value={settings.chatUploadS3Bucket}
                onChange={(v) => setSettings({ ...settings, chatUploadS3Bucket: v })}
                placeholder="my-bucket"
              />
            </Field>
            <Field label="Region">
              <TextInput
                value={settings.chatUploadS3Region}
                onChange={(v) => setSettings({ ...settings, chatUploadS3Region: v })}
                placeholder="us-east-1"
              />
            </Field>
            <Field label="Access Key">
              <TextInput
                value={settings.chatUploadS3AccessKey}
                onChange={(v) => setSettings({ ...settings, chatUploadS3AccessKey: v })}
                mono
              />
            </Field>
            <Field label="Secret Key" hint={settings.chatUploadS3SecretKey === '••••••••' ? 'Hidden' : undefined}>
              <TextInput
                value={settings.chatUploadS3SecretKey}
                onChange={(v) => setSettings({ ...settings, chatUploadS3SecretKey: v })}
                mono
              />
            </Field>
            <Field label="Public Base URL">
              <TextInput
                value={settings.chatUploadS3PublicUrl}
                onChange={(v) => setSettings({ ...settings, chatUploadS3PublicUrl: v })}
                placeholder="https://cdn.example.com"
              />
            </Field>
          </div>
        </div>
      )}
    </Section>
  )
}

function LoggingTab({ settings, setSettings }: { settings: SystemSettings; setSettings: (s: SystemSettings) => void }) {
  return (
    <Section title="Logging" description="Server log verbosity">
      <Field label="Log Level">
        <select
          value={settings.logLevel || 'info'}
          onChange={(e) => setSettings({ ...settings, logLevel: e.target.value })}
          className="h-8 w-full border-b border-transparent bg-transparent px-1 text-xs outline-none focus:border-primary cursor-pointer"
        >
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
          <option value="trace">Trace</option>
        </select>
      </Field>
    </Section>
  )
}

// ── Invite tokens section ──────────────────────────────────────────────────────

function InviteTokensSection() {
  const queryClient = useQueryClient()
  const [expiresIn, setExpiresIn] = useState(72)
  const [tokenEmail, setTokenEmail] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newToken, setNewToken] = useState<InviteToken | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmGenerate, setConfirmGenerate] = useState(false)

  const { data: tokensData, isLoading: tokensLoading } = useQuery({
    queryKey: ['admin', 'invite-tokens'],
    queryFn: () => api.get<{ tokens: InviteToken[] }>('/api/admin/invite-tokens'),
  })

  const createToken = useMutation({
    mutationFn: () =>
      api.post<InviteToken>('/api/admin/invite-tokens', {
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

  const tokens = tokensData?.tokens ?? []
  const validCount = tokens.filter((t) => tokenExpiry(t) === 'valid').length

  return (
    <div className="border bg-card/50">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Invite tokens</p>
          <p className="text-xs text-muted-foreground">Generate and manage registration tokens</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {validCount > 0 && (
            <span className="border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
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
            className="h-8 min-w-0 flex-1 border border-input bg-background px-2.5 text-xs outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
          <div className="flex gap-2 sm:contents">
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(+e.target.value)}
              className="h-8 w-28 shrink-0 border border-input bg-background px-2.5 text-xs outline-none cursor-pointer text-foreground"
            >
              <option value={24}>24 h</option>
              <option value={72}>72 h</option>
              <option value={168}>7 days</option>
              <option value={720}>30 days</option>
            </select>
            <button
              onClick={() => setConfirmGenerate(true)}
              disabled={createToken.isPending}
              className="inline-flex h-8 flex-1 shrink-0 items-center justify-center gap-1.5 bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:flex-none"
            >
              {createToken.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <KeyRound className="h-3 w-3" /> Generate
                </>
              )}
            </button>
          </div>
        </div>

        {confirmGenerate && (
          <div className="mt-2 flex flex-wrap items-center gap-2 border bg-muted/30 px-3 py-2">
            <p className="flex-1 text-xs text-muted-foreground">
              Generate {tokenEmail ? `token for ${tokenEmail}` : 'invite token'}, expires in{' '}
              {expiresIn === 24 ? '24h' : expiresIn === 72 ? '72h' : expiresIn === 168 ? '7 days' : '30 days'}?
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => setConfirmGenerate(false)}
                className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmGenerate(false)
                  createToken.mutate()
                }}
                className="inline-flex items-center gap-1 bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
              >
                <Check className="h-3 w-3" /> Confirm
              </button>
            </div>
          </div>
        )}

        {newToken && (
          <div className="mt-2 flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <p className="flex-1 break-all font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              {newToken.token}
            </p>
            <button onClick={() => copyToken(newToken)} className="shrink-0 p-1 hover:bg-muted">
              {copiedId === newToken.id ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={() => setNewToken(null)}
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
            >
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
              <div className="h-3.5 w-40 bg-muted" />
              <div className="flex-1" />
              <div className="h-4 w-12 bg-muted" />
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
                  <p className="truncate font-mono text-[11px] text-muted-foreground">{tok.token.slice(0, 20)}…</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {tok.email && (
                      <span className="max-w-[10rem] truncate text-[10px] text-muted-foreground/70">{tok.email}</span>
                    )}
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
                      <Clock className="h-2.5 w-2.5 shrink-0" />
                      {new Date(tok.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <span
                  className={cn(
                    'shrink-0 border px-2 py-0.5 text-[10px] font-semibold',
                    status === 'valid' &&
                      'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                    status === 'expired' && 'border-destructive/30 bg-destructive/10 text-destructive',
                    status === 'used' && 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {status === 'valid' ? 'Active' : status === 'expired' ? 'Expired' : 'Used'}
                </span>

                <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                  <button
                    onClick={() => copyToken(tok)}
                    disabled={isInert}
                    className="p-1.5 hover:bg-muted disabled:pointer-events-none"
                    title="Copy"
                  >
                    {copiedId === tok.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  {confirmDeleteId === tok.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          deleteToken.mutate(tok.id)
                          setConfirmDeleteId(null)
                        }}
                        disabled={deleteToken.isPending}
                        className="bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground"
                      >
                        Del
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(tok.id)}
                      className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [localSettings, setLocalSettings] = useState<SystemSettings | null>(null)

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.get<SystemSettings>('/api/admin/settings'),
  })

  const current = localSettings ?? settings ?? null

  const saveSettings = useMutation({
    mutationFn: (s: Partial<SystemSettings>) => api.put('/api/admin/settings', s),
    onSuccess: () => {
      setLocalSettings(null)
    },
  })

  function handlePatch(partial: Partial<SystemSettings>) {
    if (!current) return
    const merged = { ...current, ...partial }
    setLocalSettings(merged)
    saveSettings.mutate(merged)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-sm font-semibold">System settings</h1>
        <p className="text-xs text-muted-foreground">Manage auth, infrastructure, and server configuration.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'shrink-0 px-3 py-1.5 text-xs font-medium transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {settingsLoading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-40 border bg-card/50 animate-pulse" />
          ))}
        </div>
      ) : current ? (
        <div className="space-y-4">
          {activeTab === 'general' && (
            <GeneralTab settings={current} onPatch={handlePatch} saving={saveSettings.isPending} />
          )}
          {activeTab === 'auth' && <AuthTab settings={current} setSettings={setLocalSettings} />}
          {activeTab === 'livekit' && <LiveKitTab settings={current} setSettings={setLocalSettings} />}
          {activeTab === 'server' && <ServerTab settings={current} setSettings={setLocalSettings} />}
          {activeTab === 'cors' && <CorsTab settings={current} setSettings={setLocalSettings} />}
          {activeTab === 'chat' && <ChatTab settings={current} setSettings={setLocalSettings} />}
          {activeTab === 'logging' && <LoggingTab settings={current} setSettings={setLocalSettings} />}

          {/* Save button for non-registration tabs */}
          {activeTab !== 'general' && localSettings && (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handlePatch(localSettings)}
                disabled={saveSettings.isPending}
                className="inline-flex items-center gap-1.5 bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saveSettings.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Save changes
              </button>
              {saveSettings.isSuccess && <span className="text-xs text-emerald-600">Saved</span>}
              <button
                onClick={() => setLocalSettings(null)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Discard
              </button>
            </div>
          )}

          {/* Invite tokens always visible under general */}
          {activeTab === 'general' && <InviteTokensSection />}
        </div>
      ) : null}
    </div>
  )
}
