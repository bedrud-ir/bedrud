import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { AlertCircle, ArrowRight, Globe, Lock, Radio, Shield, Users, Wifi } from 'lucide-react'
import { useState } from 'react'
import { api } from '#/lib/api'
import { useAuthStore } from '#/lib/auth.store'
import { ThemeToggle } from '@/components/ThemeToggle'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    if (typeof window === 'undefined') return
    await useAuthStore.getState().initialize()
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
        } catch {
          /* use default */
        }
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
      <form
        onSubmit={handleJoin}
        className="group flex items-center gap-0 rounded-xl border border-input bg-background/60 backdrop-blur-sm transition-all focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20"
      >
        <span className="hidden pl-4 text-muted-foreground/50 font-mono text-sm select-none whitespace-nowrap sm:block">
          {typeof window !== 'undefined' ? window.location.host : ''}/m/
        </span>
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(null)
          }}
          placeholder="your-room"
          autoComplete="off"
          spellCheck={false}
          className="h-12 flex-1 bg-transparent pl-4 pr-2 font-mono text-sm outline-none placeholder:text-muted-foreground/40 sm:pl-2 sm:pr-2"
        />
        <button
          type="submit"
          disabled={!code.trim() || checking}
          className="m-1 inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-30"
        >
          {checking ? (
            'Checking…'
          ) : (
            <>
              <span>Join</span> <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
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

const STEPS = [
  { title: 'Create a room', description: "Pick a name, get a link. That's it." },
  { title: 'Share the link', description: "Send it to anyone — they don't need an account." },
  { title: 'Start talking', description: 'Browser-based audio. No installs, no plugins.' },
]

const FEATURES = [
  { icon: Shield, label: 'End-to-end encrypted', description: 'Media stays between participants.' },
  { icon: Wifi, label: 'Low latency', description: 'LiveKit SFU infrastructure under the hood.' },
  { icon: Globe, label: 'No installs', description: 'Works in any modern browser. Desktop or mobile.' },
  { icon: Lock, label: 'Self-hosted', description: 'Your server, your data, your rules.' },
  { icon: Users, label: 'Guest access', description: 'Anyone can join a room without signing up.' },
]

function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Glow — top right, slightly off-screen */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[600px] w-[600px] rounded-full opacity-[0.18] dark:opacity-[0.12] blur-[120px]"
        style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 65%)' }}
        aria-hidden
      />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-8 sm:py-5">
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

      <main className="relative z-10 flex flex-1 flex-col px-4 pb-16 pt-10 sm:px-8 sm:pt-16 md:px-16 md:pt-24 lg:px-24">
        <div className="max-w-xl space-y-20">
          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <div className="space-y-10">
            <div className="space-y-2">
              <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                Voice rooms · Self-hosted
              </p>
              <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
                Talk to people,
                <br />
                <span className="text-muted-foreground">not the platform.</span>
              </h1>
            </div>

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
          </div>

          {/* ── How it works ─────────────────────────────────────────────── */}
          <div className="space-y-6">
            <h2 className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
              How it works
            </h2>
            <ol className="space-y-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex items-baseline gap-4">
                  <span className="font-mono text-xs text-muted-foreground/50 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* ── Features ─────────────────────────────────────────────────── */}
          <div className="space-y-6">
            <h2 className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Built different
            </h2>
            <ul className="space-y-4">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-3">
                  <f.icon className="mt-px h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  <div>
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className="relative z-10 flex items-center gap-4 px-4 py-4 sm:px-8 md:px-16 lg:px-24">
        <a
          href="https://bedrud.org?utm_source=app&utm_medium=footer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          © {new Date().getFullYear()} Bedrud
        </a>
        <span className="h-3 w-px bg-border" />
        <a
          href="https://bedrud.org/docs?utm_source=app&utm_medium=footer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Docs
        </a>
        <a
          href="https://bedrud.org/github?utm_source=app&utm_medium=footer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          GitHub
        </a>
      </footer>
    </div>
  )
}
