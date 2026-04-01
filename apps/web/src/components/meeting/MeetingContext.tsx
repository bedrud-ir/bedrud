import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useUserStore } from '#/lib/user.store'

interface MeetingContextValue {
  roomId: string
  roomName: string
  adminId: string
  currentUserId: string
  isCreator: boolean
  isAdmin: boolean
  isModerator: boolean
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

  const value = useMemo<MeetingContextValue>(() => ({
    roomId,
    roomName,
    adminId,
    currentUserId,
    isCreator: !!currentUserId && currentUserId === adminId,
    isAdmin: accesses.includes('admin') || accesses.includes('superadmin'),
    isModerator: accesses.includes('moderator'),
  }), [roomId, roomName, adminId, currentUserId, accesses])

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
}
