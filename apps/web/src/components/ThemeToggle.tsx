import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore, resolveTheme } from '#/lib/theme.store'

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Before mount, render a placeholder with the same dimensions so layout
  // doesn't shift, but no theme-dependent content (avoids hydration mismatch).
  const isDark = mounted && resolveTheme(theme) === 'dark'

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const next = isDark ? 'light' : 'dark'
    const x = e.clientX
    const y = e.clientY

    if (!document.startViewTransition) {
      setTheme(next)
      return
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    const transition = document.startViewTransition(() => {
      // Toggle the class synchronously so startViewTransition
      // captures the correct before/after snapshots.
      document.documentElement.classList.toggle('dark', next === 'dark')
      setTheme(next)
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 400,
          easing: 'ease-in',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
