import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoomCard } from '@/components/dashboard/RoomCard'
import { CreateRoomDialog } from '@/components/dashboard/CreateRoomDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '#/lib/api'

interface Room {
  id: string
  name: string
  isPublic: boolean
  maxParticipants: number
  isActive: boolean
  mode: string
  settings: {
    allowChat: boolean
    allowVideo: boolean
    allowAudio: boolean
    requireApproval: boolean
    e2ee: boolean
  }
}

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get<Room[]>('/api/room/list'),
  })

  async function handleJoin(roomName: string) {
    const res = await api.post<{ name: string; token: string; livekitHost: string }>(
      '/api/room/join',
      { roomName }
    )
    navigate({ to: '/m/$meetId', params: { meetId: res.name } })
  }

  async function handleCreate(data: {
    name?: string
    isPublic: boolean
    maxParticipants: number
    settings: Room['settings']
  }) {
    const res = await api.post<Room>('/api/room/create', data)
    setCreateOpen(false)
    queryClient.invalidateQueries({ queryKey: ['rooms'] })
    navigate({ to: '/m/$meetId', params: { meetId: res.name } })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Meetings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create or join a voice meeting
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Meeting
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : rooms && rooms.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onJoin={() => handleJoin(room.name)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Video className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium">No meetings yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create one to get started</p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Meeting
          </Button>
        </div>
      )}

      <CreateRoomDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />
    </div>
  )
}
