import { useCallback, useEffect, useRef } from 'react'

export function useLongPress(callback: (e: React.PointerEvent) => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    startPosRef.current = null
  }, [])

  // Cleanup on unmount — prevents timer firing after the element is gone
  useEffect(() => () => cancel(), [cancel])

  const start = useCallback(
    (e: React.PointerEvent) => {
      // Only trigger for touch/stylus — desktop right-click is handled by ContextMenu natively
      if (e.pointerType === 'mouse') return
      startPosRef.current = { x: e.clientX, y: e.clientY }
      timerRef.current = setTimeout(() => {
        callback(e)
        startPosRef.current = null
        timerRef.current = null
      }, ms)
    },
    [callback, ms],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startPosRef.current) return
      const dx = e.clientX - startPosRef.current.x
      const dy = e.clientY - startPosRef.current.y
      // Cancel if the pointer has drifted more than 10px — user is scrolling, not pressing
      if (Math.sqrt(dx * dx + dy * dy) > 10) cancel()
    },
    [cancel],
  )

  return {
    onPointerDown: start,
    onPointerMove,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
  }
}
