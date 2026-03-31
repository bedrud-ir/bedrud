import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useParticipants,
} from '@livekit/components-react'
import { ConnectionState } from 'livekit-client'
import { useAuthStore } from '#/lib/auth.store'
import { api } from '#/lib/api'
import { ParticipantGrid } from '@/components/meeting/ParticipantGrid'
import { ControlsBar } from '@/components/meeting/ControlsBar'
import { ChatPanel } from '@/components/meeting/ChatPanel'
import { ParticipantsList } from '@/components/meeting/ParticipantsList'

interface JoinResponse {
  name: string
  token: string
  livekitHost: string
}

export const Route = createFileRoute('/m/$meetId')({
  beforeLoad: () => {
    if (!useAuthStore.getState().tokens) {
      throw redirect({ to: '/auth' })
    }
  },
  loader: async ({ params }) => {
    const res = await api.post<JoinResponse>('/api/room/join', { roomName: params.meetId })
    return { token: res.token, wsUrl: res.livekitHost, roomName: res.name }
  },
  component: MeetingPage,
})

function MeetingPage() {
  const { meetId } = Route.useParams()
  const { token, wsUrl } = Route.useLoaderData()
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(false)
  const [participantsOpen, setParticipantsOpen] = useState(false)

  function handleLeave() {
    navigate({ to: '/dashboard' })
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={wsUrl}
      connect={true}
      audio={true}
      video={false}
      className="flex h-screen flex-col bg-background overflow-hidden"
    >
      <RoomAudioRenderer />
      <MeetingHeader meetId={meetId} />
      <div className="flex flex-1 overflow-hidden">
        <ParticipantGrid />
        {chatOpen && (
          <ChatPanel onClose={() => setChatOpen(false)} />
        )}
        {participantsOpen && !chatOpen && (
          <ParticipantsList onClose={() => setParticipantsOpen(false)} />
        )}
      </div>
      <ControlsBar
        onToggleChat={() => { setChatOpen((o) => !o); setParticipantsOpen(false) }}
        onToggleParticipants={() => { setParticipantsOpen((o) => !o); setChatOpen(false) }}
        onLeave={handleLeave}
        chatOpen={chatOpen}
        participantsOpen={participantsOpen}
      />
    </LiveKitRoom>
  )
}

function MeetingHeader({ meetId }: { meetId: string }) {
  const state = useConnectionState()
  const participants = useParticipants()
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="font-semibold">Meeting</span>
        <span className="text-muted-foreground">·</span>
        <span className="font-mono text-xs text-muted-foreground">{meetId}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground">{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            state === ConnectionState.Connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
          }`}
        />
        <span className="text-xs text-muted-foreground capitalize">{state}</span>
      </div>
    </header>
  )
}
