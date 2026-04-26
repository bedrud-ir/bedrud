import { useConnectionState } from '@livekit/components-react'
import { ConnectionState } from 'livekit-client'
import { useEffect } from 'react'

/** Prevents accidental tab close while connected to a call. */
export function BeforeUnloadLock() {
  const state = useConnectionState()

  useEffect(() => {
    if (state !== ConnectionState.Connected) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [state])

  return null
}
