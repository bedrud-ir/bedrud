import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Globe, Lock, MessageSquare, Mic, ShieldCheck, Users, Video, Loader2, AlertCircle } from 'lucide-react'

interface RoomSettings {
  allowChat: boolean
  allowVideo: boolean
  allowAudio: boolean
  requireApproval: boolean
  e2ee: boolean
}

interface Room {
  id: string
  name: string
  isPublic: boolean
  maxParticipants: number
  settings: RoomSettings
}

interface Props {
  room: Room
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (roomId: string, data: { isPublic: boolean; maxParticipants: number; settings: RoomSettings }) => Promise<void>
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'relative h-4 w-7 shrink-0 rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted-foreground/30',
      )}
    >
      <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all', checked ? 'left-3.5' : 'left-0.5')} />
    </button>
  )
}

function ToggleRow({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ElementType
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors',
        checked ? 'border-primary/30 bg-primary/5' : 'hover:bg-accent',
      )}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0', checked ? 'text-primary' : 'text-muted-foreground')} />
      <span className={cn('flex-1 text-xs font-medium', checked ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
      <Toggle checked={checked} onChange={() => {}} />
    </button>
  )
}

export function RoomSettingsDialog({ room, open, onOpenChange, onSave }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(room.isPublic)
  const [maxParticipants, setMaxParticipants] = useState(room.maxParticipants)
  const [settings, setSettings] = useState<RoomSettings>({ ...room.settings })

  function handleOpenChange(open: boolean) {
    if (open) {
      setIsPublic(room.isPublic)
      setMaxParticipants(room.maxParticipants)
      setSettings({ ...room.settings })
      setError(null)
    }
    onOpenChange(open)
  }

  function toggle(key: keyof RoomSettings) {
    setSettings((s) => ({ ...s, [key]: !s[key] }))
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await onSave(room.id, { isPublic, maxParticipants, settings })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm gap-0 p-0 overflow-hidden">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <span className="font-mono text-muted-foreground">{room.name}</span>
            <span className="text-muted-foreground/40">·</span>
            Settings
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Max participants */}
          <div className="space-y-1">
            <Label htmlFor="settings-max" className="flex items-center gap-1.5 text-xs font-medium">
              <Users className="h-3 w-3 text-muted-foreground" /> Max participants
            </Label>
            <Input
              id="settings-max"
              type="number"
              min={2}
              max={500}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value, 10) || 20)}
              className="h-8 text-xs"
            />
          </div>

          {/* Visibility */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Visibility</p>
            <div className="flex rounded-md border overflow-hidden">
              {([
                { value: false, icon: Lock, label: 'Private' },
                { value: true, icon: Globe, label: 'Public' },
              ] as const).map(({ value, icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsPublic(value)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors',
                    isPublic === value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className="h-3 w-3" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Features</p>
            <div className="space-y-1">
              <ToggleRow icon={Mic} label="Audio" checked={settings.allowAudio} onChange={() => toggle('allowAudio')} />
              <ToggleRow icon={Video} label="Video" checked={settings.allowVideo} onChange={() => toggle('allowVideo')} />
              <ToggleRow icon={MessageSquare} label="Chat" checked={settings.allowChat} onChange={() => toggle('allowChat')} />
              <ToggleRow icon={ShieldCheck} label="End-to-end encryption" checked={settings.e2ee} onChange={() => toggle('e2ee')} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</> : 'Save changes'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
