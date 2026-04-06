import { createFileRoute, redirect, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuthStore } from '#/lib/auth.store'
import { ArrowRight, Lock, Radio, Server } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    if (useAuthStore.getState().tokens) throw redirect({ to: '/dashboard' })
  },
  component: HomePage,
})

function JoinForm() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  function handleJoin(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const slug = code.trim().toLowerCase().replace(/\s+/g, '-')
    if (!slug) return
    navigate({ to: '/m/$meetId', params: { meetId: slug } })
  }

  return (
    <form onSubmit={handleJoin} className="flex w-full items-center gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Room name or code…"
        autoComplete="off"
        spellCheck={false}
        className="h-11 flex-1 rounded-lg border border-input bg-background/80 px-4 text-sm backdrop-blur-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
      />
      <button
        type="submit"
        disabled={!code.trim()}
        className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
      >
        Join <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </form>
  )
}

function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">

      {/* Single centered glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full opacity-20 dark:opacity-15 blur-[100px]"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
        aria-hidden
      />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Radio className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-mono text-sm font-semibold tracking-tight">bedrud</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            to="/auth/login"
            search={{}}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Sign in
          </Link>
          <Link
            to="/auth/register"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full max-w-lg space-y-10">

          {/* Wordmark + status */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online · Self-hosted
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight leading-[1.15] sm:text-5xl">
                Your rooms.<br />Your rules.
              </h1>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground leading-relaxed">
                Voice-first meetings on infrastructure you control.
                No subscriptions. No surveillance.
              </p>
            </div>
          </div>

          {/* Join form */}
          <div className="space-y-3">
            <JoinForm />
            <p className="text-xs text-muted-foreground">
              No room yet?{' '}
              <Link
                to="/auth/login"
                search={{}}
                className="text-foreground underline underline-offset-4 hover:no-underline"
              >
                Sign in
              </Link>{' '}
              to create one, or{' '}
              <Link to="/auth" className="text-foreground underline underline-offset-4 hover:no-underline">
                continue as guest.
              </Link>
            </p>
          </div>

          {/* Feature row */}
          <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> End-to-end encrypted
            </span>
            <span className="h-3 w-px bg-border" />
            <span className="flex items-center gap-1.5">
              <Server className="h-3 w-3" /> Self-hosted
            </span>
            <span className="h-3 w-px bg-border" />
            <span className="flex items-center gap-1.5">
              <Radio className="h-3 w-3" /> LiveKit powered
            </span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Bedrud · Open source · Self-hosted
        </p>
      </footer>
    </div>
  )
}
