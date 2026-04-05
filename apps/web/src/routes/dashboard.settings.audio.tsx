import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Mic, Check, Loader2, Zap, Globe, Brain, Shield } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { api } from '#/lib/api'
import { useAudioPreferencesStore, type NoiseSuppressionMode } from '#/lib/audio-preferences.store'
import { AudioProcessorService } from '#/lib/audio-processor.service'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = (createFileRoute as any)('/dashboard/settings/audio')({ component: AudioSettingsPage })

/* ── Section wrapper (local copy — same shape as dashboard.settings.tsx) ─ */
function Section({
  title, sub, icon: Icon, children,
}: {
  title: string; sub: string; icon: React.ElementType; children: React.ReactNode
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

/* ── Mode option card ─────────────────────────────────────────────────────── */
const MODE_OPTIONS: {
  value: NoiseSuppressionMode
  label: string
  description: string
  icon: React.ElementType
  badge?: string
}[] = [
  {
    value: 'none',
    label: 'Off',
    description: 'No noise filtering applied.',
    icon: Shield,
  },
  {
    value: 'browser',
    label: 'Browser built-in',
    description: 'WebRTC native noise suppression. Works everywhere, no extra setup.',
    icon: Globe,
  },
  {
    value: 'rnnoise',
    label: 'RNNoise',
    description: 'Mozilla\'s open-source neural net. Runs locally in your browser.',
    icon: Brain,
  },
  {
    value: 'krisp',
    label: 'Krisp AI',
    description: 'Commercial AI noise cancellation. Best quality for busy environments.',
    icon: Zap,
  },
]

function ModeCard({
  option,
  selected,
  disabled,
  onSelect,
}: {
  option: typeof MODE_OPTIONS[number]
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  const Icon = option.icon
  return (
    <button
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className="w-full text-left rounded-xl border p-4 transition-all"
      style={{
        borderColor: selected ? '#6366f1' : 'hsl(var(--border))',
        background: selected ? 'rgba(99,102,241,0.06)' : 'transparent',
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: selected ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
            color: selected ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
          }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{option.label}</span>
            {disabled && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
              >
                Not supported
              </span>
            )}
            {selected && !disabled && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}
              >
                Active
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{option.description}</p>
        </div>
        <div
          className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center"
          style={{
            borderColor: selected ? '#6366f1' : 'hsl(var(--border))',
            background: selected ? '#6366f1' : 'transparent',
          }}
        >
          {selected && <Check className="h-2 w-2 text-white" />}
        </div>
      </div>
    </button>
  )
}

/* ── Main page ─────────────────────────────────────────────────────────────── */
function AudioSettingsPage() {
  const mode               = useAudioPreferencesStore((s) => s.noiseSuppressionMode)
  const echoCancellation   = useAudioPreferencesStore((s) => s.echoCancellation)
  const autoGainControl    = useAudioPreferencesStore((s) => s.autoGainControl)
  const setMode            = useAudioPreferencesStore((s) => s.setMode)
  const setEchoCancellation = useAudioPreferencesStore((s) => s.setEchoCancellation)
  const setAutoGainControl  = useAudioPreferencesStore((s) => s.setAutoGainControl)
  const merge              = useAudioPreferencesStore((s) => s.merge)

  const krispSupported = AudioProcessorService.isKrispSupported()

  // Load remote preferences on mount and merge into local store
  const { data: remotePrefs } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => api.get<{ preferencesJson: string }>('/api/auth/preferences'),
  })

  useEffect(() => {
    if (!remotePrefs?.preferencesJson) return
    try {
      const parsed = JSON.parse(remotePrefs.preferencesJson)
      if (parsed?.audio) merge(parsed.audio)
    } catch { /* ignore malformed stored data */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remotePrefs])

  // Debounced sync to backend whenever prefs change
  const syncMutation = useMutation({
    mutationFn: (prefsJson: string) =>
      api.put('/api/auth/preferences', { preferencesJson: prefsJson }),
  })

  useEffect(() => {
    const prefs = { audio: { noiseSuppressionMode: mode, echoCancellation, autoGainControl } }
    const timer = setTimeout(() => {
      syncMutation.mutate(JSON.stringify(prefs))
    }, 1000)
    return () => clearTimeout(timer)
  // syncMutation is stable; omitting it from deps is intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, echoCancellation, autoGainControl])

  const syncStatus = syncMutation.isPending
    ? 'saving'
    : syncMutation.isError
      ? 'error'
      : syncMutation.isSuccess
        ? 'saved'
        : 'idle'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Audio{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}
          >
            settings
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure noise suppression for your microphone.</p>
      </div>

      {/* Noise suppression */}
      <Section title="Noise suppression" sub="Choose how your microphone audio is processed" icon={Mic}>
        <div className="space-y-2">
          {MODE_OPTIONS.map((option) => (
            <ModeCard
              key={option.value}
              option={option}
              selected={mode === option.value}
              disabled={option.value === 'krisp' && !krispSupported}
              onSelect={() => setMode(option.value)}
            />
          ))}
        </div>

        {/* Browser-only sub-options */}
        {mode === 'browser' && (
          <div
            className="mt-4 space-y-3 rounded-xl border p-4"
            style={{ borderColor: 'hsl(var(--border))', background: 'rgba(255,255,255,0.02)' }}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              WebRTC options
            </p>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Echo cancellation</Label>
                <p className="text-xs text-muted-foreground">Remove echo from your microphone signal.</p>
              </div>
              <Switch
                checked={echoCancellation}
                onCheckedChange={setEchoCancellation}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto gain control</Label>
                <p className="text-xs text-muted-foreground">Automatically adjust microphone volume.</p>
              </div>
              <Switch
                checked={autoGainControl}
                onCheckedChange={setAutoGainControl}
              />
            </div>
          </div>
        )}
      </Section>

      {/* Sync status */}
      {syncStatus !== 'idle' && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {syncStatus === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {syncStatus === 'saved'  && <Check className="h-3.5 w-3.5" style={{ color: '#10b981' }} />}
          <span>
            {syncStatus === 'saving' && 'Saving…'}
            {syncStatus === 'saved'  && 'Settings saved'}
            {syncStatus === 'error'  && 'Failed to sync — changes saved locally'}
          </span>
        </div>
      )}
    </div>
  )
}
