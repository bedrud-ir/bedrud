import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Globe, Lock, MessageSquare, Mic, ShieldCheck, Users, Video, Loader2, Settings2 } from 'lucide-react'

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

function ToggleRow({
  icon: Icon,
  label,
  sub,
  checked,
  onChange,
  accentColor = '#6366f1',
}: {
  icon: React.ElementType
  label: string
  sub?: string
  checked: boolean
  onChange: () => void
  accentColor?: string
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-150"
      style={{
        borderColor: checked ? `${accentColor}35` : 'hsl(var(--border))',
        background: checked ? `${accentColor}08` : undefined,
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all"
        style={
          checked
            ? { background: `${accentColor}20`, color: accentColor }
            : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
        }
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      <div
        className="relative h-5 w-9 shrink-0 rounded-full transition-all duration-200"
        style={{ background: checked ? accentColor : 'hsl(var(--muted))' }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: checked ? '18px' : '2px' }}
        />
      </div>
    </button>
  )
}

export function RoomSettingsDialog({ room, open, onOpenChange, onSave }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(room.isPublic)
  const [maxParticipants, setMaxParticipants] = useState(room.maxParticipants)
  const [settings, setSettings] = useState<RoomSettings>({ ...room.settings })

  // Reset to room values when dialog opens
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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Header */}
        <div
          className="px-6 py-5"
          style={{ background: 'linear-gradient(135deg, #6366f108 0%, #8b5cf608 50%, #06b6d408 100%)' }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Settings2 className="h-5 w-5" style={{ color: '#818cf8' }} />
              Room{' '}
              <span
                className="bg-clip-text text-transparent font-mono"
                style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}
              >
                {room.name}
              </span>
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Changes take effect immediately.</p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Max participants */}
          <div className="space-y-1.5">
            <Label htmlFor="settings-max" className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              Max participants
            </Label>
            <Input
              id="settings-max"
              type="number"
              min={2}
              max={500}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value, 10) || 20)}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Visibility</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: false, icon: Lock, label: 'Private', color: '#8b5cf6' },
                { value: true, icon: Globe, label: 'Public', color: '#06b6d4' },
              ].map(({ value, icon: Icon, label, color }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsPublic(value)}
                  className="flex items-center gap-2 rounded-xl border p-3 transition-all"
                  style={{
                    borderColor: isPublic === value ? `${color}45` : 'hsl(var(--border))',
                    background: isPublic === value ? `${color}10` : undefined,
                    boxShadow: isPublic === value ? `0 0 0 1px ${color}25` : undefined,
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: isPublic === value ? color : undefined }} />
                  <span className="text-sm font-medium" style={{ color: isPublic === value ? color : undefined }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Features</p>
            <div className="space-y-2">
              <ToggleRow
                icon={Mic}
                label="Audio"
                sub="Participants can speak"
                checked={settings.allowAudio}
                onChange={() => toggle('allowAudio')}
              />
              <ToggleRow
                icon={Video}
                label="Video"
                sub="Participants can share camera"
                checked={settings.allowVideo}
                onChange={() => toggle('allowVideo')}
                accentColor="#8b5cf6"
              />
              <ToggleRow
                icon={MessageSquare}
                label="Chat"
                sub="In-room text chat"
                checked={settings.allowChat}
                onChange={() => toggle('allowChat')}
                accentColor="#06b6d4"
              />
              <ToggleRow
                icon={ShieldCheck}
                label="End-to-end encryption"
                sub="E2EE for all media"
                checked={settings.e2ee}
                onChange={() => toggle('e2ee')}
                accentColor="#10b981"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all hover:bg-muted active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 16px #6366f140',
              }}
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
