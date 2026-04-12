import { useRoomContext } from '@livekit/components-react'
import { RoomEvent } from 'livekit-client'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useUserStore } from '#/lib/user.store'

export interface SystemMessage {
  type: 'system'
  event: 'kick' | 'ban' | 'ask_unmute' | 'ask_camera' | 'spotlight' | 'deafen' | 'undeafen'
  actor: string
  target: string
  ts: number
}

export interface ChatAttachment {
  kind: 'image'
  url: string
  mime: string
  w: number
  h: number
  size: number
}

export interface ChatMessage {
  id: string
  timestamp: number
  senderName: string
  senderIdentity: string
  message: string
  attachments: ChatAttachment[]
  isLocal: boolean
}

const KNOWN_SYSTEM_EVENTS = new Set(['kick', 'ban', 'ask_unmute', 'ask_camera', 'spotlight', 'deafen', 'undeafen'])

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
  chatMessages: ChatMessage[]
  systemMessages: SystemMessage[]
  sendChat: (text: string, attachments?: ChatAttachment[]) => void
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

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([])
  const [isServerDeafened, setIsServerDeafened] = useState(false)
  const [isSelfDeafened, setIsSelfDeafened] = useState(false)
  const micBeforeDeafenRef = useRef(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // Track how many messages existed at the last markRead() so we only count new arrivals
  const chatSeenRef = useRef(0)
  const systemSeenRef = useRef(0)

  // Unified data channel listener — handles both "chat" and "system" topics
  useEffect(() => {
    const handler = (payload: Uint8Array, participant: unknown, _kind: unknown, topic?: string) => {
      try {
        const raw = JSON.parse(new TextDecoder().decode(payload))

        if (topic === 'system') {
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
            if (msg.target === currentUserId) {
              if (msg.event === 'deafen') setIsServerDeafened(true)
              else if (msg.event === 'undeafen') setIsServerDeafened(false)
            }
          }
          return
        }

        if (topic === 'chat' && raw.type === 'chat') {
          // Resolve sender identity from the participant object (RemoteParticipant)
          const p = participant as { identity?: string; name?: string } | null
          const senderIdentity = (raw.senderIdentity as string) || p?.identity || ''
          const senderName =
            (raw.senderName as string) || p?.name || p?.identity || 'Unknown'

          const msg: ChatMessage = {
            id: (raw.id as string) || crypto.randomUUID(),
            timestamp: (raw.timestamp as number) || Date.now(),
            senderName,
            senderIdentity,
            message: (raw.message as string) || '',
            attachments: Array.isArray(raw.attachments) ? (raw.attachments as ChatAttachment[]) : [],
            isLocal: false,
          }
          setChatMessages((prev) => [...prev, msg])
        }
      } catch (e) {
        console.warn('[MeetingContext] failed to parse data message:', e)
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
    chatSeenRef.current = chatMessages.length
    systemSeenRef.current = systemMessages.length
    setUnreadCount(0)
  }, [chatMessages.length, systemMessages.length])

  // sendChat publishes a reliable data packet on the "chat" topic.
  // The message is also echoed locally immediately for zero-latency feedback.
  const sendChat = useCallback(
    (text: string, attachments?: ChatAttachment[]) => {
      const lp = room.localParticipant
      const id = crypto.randomUUID()
      const timestamp = Date.now()
      const senderName = lp.name || lp.identity || 'You'
      const senderIdentity = lp.identity || ''

      const payload = {
        type: 'chat',
        id,
        timestamp,
        senderName,
        senderIdentity,
        message: text,
        attachments: attachments ?? [],
      }

      const data = new TextEncoder().encode(JSON.stringify(payload))
      lp.publishData(data, { reliable: true, topic: 'chat' }).catch((err) => {
        console.error('[MeetingContext] failed to publish chat message:', err)
      })

      // Local echo so the sender sees the message immediately
      setChatMessages((prev) => [
        ...prev,
        {
          id,
          timestamp,
          senderName,
          senderIdentity,
          message: text,
          attachments: attachments ?? [],
          isLocal: true,
        },
      ])
    },
    [room],
  )

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
      isCreator: !!adminId && (currentUserId === adminId || room.localParticipant.identity === adminId),
      isAdmin: accesses.includes('admin') || accesses.includes('superadmin'),
      isModerator: accesses.includes('moderator'),
      isServerDeafened,
      isSelfDeafened,
      toggleSelfDeafen,
      chatMessages,
      systemMessages,
      sendChat,
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
      sendChat,
      unreadCount,
      markRead,
      room.localParticipant.identity,
    ],
  )

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
}
