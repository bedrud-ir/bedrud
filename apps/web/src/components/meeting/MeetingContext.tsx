import { useChat, useRoomContext } from '@livekit/components-react'
import { RoomEvent } from 'livekit-client'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useUserStore } from '#/lib/user.store'

export interface SystemMessage {
  type: 'system'
  event: 'kick' | 'ban' | 'ask_unmute' | 'ask_camera' | 'spotlight' | 'deafen' | 'undeafen'
  actor: string
  target: string
  ts: number
}

const KNOWN_SYSTEM_EVENTS = new Set(['kick', 'ban', 'ask_unmute', 'ask_camera', 'spotlight', 'deafen', 'undeafen'])

type ChatMessages = ReturnType<typeof useChat>['chatMessages']
type SendFn = ReturnType<typeof useChat>['send']

interface MeetingContextValue {
  roomId: string
  roomName: string
  adminId: string
  currentUserId: string
  isCreator: boolean
  isAdmin: boolean
  isModerator: boolean
  // Server-deafened: admin/mod sent a deafen system message targeting this user
  isServerDeafened: boolean
  // Self-deafened: user toggled deafen from controls bar
  isSelfDeafened: boolean
  toggleSelfDeafen: () => void
  // Chat — always live, regardless of panel visibility
  chatMessages: ChatMessages
  systemMessages: SystemMessage[]
  send: SendFn
  isSending: boolean
  unreadCount: number
  markRead: () => void
}

const MeetingContext = createContext<MeetingContextValue | null>(null)

export function useMeetingContext(): MeetingContextValue {
  const ctx = useContext(MeetingContext)
  if (!ctx) throw new Error('useMeetingContext must be used inside MeetingProvider')
  return ctx
}

interface MeetingProviderProps {
  roomId: string
  roomName: string
  adminId: string
  children: ReactNode
}

export function MeetingProvider({ roomId, roomName, adminId, children }: MeetingProviderProps) {
  const user = useUserStore((s) => s.user)
  const currentUserId = user?.id ?? ''
  const accesses = user?.accesses ?? []
  const room = useRoomContext()

  // useChat is always mounted here — messages accumulate whether the panel is open or not
  const { chatMessages, send, isSending } = useChat()
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([])
  const [isServerDeafened, setIsServerDeafened] = useState(false)
  const [isSelfDeafened, setIsSelfDeafened] = useState(false)
  const micBeforeDeafenRef = useRef(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // Track how many messages existed at the last markRead() so we only count new arrivals
  const chatSeenRef = useRef(chatMessages.length)
  const systemSeenRef = useRef(0)

  // System data messages (kick/ban events) — always listening
  useEffect(() => {
    const handler = (payload: Uint8Array, _participant: unknown, _kind: unknown, topic?: string) => {
      if (topic !== 'system') return
      try {
        const raw = JSON.parse(new TextDecoder().decode(payload))
        if (
          raw.type === 'system' &&
          typeof raw.event === 'string' &&
          KNOWN_SYSTEM_EVENTS.has(raw.event) &&
          typeof raw.actor === 'string' &&
          raw.actor.length > 0 &&
          typeof raw.target === 'string' &&
          raw.target.length > 0
        ) {
          const msg = { ...(raw as SystemMessage), ts: Date.now() }
          setSystemMessages((prev) => [...prev, msg])
          // Track server-deafen state for current user
          if (msg.target === currentUserId) {
            if (msg.event === 'deafen') setIsServerDeafened(true)
            else if (msg.event === 'undeafen') setIsServerDeafened(false)
          }
        }
      } catch (e) {
        console.warn('[MeetingContext] failed to parse system message:', e)
      }
    }
    room.on(RoomEvent.DataReceived, handler)
    return () => {
      room.off(RoomEvent.DataReceived, handler)
    }
  }, [room, currentUserId])

  // Increment unread counter only for messages that arrive after the last markRead()
  useEffect(() => {
    const chatDelta = chatMessages.length - chatSeenRef.current
    const systemDelta = systemMessages.length - systemSeenRef.current
    chatSeenRef.current = chatMessages.length
    systemSeenRef.current = systemMessages.length
    if (chatDelta > 0 || systemDelta > 0) {
      setUnreadCount((n) => n + chatDelta + systemDelta)
    }
  }, [chatMessages.length, systemMessages.length])

  const markRead = useCallback(() => {
    // Sync refs so the next delta calculation starts from the right baseline
    chatSeenRef.current = chatMessages.length
    systemSeenRef.current = systemMessages.length
    setUnreadCount(0)
  }, [chatMessages.length, systemMessages.length])

  const toggleSelfDeafen = useCallback(() => {
    const lp = room.localParticipant
    const newDeafened = !isSelfDeafened

    if (newDeafened) {
      micBeforeDeafenRef.current = lp.isMicrophoneEnabled
      lp.setMicrophoneEnabled(false)
    } else {
      lp.setMicrophoneEnabled(micBeforeDeafenRef.current)
    }

    // Broadcast deafened state to all participants via metadata
    let meta: Record<string, unknown> = {}
    try {
      meta = JSON.parse(lp.metadata ?? '{}')
    } catch {
      /* ignore */
    }
    lp.setMetadata(JSON.stringify({ ...meta, deafened: newDeafened }))
    setIsSelfDeafened(newDeafened)
  }, [room, isSelfDeafened])

  const value = useMemo<MeetingContextValue>(
    () => ({
      roomId,
      roomName,
      adminId,
      currentUserId,
      // Use LiveKit local participant identity as the source of truth — it's set
      // directly from the JWT claims.UserID and avoids any user-store format mismatch.
      isCreator: !!adminId && (currentUserId === adminId || room.localParticipant.identity === adminId),
      isAdmin: accesses.includes('admin') || accesses.includes('superadmin'),
      isModerator: accesses.includes('moderator'),
      isServerDeafened,
      isSelfDeafened,
      toggleSelfDeafen,
      chatMessages,
      systemMessages,
      send,
      isSending,
      unreadCount,
      markRead,
    }),
    [
      roomId,
      roomName,
      adminId,
      currentUserId,
      accesses,
      isServerDeafened,
      isSelfDeafened,
      toggleSelfDeafen,
      chatMessages,
      systemMessages,
      send,
      isSending,
      unreadCount,
      markRead,
      room.localParticipant.identity,
    ],
  )

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
}
