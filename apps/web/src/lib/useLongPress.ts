import { useCallback, useRef } from 'react'

export function useLongPress(callback: (e: React.PointerEvent) => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eventRef = useRef<React.PointerEvent | null>(null)

  const start = useCallback(
    (e: React.PointerEvent) => {
      // Only trigger on touch/stylus, not mouse (mouse uses right-click via ContextMenu)
      if (e.pointerType === 'mouse') return
      eventRef.current = e
      timerRef.current = setTimeout(() => {
        if (eventRef.current) callback(eventRef.current)
      }, ms)
    },
    [callback, ms]
  )

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
  }
}
