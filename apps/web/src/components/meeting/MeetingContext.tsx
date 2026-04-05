import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useChat, useRoomContext } from '@livekit/components-react'
import { RoomEvent } from 'livekit-client'
import { useUserStore } from '#/lib/user.store'

export interface SystemMessage {
  type: 'system'
  event: 'kick' | 'ban'
  actor: string
  target: string
  ts: number
}

const KNOWN_SYSTEM_EVENTS = new Set(['kick', 'ban'])

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
          typeof raw.event === 'string' && KNOWN_SYSTEM_EVENTS.has(raw.event) &&
          typeof raw.actor === 'string' && raw.actor.length > 0 &&
          typeof raw.target === 'string' && raw.target.length > 0
        ) {
          setSystemMessages((prev) => [...prev, { ...(raw as SystemMessage), ts: Date.now() }])
        }
      } catch (e) {
        console.warn('[MeetingContext] failed to parse system message:', e)
      }
    }
    room.on(RoomEvent.DataReceived, handler)
    return () => { room.off(RoomEvent.DataReceived, handler) }
  }, [room])

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

  const value = useMemo<MeetingContextValue>(() => ({
    roomId,
    roomName,
    adminId,
    currentUserId,
    isCreator: !!currentUserId && currentUserId === adminId,
    isAdmin: accesses.includes('admin') || accesses.includes('superadmin'),
    isModerator: accesses.includes('moderator'),
    chatMessages,
    systemMessages,
    send,
    isSending,
    unreadCount,
    markRead,
  }), [roomId, roomName, adminId, currentUserId, accesses, chatMessages, systemMessages, send, isSending, unreadCount, markRead])

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
}
