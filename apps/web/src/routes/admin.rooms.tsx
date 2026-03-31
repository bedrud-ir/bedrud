import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { RoomTable } from '@/components/admin/RoomTable'
import { api } from '#/lib/api'

interface Room {
  id: string
  name: string
  createdBy: string
  isPublic: boolean
  isActive: boolean
  maxParticipants: number
  createdAt: string
}

export const Route = createFileRoute('/admin/rooms')({
  component: AdminRoomsPage,
})

function AdminRoomsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'rooms'],
    queryFn: () => api.get<{ rooms: Room[] }>('/api/admin/rooms'),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rooms</h1>
        <p className="text-muted-foreground text-sm mt-1">All meeting rooms in the system</p>
      </div>
      <RoomTable rooms={data?.rooms ?? []} isLoading={isLoading} />
    </div>
  )
}
