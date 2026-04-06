import { createFileRoute, redirect, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, Radio, AlertCircle } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuthStore } from '#/lib/auth.store'
import { api } from '#/lib/api'

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
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  async function handleJoin(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const slug = code.trim().toLowerCase().replace(/\s+/g, '-')
    if (!slug) return
    setError(null)
    setChecking(true)
    try {
      // Probe with a sentinel guest name — server checks room existence first.
      // 404 = room not found; anything else = room exists, proceed.
      await api.post('/api/room/guest-join', { roomName: slug, guestName: '\x00' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.startsWith('404')) {
        setChecking(false)
        // Parse "404: {...json...}" into a human-readable message
        const jsonPart = msg.slice(msg.indexOf(':') + 1).trim()
        let friendlyMsg = 'Room not found'
        try {
          const parsed = JSON.parse(jsonPart) as { error?: string; message?: string }
          friendlyMsg = parsed.error ?? parsed.message ?? friendlyMsg
        } catch { /* use default */ }
        setError(friendlyMsg)
        return
      }
      // 400 / other = room exists but probe was rejected — that's fine, navigate.
    }
    setChecking(false)
    navigate({ to: '/m/$meetId', params: { meetId: slug } })
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleJoin} className="group flex items-center gap-0 rounded-xl border border-input bg-background/60 backdrop-blur-sm transition-all focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
        <span className="pl-4 text-muted-foreground/50 font-mono text-sm select-none whitespace-nowrap">
          {typeof window !== 'undefined' ? window.location.host : ''}/m/
        </span>
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(null) }}
          placeholder="your-room"
          autoComplete="off"
          spellCheck={false}
          autoFocus
          className="h-12 flex-1 bg-transparent px-2 font-mono text-sm outline-none placeholder:text-muted-foreground/40"
        />
        <button
          type="submit"
          disabled={!code.trim() || checking}
          className="m-1 inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-30"
        >
          {checking ? 'Checking…' : <><span>Join</span> <ArrowRight className="h-3.5 w-3.5" /></>}
        </button>
      </form>
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}

function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">

      {/* Glow — top right, slightly off-screen */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[600px] w-[600px] rounded-full opacity-[0.18] dark:opacity-[0.12] blur-[120px]"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 65%)' }}
        aria-hidden
      />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Radio className="h-3.5 w-3.5" />
          <span className="font-mono text-xs font-medium tracking-widest uppercase">bedrud</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            to="/auth/login"
            search={{ redirect: undefined }}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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

      {/* Hero — left-aligned, top of the page */}
      <main className="relative z-10 flex flex-1 flex-col justify-center px-8 pb-20 pt-12 sm:px-16 lg:px-24">
        <div className="max-w-2xl space-y-10">

          {/* Headline */}
          <div className="space-y-2">
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              Voice rooms · Self-hosted
            </p>
            <h1 className="text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
              Talk to people,<br />
              <span className="text-muted-foreground">not the platform.</span>
            </h1>
          </div>

          {/* Join form */}
          <div className="max-w-md space-y-3">
            <p className="text-sm text-muted-foreground">Enter a room to join instantly — no account needed.</p>
            <JoinForm />
            <p className="text-xs text-muted-foreground">
              <Link
                to="/auth/login"
                search={{ redirect: undefined }}
                className="underline underline-offset-4 hover:text-foreground"
              >
                Sign in
              </Link>{' '}
              to create rooms &middot;{' '}
              <Link to="/auth" className="underline underline-offset-4 hover:text-foreground">
                join as guest
              </Link>
            </p>
          </div>

          {/* Divider + meta */}
          <div className="flex items-center gap-8 border-t border-border/50 pt-8 text-xs text-muted-foreground">
            <span>End-to-end encrypted</span>
            <span className="h-3 w-px bg-border" />
            <span>LiveKit powered</span>
            <span className="h-3 w-px bg-border" />
            <span>Open source</span>
          </div>

        </div>
      </main>

      <footer className="relative z-10 px-8 py-4 sm:px-16 lg:px-24">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Bedrud</p>
      </footer>
    </div>
  )
}
