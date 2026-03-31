import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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

export function CreateRoomDialog({ open, onOpenChange, onCreate }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [settings, setSettings] = useState<RoomSettings>({
    allowChat: true,
    allowVideo: false,
    allowAudio: true,
    requireApproval: false,
    e2ee: false,
  })

  function toggle(key: keyof RoomSettings) {
    setSettings((s) => ({ ...s, [key]: !s[key] }))
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    const name = (fd.get('name') as string).trim() || undefined
    const maxParticipants = parseInt(fd.get('maxParticipants') as string, 10) || 20

    setIsLoading(true)
    try {
      await onCreate({ name, isPublic, maxParticipants, settings })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Meeting</DialogTitle>
          <DialogDescription>
            Configure your meeting room. Leave the name blank to auto-generate one.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="room-name">Room Name (optional)</Label>
            <Input id="room-name" name="name" placeholder="Auto-generated if blank" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="room-max">Max Participants</Label>
            <Input id="room-max" name="maxParticipants" type="number" min={2} max={500} defaultValue={20} />
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Settings</p>
            {([
              { key: 'isPublic' as const, label: 'Public room', value: isPublic, onChange: () => setIsPublic((v) => !v) },
              { key: 'allowAudio' as const, label: 'Allow audio', value: settings.allowAudio, onChange: () => toggle('allowAudio') },
              { key: 'allowVideo' as const, label: 'Allow video', value: settings.allowVideo, onChange: () => toggle('allowVideo') },
              { key: 'allowChat' as const, label: 'Allow chat', value: settings.allowChat, onChange: () => toggle('allowChat') },
              { key: 'requireApproval' as const, label: 'Require approval to join', value: settings.requireApproval, onChange: () => toggle('requireApproval') },
              { key: 'e2ee' as const, label: 'End-to-end encryption', value: settings.e2ee, onChange: () => toggle('e2ee') },
            ] as const).map(({ key, label, value, onChange }) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`setting-${key}`} className="font-normal cursor-pointer">{label}</Label>
                <Switch id={`setting-${key}`} checked={value} onCheckedChange={onChange} />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating…' : 'Create & Join'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
