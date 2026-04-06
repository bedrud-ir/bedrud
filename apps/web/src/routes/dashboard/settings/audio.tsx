import React, { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Mic, MicOff, Check, Loader2, Zap, Globe, Brain, Shield, SlidersHorizontal } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { api } from '#/lib/api'
import { useAudioPreferencesStore, type NoiseSuppressionMode } from '#/lib/audio-preferences.store'
import { AudioProcessorService } from '#/lib/audio-processor.service'

export const Route = createFileRoute('/dashboard/settings/audio')({
  component: AudioPage,
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

/* ── Mode option cards ────────────────────────────────────────────────────── */
const MODE_OPTIONS: {
  value: NoiseSuppressionMode
  label: string
  description: string
  icon: React.ElementType
}[] = [
  { value: 'none',    label: 'Off (RAW)',         description: 'No noise filtering. Raw microphone signal.',                            icon: Shield },
  { value: 'browser', label: 'Browser built-in',  description: 'WebRTC native noise suppression. Works everywhere, no extra setup.',   icon: Globe  },
  { value: 'rnnoise', label: 'RNNoise',            description: "Mozilla's open-source neural net. Runs locally in your browser.",      icon: Brain  },
  { value: 'krisp',   label: 'Krisp AI',           description: 'Commercial AI noise cancellation. Best quality for busy environments.', icon: Zap   },
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

/* ── Slider row ───────────────────────────────────────────────────────────── */
function SliderRow({
  label,
  description,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  accent,
}: {
  label: string
  description: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
  accent?: string
}) {
  const color = accent ?? '#6366f1'
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span
          className="text-sm font-semibold tabular-nums min-w-[48px] text-right"
          style={{ color }}
        >
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.12) ${pct}%)`,
          outline: 'none',
        }}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

/* ── Mic test ─────────────────────────────────────────────────────────────── */
const SEGMENTS = 24

function MicTestSection({
  mode,
  inputGain,
  noiseGate,
}: {
  mode: NoiseSuppressionMode
  inputGain: number
  noiseGate: number
}) {
  const [testing, setTesting]   = useState(false)
  const [volume, setVolume]     = useState(0)
  const [error, setError]       = useState<string | null>(null)
  const [devices, setDevices]   = useState<MediaDeviceInfo[]>([])
  const [deviceId, setDeviceId] = useState<string>('')

  const streamRef    = useRef<MediaStream | null>(null)
  const ctxRef       = useRef<AudioContext | null>(null)
  const gainNodeRef  = useRef<GainNode | null>(null)
  const gateNodeRef  = useRef<GainNode | null>(null)
  const rafRef       = useRef<number>(0)
  // Refs so the rAF loop always sees the latest slider values without restarts
  const noiseGateRef = useRef(noiseGate)
  useEffect(() => { noiseGateRef.current = noiseGate }, [noiseGate])
  // Sync live gain changes directly into the Web Audio graph
  useEffect(() => {
    if (gainNodeRef.current) gainNodeRef.current.gain.value = inputGain / 100
  }, [inputGain])

  const enumerateDevices = async () => {
    const all = await navigator.mediaDevices.enumerateDevices()
    const inputs = all.filter((d) => d.kind === 'audioinput')
    setDevices(inputs)
    if (inputs.length > 0) setDeviceId((prev) => prev || inputs[0].deviceId)
  }

  useEffect(() => { enumerateDevices().catch(() => {}) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stop = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    ctxRef.current?.close().catch(() => {})
    streamRef.current = null
    ctxRef.current    = null
    gainNodeRef.current = null
    gateNodeRef.current = null
    setVolume(0)
    setTesting(false)
  }

  const start = async () => {
    setError(null)
    try {
      const withSuppression = mode === 'browser'
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          noiseSuppression: withSuppression,
          echoCancellation: withSuppression,
          autoGainControl:  withSuppression,
        },
      })
      streamRef.current = stream

      // After first permission grant, labels become available
      await enumerateDevices()

      const ctx = new AudioContext()
      ctxRef.current = ctx

      // Graph: source → gainNode → preAnalyser → gateNode → postAnalyser → speakers
      const source = ctx.createMediaStreamSource(stream)

      const gainNode = ctx.createGain()
      gainNode.gain.value = inputGain / 100
      gainNodeRef.current = gainNode

      const preAnalyser = ctx.createAnalyser()
      preAnalyser.fftSize = 512
      preAnalyser.smoothingTimeConstant = 0.3

      const gateNode = ctx.createGain()
      gateNode.gain.value = 1
      gateNodeRef.current = gateNode

      const postAnalyser = ctx.createAnalyser()
      postAnalyser.fftSize = 512
      postAnalyser.smoothingTimeConstant = 0.6

      source.connect(gainNode)
      gainNode.connect(preAnalyser)
      preAnalyser.connect(gateNode)
      gateNode.connect(postAnalyser)
      postAnalyser.connect(ctx.destination) // echo — user hears themselves

      const preData  = new Uint8Array(preAnalyser.frequencyBinCount)
      const postData = new Uint8Array(postAnalyser.frequencyBinCount)

      const tick = () => {
        // Read pre-gate volume to drive gate open/close
        preAnalyser.getByteFrequencyData(preData)
        const preRms     = Math.sqrt(preData.reduce((s, v) => s + v * v, 0) / preData.length) / 128
        const preVol     = Math.min(1, preRms * 2.5)
        const threshold  = noiseGateRef.current / 100
        const targetGain = preVol < threshold ? 0 : 1
        // Smooth transitions: fast attack (5 ms), slow release (80 ms) to avoid clicks
        const timeConst  = targetGain === 0 ? 0.005 : 0.08
        gateNodeRef.current?.gain.setTargetAtTime(targetGain, ctx.currentTime, timeConst)

        // Meter reads the post-gate/gain signal — reflects what actually comes out
        postAnalyser.getByteFrequencyData(postData)
        const postRms = Math.sqrt(postData.reduce((s, v) => s + v * v, 0) / postData.length) / 128
        setVolume(Math.min(1, postRms * 2.5))

        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
      setTesting(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not access microphone')
    }
  }

  useEffect(() => () => { stop() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const lit = Math.round(volume * SEGMENTS)

  return (
    <Section title="Microphone test" sub="Hear yourself with your current gain and gate settings applied" icon={Mic}>
      <div className="space-y-4">

        {/* Device selector */}
        {devices.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Input device</Label>
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              disabled={testing}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                outline: 'none',
                opacity: testing ? 0.5 : 1,
                cursor: testing ? 'not-allowed' : 'pointer',
              }}
            >
              {devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId} style={{ background: '#1e1e2e' }}>
                  {d.label || `Microphone ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Start / stop */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={testing ? stop : start}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: testing ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
              color:  testing ? '#f87171' : '#a5b4fc',
              border: `1px solid ${testing ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.25)'}`,
            }}
          >
            {testing ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            {testing ? 'Stop test' : 'Test microphone'}
          </button>
          {testing && (
            <p className="text-xs text-muted-foreground">
              You can hear yourself — use headphones to avoid feedback.
            </p>
          )}
          {!testing && !error && (
            <p className="text-xs text-muted-foreground">
              Plays back your mic so you can hear how you sound.
            </p>
          )}
          {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
        </div>

        {/* Segmented volume meter (shows post-gate/gain signal) */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Output level</Label>
          <div className="flex gap-[3px]">
            {Array.from({ length: SEGMENTS }).map((_, i) => {
              const isLit   = i < lit
              const isRed   = i >= SEGMENTS * 0.83
              const isAmber = i >= SEGMENTS * 0.65
              const color   = isLit
                ? isRed   ? '#ef4444'
                : isAmber ? '#f59e0b'
                :           '#10b981'
                : 'rgba(255,255,255,0.07)'
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: 14,
                    background: color,
                    transition: isLit ? 'background 40ms' : 'background 180ms',
                    boxShadow: isLit ? `0 0 4px ${color}66` : 'none',
                  }}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Silent</span>
            <span>Loud</span>
          </div>
        </div>

        {(mode === 'rnnoise' || mode === 'krisp') && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Note: {mode === 'krisp' ? 'Krisp' : 'RNNoise'} processing only runs inside a call — this preview applies gain and gate only.
          </p>
        )}
      </div>
    </Section>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
function AudioPage() {
  const mode              = useAudioPreferencesStore((s) => s.noiseSuppressionMode)
  const echoCancellation  = useAudioPreferencesStore((s) => s.echoCancellation)
  const autoGainControl   = useAudioPreferencesStore((s) => s.autoGainControl)
  const inputGain         = useAudioPreferencesStore((s) => s.inputGain)
  const noiseGate         = useAudioPreferencesStore((s) => s.noiseGate)
  const setMode             = useAudioPreferencesStore((s) => s.setMode)
  const setEchoCancellation = useAudioPreferencesStore((s) => s.setEchoCancellation)
  const setAutoGainControl  = useAudioPreferencesStore((s) => s.setAutoGainControl)
  const setInputGain        = useAudioPreferencesStore((s) => s.setInputGain)
  const setNoiseGate        = useAudioPreferencesStore((s) => s.setNoiseGate)
  const merge               = useAudioPreferencesStore((s) => s.merge)

  const krispSupported = AudioProcessorService.isKrispSupported()

  const { data: remotePrefs } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => api.get<{ preferencesJson: string }>('/api/auth/preferences'),
  })

  useEffect(() => {
    if (!remotePrefs?.preferencesJson) return
    try {
      const parsed = JSON.parse(remotePrefs.preferencesJson)
      if (parsed?.audio) merge(parsed.audio)
    } catch { /* ignore malformed data */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remotePrefs])

  const syncMutation = useMutation({
    mutationFn: (prefsJson: string) =>
      api.put('/api/auth/preferences', { preferencesJson: prefsJson }),
  })
  const mutateRef = useRef(syncMutation.mutate)
  mutateRef.current = syncMutation.mutate

  useEffect(() => {
    const prefs = {
      audio: { noiseSuppressionMode: mode, echoCancellation, autoGainControl, inputGain, noiseGate },
    }
    const timer = setTimeout(() => mutateRef.current(JSON.stringify(prefs)), 1000)
    return () => clearTimeout(timer)
  }, [mode, echoCancellation, autoGainControl, inputGain, noiseGate])

  const syncStatus = syncMutation.isPending ? 'saving'
    : syncMutation.isError   ? 'error'
    : syncMutation.isSuccess ? 'saved'
    : 'idle'

  return (
    <div className="space-y-6">
      {/* ── Noise suppression mode ── */}
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
              <Switch checked={echoCancellation} onCheckedChange={setEchoCancellation} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto gain control</Label>
                <p className="text-xs text-muted-foreground">Automatically adjust microphone volume.</p>
              </div>
              <Switch checked={autoGainControl} onCheckedChange={setAutoGainControl} />
            </div>
          </div>
        )}
      </Section>

      {/* ── Mic test ── */}
      <MicTestSection mode={mode} inputGain={inputGain} noiseGate={noiseGate} />

      {/* ── Gain & gate controls (all modes) ── */}
      <Section title="Signal processing" sub="Applied on top of the selected noise suppression mode" icon={SlidersHorizontal}>
        <div className="space-y-6">
          <SliderRow
            label="Input gain"
            description="Amplify or attenuate the microphone signal. 100% = unity gain."
            value={inputGain}
            min={0}
            max={300}
            step={1}
            unit="%"
            onChange={setInputGain}
            accent="#6366f1"
          />
          <SliderRow
            label="Noise gate"
            description="Silence the mic when the signal drops below this threshold. 0% = disabled."
            value={noiseGate}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={setNoiseGate}
            accent="#8b5cf6"
          />
        </div>
      </Section>

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
