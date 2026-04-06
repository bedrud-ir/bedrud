import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  Globe,
  Lock,
  MessageSquare,
  Mic,
  ShieldCheck,
  Users,
  Video,
  Loader2,
  AlertCircle,
  UserCheck,
  ArrowRight,
  Minus,
  Plus,
} from 'lucide-react'
import { getErrorMessage } from '@/lib/errors'

interface RoomSettings {
  allowChat: boolean
  allowVideo: boolean
  allowAudio: boolean
  requireApproval: boolean
  e2ee: boolean
}

interface CreateRoomData {
  name?: string
  isPublic: boolean
  maxParticipants: number
  settings: RoomSettings
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: CreateRoomData) => Promise<void>
}

const DEFAULT_SETTINGS: RoomSettings = {
  allowChat: true,
  allowVideo: false,
  allowAudio: true,
  requireApproval: false,
  e2ee: false,
}

const FEATURES = [
  { key: 'allowAudio' as const, icon: Mic, label: 'Audio' },
  { key: 'allowVideo' as const, icon: Video, label: 'Video' },
  { key: 'allowChat' as const, icon: MessageSquare, label: 'Chat' },
  { key: 'e2ee' as const, icon: ShieldCheck, label: 'E2E' },
  { key: 'requireApproval' as const, icon: UserCheck, label: 'Gate' },
]

export function CreateRoomDialog({ open, onOpenChange, onCreate }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [maxParticipants, setMaxParticipants] = useState(20)
  const [isPublic, setIsPublic] = useState(false)
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_SETTINGS)

  function toggle(key: keyof RoomSettings) {
    setSettings((s) => ({ ...s, [key]: !s[key] }))
  }

  function resetForm() {
    setIsLoading(false)
    setCreateError(null)
    setName('')
    setMaxParticipants(20)
    setIsPublic(false)
    setSettings(DEFAULT_SETTINGS)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setCreateError(null)
    try {
      await onCreate({ name: name.trim() || undefined, isPublic, maxParticipants, settings })
      resetForm()
      onOpenChange(false)
    } catch (err) {
      setCreateError(getErrorMessage(err, 'Failed to create room'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border p-0 max-w-[calc(100vw-2rem)] sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          {/* Room name — the hero input */}
          <div className="px-5 pt-5 pb-4">
            <input
              value={name}
              onChange={(e) => {
                const v = e.target.value
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9-]/g, '')
                setName(v)
              }}
              placeholder="room-name"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              className="w-full bg-transparent font-mono text-lg font-semibold tracking-tight outline-none placeholder:text-muted-foreground/30"
            />
            <p className="mt-1 text-[11px] text-muted-foreground/50">
              Leave blank to auto-generate
            </p>
          </div>

          {/* Visibility + Capacity — single row */}
          <div className="flex flex-wrap items-center gap-3 border-t px-5 py-3">
            <div className="flex items-center gap-0.5 rounded-lg border bg-background p-0.5">
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  !isPublic
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Lock className="h-3 w-3" />
                Private
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  isPublic
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Globe className="h-3 w-3" />
                Public
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground/50" />
              <button
                type="button"
                onClick={() => setMaxParticipants((p) => Math.max(2, p - 5))}
                className="flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-6 text-center font-mono text-xs font-medium">{maxParticipants}</span>
              <button
                type="button"
                onClick={() => setMaxParticipants((p) => Math.min(500, p + 5))}
                className="flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-1.5 border-t px-5 py-3">
            {FEATURES.map(({ key, icon: Icon, label }) => {
              const active = settings[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    active
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              )
            })}
          </div>

          {/* Error */}
          {createError && (
            <div className="mx-5 mb-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {createError}
            </div>
          )}

          {/* Action */}
          <div className="border-t px-5 py-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...</>
              ) : (
                <>Create & join <ArrowRight className="h-3.5 w-3.5" /></>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
