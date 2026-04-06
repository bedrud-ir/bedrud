import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Room {
  id: string
  name: string
  createdBy: string
  isPublic: boolean
  isActive: boolean
  maxParticipants: number
  createdAt: string
}

interface Props {
  rooms: Room[]
  isLoading: boolean
}

export function RoomTable({ rooms, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Room Name</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead>Max</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No rooms found
              </TableCell>
            </TableRow>
          ) : (
            rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell className="font-mono text-sm">{room.name}</TableCell>
                <TableCell>
                  <Badge variant={room.isPublic ? 'secondary' : 'outline'} className="text-xs">
                    {room.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{room.maxParticipants}</TableCell>
                <TableCell>
                  <span className={`text-xs font-medium ${room.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {room.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(room.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
