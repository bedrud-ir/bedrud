import { useState, useCallback } from 'react'

export interface UsePinnedParticipants {
  pinned: Set<string>
  toggle: (identity: string) => void
  unpin: (identity: string) => void
  clear: () => void
}

export function usePinnedParticipants(): UsePinnedParticipants {
  const [pinned, setPinned] = useState<Set<string>>(new Set())

  const toggle = useCallback((identity: string) => {
    setPinned((prev) => {
      const next = new Set(prev)
      if (next.has(identity)) next.delete(identity)
      else next.add(identity)
      return next
    })
  }, [])

  const unpin = useCallback((identity: string) => {
    setPinned((prev) => {
      const next = new Set(prev)
      next.delete(identity)
      return next
    })
  }, [])

  const clear = useCallback(() => setPinned(new Set()), [])

  return { pinned, toggle, unpin, clear }
}
