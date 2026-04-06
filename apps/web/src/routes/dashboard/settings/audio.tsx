import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Brain, Check, Globe, Loader2, Mic, MicOff, Shield, Zap } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { api } from '#/lib/api'
import { type NoiseSuppressionMode, useAudioPreferencesStore } from '#/lib/audio-preferences.store'
import { AudioProcessorService } from '#/lib/audio-processor.service'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/settings/audio')({
  component: AudioPage,
})

/* ── Constants ────────────────────────────────────────────────────────────── */

const MODES: { value: NoiseSuppressionMode; label: string; icon: React.ElementType }[] = [
  { value: 'none', label: 'Off', icon: Shield },
  { value: 'browser', label: 'Browser', icon: Globe },
  { value: 'rnnoise', label: 'RNNoise', icon: Brain },
  { value: 'krisp', label: 'Krisp', icon: Zap },
]

const SEGMENTS = 32

/* ── Volume Meter ─────────────────────────────────────────────────────────── */

function VolumeMeter({ volume }: { volume: number }) {
  const lit = Math.round(volume * SEGMENTS)
  return (
    <div className="flex gap-px">
      {Array.from({ length: SEGMENTS }).map((_, i) => {
        const isLit = i < lit
        const isRed = i >= SEGMENTS * 0.83
        const isAmber = i >= SEGMENTS * 0.65
        return (
          <div
            key={i}
            className={cn(
              'flex-1 h-6 rounded-[2px] transition-colors duration-75',
              isLit ? (isRed ? 'bg-destructive' : isAmber ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-muted/60',
            )}
          />
        )
      })}
    </div>
  )
}

/* ── Mic Test Hook ────────────────────────────────────────────────────────── */

function useMicTest(mode: NoiseSuppressionMode, inputGain: number, noiseGate: number) {
  const [testing, setTesting] = useState(false)
  const [volume, setVolume] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceId, setDeviceId] = useState<string>('')

  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const gateNodeRef = useRef<GainNode | null>(null)
  const rafRef = useRef<number>(0)
  const noiseGateRef = useRef(noiseGate)
  useEffect(() => {
    noiseGateRef.current = noiseGate
  }, [noiseGate])
  useEffect(() => {
    if (gainNodeRef.current) gainNodeRef.current.gain.value = inputGain / 100
  }, [inputGain])

  const enumerateDevices = async () => {
    const all = await navigator.mediaDevices.enumerateDevices()
    const inputs = all.filter((d) => d.kind === 'audioinput')
    setDevices(inputs)
    if (inputs.length > 0) setDeviceId((prev) => prev || inputs[0].deviceId)
  }

  useEffect(() => {
    enumerateDevices().catch(() => {})
  }, [enumerateDevices]) // eslint-disable-line react-hooks/exhaustive-deps

  const stop = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    ctxRef.current?.close().catch(() => {})
    streamRef.current = null
    ctxRef.current = null
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
          autoGainControl: withSuppression,
        },
      })
      streamRef.current = stream
      await enumerateDevices()

      const ctx = new AudioContext()
      ctxRef.current = ctx

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
      postAnalyser.connect(ctx.destination)

      const preData = new Uint8Array(preAnalyser.frequencyBinCount)
      const postData = new Uint8Array(postAnalyser.frequencyBinCount)

      const tick = () => {
        preAnalyser.getByteFrequencyData(preData)
        const preRms = Math.sqrt(preData.reduce((s, v) => s + v * v, 0) / preData.length) / 128
        const preVol = Math.min(1, preRms * 2.5)
        const threshold = noiseGateRef.current / 100
        const targetGain = preVol < threshold ? 0 : 1
        const timeConst = targetGain === 0 ? 0.005 : 0.08
        gateNodeRef.current?.gain.setTargetAtTime(targetGain, ctx.currentTime, timeConst)

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

  useEffect(
    () => () => {
      stop()
    },
    [stop],
  ) // eslint-disable-line react-hooks/exhaustive-deps

  return { testing, volume, error, devices, deviceId, setDeviceId, start, stop }
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

function AudioPage() {
  const mode = useAudioPreferencesStore((s) => s.noiseSuppressionMode)
  const echoCancellation = useAudioPreferencesStore((s) => s.echoCancellation)
  const autoGainControl = useAudioPreferencesStore((s) => s.autoGainControl)
  const inputGain = useAudioPreferencesStore((s) => s.inputGain)
  const noiseGate = useAudioPreferencesStore((s) => s.noiseGate)
  const setMode = useAudioPreferencesStore((s) => s.setMode)
  const setEchoCancellation = useAudioPreferencesStore((s) => s.setEchoCancellation)
  const setAutoGainControl = useAudioPreferencesStore((s) => s.setAutoGainControl)
  const setInputGain = useAudioPreferencesStore((s) => s.setInputGain)
  const setNoiseGate = useAudioPreferencesStore((s) => s.setNoiseGate)
  const merge = useAudioPreferencesStore((s) => s.merge)

  const krispSupported = AudioProcessorService.isKrispSupported()
  const mic = useMicTest(mode, inputGain, noiseGate)

  // ── Remote sync ──
  const { data: remotePrefs } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => api.get<{ preferencesJson: string }>('/api/auth/preferences'),
  })

  useEffect(() => {
    if (!remotePrefs?.preferencesJson) return
    try {
      const parsed = JSON.parse(remotePrefs.preferencesJson)
      if (parsed?.audio) merge(parsed.audio)
    } catch {
      /* ignore malformed data */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remotePrefs, merge])

  const syncMutation = useMutation({
    mutationFn: (prefsJson: string) => api.put('/api/auth/preferences', { preferencesJson: prefsJson }),
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

  const syncStatus = syncMutation.isPending
    ? 'saving'
    : syncMutation.isError
      ? 'error'
      : syncMutation.isSuccess
        ? 'saved'
        : 'idle'

  const gainPct = (inputGain / 300) * 100
  const gatePct = noiseGate

  return (
    <div className="rounded-xl border bg-card/50">
      {/* ── Row 1: Mode chips + WebRTC toggles ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-5 py-3">
        <span className="text-xs font-medium text-muted-foreground">Processing</span>
        <div className="flex flex-wrap items-center gap-1">
          {MODES.map(({ value, label, icon: Icon }) => {
            const active = mode === value
            const disabled = value === 'krisp' && !krispSupported
            return (
              <button
                key={value}
                onClick={() => !disabled && setMode(value)}
                disabled={disabled}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                  disabled && 'opacity-40 cursor-not-allowed',
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            )
          })}
        </div>

        {/* WebRTC sub-options appear inline when browser mode is active */}
        {mode === 'browser' && (
          <div className="flex items-center gap-4 border-l pl-4">
            <label className="flex items-center gap-2 text-xs">
              <Switch className="scale-75" checked={echoCancellation} onCheckedChange={setEchoCancellation} />
              <span className="text-muted-foreground">Echo</span>
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Switch className="scale-75" checked={autoGainControl} onCheckedChange={setAutoGainControl} />
              <span className="text-muted-foreground">AGC</span>
            </label>
          </div>
        )}
      </div>

      {/* ── Row 2: Device + Test button ── */}
      <div className="flex flex-wrap items-center gap-3 border-b px-5 py-3">
        {mic.devices.length > 0 && (
          <select
            value={mic.deviceId}
            onChange={(e) => mic.setDeviceId(e.target.value)}
            disabled={mic.testing}
            className={cn(
              'min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs outline-none',
              mic.testing && 'opacity-50 cursor-not-allowed',
            )}
          >
            {mic.devices.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Microphone ${i + 1}`}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={mic.testing ? mic.stop : mic.start}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            mic.testing ? 'bg-destructive/10 text-destructive' : 'bg-primary text-primary-foreground',
          )}
        >
          {mic.testing ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
          {mic.testing ? 'Stop' : 'Test mic'}
        </button>

        {mic.testing && <span className="text-[11px] text-muted-foreground/60">Headphones recommended</span>}
        {mic.error && <span className="text-[11px] text-destructive">{mic.error}</span>}
      </div>

      {/* ── Row 3: Volume meter (the centerpiece) ── */}
      <div className="px-5 py-4">
        <VolumeMeter volume={mic.volume} />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground/40">
          <span>Silent</span>
          <span>Loud</span>
        </div>
      </div>

      {/* ── Row 4: Gain + Gate sliders side by side ── */}
      <div className="grid gap-5 border-t px-5 py-4 sm:grid-cols-2">
        {/* Gain */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium">Gain</span>
            <span className="font-mono text-xs font-semibold tabular-nums text-primary">{inputGain}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={300}
            step={1}
            value={inputGain}
            onChange={(e) => setInputGain(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) ${gainPct}%, hsl(var(--muted)) ${gainPct}%)`,
            }}
          />
          <p className="text-[11px] text-muted-foreground/50">100% = unity gain</p>
        </div>

        {/* Gate */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium">Noise gate</span>
            <span className="font-mono text-xs font-semibold tabular-nums text-primary">{noiseGate}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={noiseGate}
            onChange={(e) => setNoiseGate(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) ${gatePct}%, hsl(var(--muted)) ${gatePct}%)`,
            }}
          />
          <p className="text-[11px] text-muted-foreground/50">0% = disabled</p>
        </div>
      </div>

      {/* ── Footer: sync status + note ── */}
      {(syncStatus !== 'idle' || mode === 'rnnoise' || mode === 'krisp') && (
        <div className="flex items-center justify-between border-t px-5 py-2.5">
          {(mode === 'rnnoise' || mode === 'krisp') && (
            <p className="text-[11px] text-muted-foreground/40">
              {mode === 'krisp' ? 'Krisp' : 'RNNoise'} runs in-call only — preview shows gain/gate.
            </p>
          )}
          {syncStatus !== 'idle' && (
            <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
              {syncStatus === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
              {syncStatus === 'saved' && <Check className="h-3 w-3 text-emerald-500" />}
              <span>
                {syncStatus === 'saving' && 'Saving...'}
                {syncStatus === 'saved' && 'Saved'}
                {syncStatus === 'error' && 'Sync failed'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
