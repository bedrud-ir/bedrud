import { useCallback, useMemo } from 'react'
import type { ChatMessage } from '../MeetingContext'

/**
 * Reads and writes ChatMessage[] from sessionStorage.
 * Data survives tab refresh but is cleared on tab close.
 * Storage is scoped by roomId — different rooms don't collide.
 *
 * Returns [initialMessages, persist]:
 *   - initialMessages: messages loaded on mount (stable reference)
 *   - persist: call with the latest messages array after any change
 */
export function useChatPersistence(roomId: string): [ChatMessage[], (msgs: ChatMessage[]) => void] {
  const key = `chat:${roomId}`

  const initialMessages = useMemo<ChatMessage[]>(() => {
    try {
      const raw = sessionStorage.getItem(key)
      return raw ? (JSON.parse(raw) as ChatMessage[]) : []
    } catch {
      return []
    }
  }, [key])

  const persist = useCallback(
    (msgs: ChatMessage[]) => {
      try {
        sessionStorage.setItem(key, JSON.stringify(msgs))
      } catch {
        // sessionStorage unavailable (private browsing quota exceeded)
      }
    },
    [key],
  )

  return [initialMessages, persist]
}
