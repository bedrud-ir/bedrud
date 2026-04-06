import { useRoomContext } from '@livekit/components-react'
import { ConnectionState, RoomEvent } from 'livekit-client'
import { Check, ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const STORAGE_KEYS: Record<DeviceSelectorProps['kind'], string> = {
  audioinput: 'bedrud_mic_device',
  videoinput: 'bedrud_cam_device',
  audiooutput: 'bedrud_speaker_device',
}

export interface DeviceSelectorProps {
  kind: 'audioinput' | 'videoinput' | 'audiooutput'
}

export function DeviceSelector({ kind }: DeviceSelectorProps) {
  const room = useRoomContext()
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [activeId, setActiveId] = useState<string>(() => localStorage.getItem(STORAGE_KEYS[kind]) ?? '')

  const syncActiveFromRoom = useCallback(() => {
    const actual = room.getActiveDevice(kind)
    if (actual) setActiveId(actual)
  }, [room, kind])

  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      setDevices(all.filter((d) => d.kind === kind))
      syncActiveFromRoom()
    } catch {
      // permissions not yet granted
    }
  }, [kind, syncActiveFromRoom])

  useEffect(() => {
    refreshDevices()
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices)
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices)
  }, [refreshDevices])

  // Restore saved device — wait until the room is connected, then sync actual active
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS[kind])

    async function applyDevice() {
      if (saved) {
        await room.switchActiveDevice(kind, saved).catch(() => {})
      }
      syncActiveFromRoom()
    }

    if (room.state === ConnectionState.Connected) {
      applyDevice()
      return
    }

    function onConnected() {
      applyDevice()
    }
    room.once(RoomEvent.Connected, onConnected)
    return () => {
      room.off(RoomEvent.Connected, onConnected)
    }
  }, [room, kind, syncActiveFromRoom])

  // Sync when room reports a device change (e.g. system default changed)
  useEffect(() => {
    const handler = () => syncActiveFromRoom()
    room.on(RoomEvent.ActiveDeviceChanged, handler)
    return () => {
      room.off(RoomEvent.ActiveDeviceChanged, handler)
    }
  }, [room, syncActiveFromRoom])

  async function handleSelect(deviceId: string) {
    await room.switchActiveDevice(kind, deviceId).catch(() => {})
    setActiveId(deviceId)
    localStorage.setItem(STORAGE_KEYS[kind], deviceId)
  }

  if (devices.length <= 1) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-4 rounded-sm px-0 text-muted-foreground hover:text-foreground"
          aria-label={`Select ${kind === 'audioinput' ? 'microphone' : kind === 'videoinput' ? 'camera' : 'speaker'}`}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56">
        {devices.map((d, i) => (
          <DropdownMenuItem
            key={d.deviceId}
            onClick={() => handleSelect(d.deviceId)}
            className="flex items-center justify-between gap-2"
          >
            <span className="truncate">
              {d.label ||
                `${kind === 'audioinput' ? 'Microphone' : kind === 'videoinput' ? 'Camera' : 'Speaker'} ${i + 1}`}
            </span>
            {activeId === d.deviceId && <Check className="h-3.5 w-3.5 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
