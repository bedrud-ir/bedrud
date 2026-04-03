import { createFileRoute, redirect, Link, useNavigate } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { useAuthStore } from '#/lib/auth.store'
import { ArrowRight, Radio, Lock, Server, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    if (useAuthStore.getState().tokens) throw redirect({ to: '/dashboard' })
  },
  component: HomePage,
})

/* ── Animated aurora mesh — pure CSS, theme-aware ──────────────────────────── */
function AuroraMesh() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Primary blob — indigo */}
      <div
        className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full opacity-30 dark:opacity-20 blur-[120px]"
        style={{
          background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
          animation: 'aurora-drift 14s ease-in-out infinite alternate',
        }}
      />
      {/* Secondary blob — violet */}
      <div
        className="absolute top-1/3 -right-32 h-[500px] w-[500px] rounded-full opacity-25 dark:opacity-15 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
          animation: 'aurora-drift 18s ease-in-out 4s infinite alternate-reverse',
        }}
      />
      {/* Accent blob — cyan */}
      <div
        className="absolute -bottom-20 left-1/3 h-[400px] w-[400px] rounded-full opacity-20 dark:opacity-15 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
          animation: 'aurora-drift 22s ease-in-out 8s infinite alternate',
        }}
      />
      {/* Pink accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full opacity-15 dark:opacity-10 blur-[80px]"
        style={{
          background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)',
          animation: 'aurora-drift 26s ease-in-out 2s infinite alternate-reverse',
        }}
      />
    </div>
  )
}

/* ── Glowing orbit beacon ─────────────────────────────────────────────────── */
function Beacon() {
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full opacity-40 blur-xl"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, #8b5cf6 50%, transparent 70%)' }}
      />
      {/* Pulse rings */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            border: '1.5px solid',
            borderColor: i === 0 ? '#6366f180' : i === 1 ? '#8b5cf660' : '#06b6d440',
            animation: `beacon 2.8s ease-out ${i * 0.9}s infinite`,
          }}
        />
      ))}
      {/* Core */}
      <div
        className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: 'linear-gradient(135deg, #6366f120 0%, #8b5cf620 50%, #06b6d420 100%)',
          boxShadow: 'inset 0 1px 0 #ffffff18, 0 0 0 1px #6366f130',
        }}
      >
        <Radio
          className="h-7 w-7"
          style={{ color: '#818cf8' }}
        />
      </div>
    </div>
  )
}

/* ── Gradient text helper ─────────────────────────────────────────────────── */
function GradientText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #06b6d4 100%)' }}
    >
      {children}
    </span>
  )
}

/* ── Room join input ──────────────────────────────────────────────────────── */
function JoinForm() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleJoin(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const slug = code.trim().toLowerCase().replace(/\s+/g, '-')
    if (!slug) return
    navigate({ to: '/m/$meetId', params: { meetId: slug } })
  }

  return (
    <form onSubmit={handleJoin} className="relative w-full max-w-lg mx-auto">
      {/* Glow behind the form */}
      <div
        className="absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 blur-sm"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
          opacity: focused ? 0.5 : 0,
        }}
      />
      <div
        className="relative flex items-center gap-0 rounded-2xl p-1.5 transition-all duration-300"
        style={{
          background: focused
            ? 'linear-gradient(135deg, #6366f112, #8b5cf612, #06b6d412)'
            : undefined,
          border: '1px solid',
          borderColor: focused ? '#6366f150' : 'hsl(var(--border))',
          backgroundColor: focused ? undefined : 'hsl(var(--background))',
          boxShadow: focused ? '0 0 0 1px #6366f130, 0 8px 32px #6366f118' : undefined,
        }}
      >
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Enter a room name or paste a code…"
          autoComplete="off"
          spellCheck={false}
          className="h-12 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground font-mono"
        />
        <button
          type="submit"
          disabled={!code.trim()}
          className="h-10 shrink-0 cursor-pointer rounded-xl px-5 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          style={{
            background: code.trim()
              ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
              : 'hsl(var(--muted))',
            color: code.trim() ? 'white' : 'hsl(var(--muted-foreground))',
            boxShadow: code.trim() ? '0 4px 14px #6366f140' : undefined,
          }}
        >
          Join <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}

/* ── Feature pill ─────────────────────────────────────────────────────────── */
function Pill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  )
}

/* ── Stats strip ──────────────────────────────────────────────────────────── */
function StatsStrip() {
  const stats = [
    { value: 'E2EE', label: 'Encrypted', color: '#6366f1' },
    { value: '∞', label: 'Rooms', color: '#8b5cf6' },
    { value: '0ms', label: 'Setup time', color: '#06b6d4' },
    { value: '100%', label: 'Self-hosted', color: '#ec4899' },
  ]
  return (
    <div className="grid grid-cols-4 divide-x divide-border rounded-2xl border border-border overflow-hidden">
      {stats.map(({ value, label, color }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-0.5 py-4 px-3 text-center"
          style={{ background: `${color}06` }}
        >
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ color }}
          >
            {value}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────────────────────── */
function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <style>{`
        @keyframes beacon {
          0%   { transform: scale(1);    opacity: 0.7; }
          100% { transform: scale(3.2);  opacity: 0;   }
        }
        @keyframes aurora-drift {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(60px, -40px) scale(1.1); }
          66%  { transform: translate(-30px, 60px) scale(0.95); }
          100% { transform: translate(40px, 20px) scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      {/* Aurora background */}
      <AuroraMesh />

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
        aria-hidden
      />

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 2px 12px #6366f140',
            }}
          >
            <Radio className="h-4 w-4 text-white" />
          </div>
          <span className="font-mono text-sm font-semibold tracking-tight">bedrud</span>
          <span
            className="hidden sm:flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: '#10b98118', color: '#10b981' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            online
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/auth/login"
            className="rounded-lg px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
          >
            Sign in
          </Link>
          <Link to="/auth/register">
            <button
              className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 2px 12px #6366f140',
              }}
            >
              Get started
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10 px-6 py-12 text-center">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium backdrop-blur-sm"
          style={{
            borderColor: '#6366f140',
            background: '#6366f10a',
            color: '#818cf8',
          }}
        >
          <Zap className="h-3 w-3" style={{ color: '#facc15' }} />
          Self-hosted · Voice-first · End-to-end encrypted
        </div>

        {/* Beacon */}
        <div style={{ animation: 'float 4s ease-in-out infinite' }}>
          <Beacon />
        </div>

        {/* Headline */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1] sm:text-6xl lg:text-7xl">
            Your rooms.{' '}
            <br className="hidden sm:block" />
            <GradientText>Your rules.</GradientText>
          </h1>
          <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            A self-hosted, voice-first meeting space running on{' '}
            <span className="text-foreground font-medium">infrastructure you control</span>.
            No subscriptions, no surveillance, no compromise.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          <Pill icon={Lock} label="End-to-end encrypted" />
          <Pill icon={Server} label="Self-hosted" />
          <Pill icon={Radio} label="LiveKit powered" />
          <Pill icon={Zap} label="Sub-100ms latency" />
        </div>

        {/* Join form */}
        <div className="w-full max-w-lg space-y-3">
          <JoinForm />
          <p className="text-xs text-muted-foreground">
            No room yet?{' '}
            <Link
              to="/auth/login"
              className="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
              style={{ color: '#818cf8' }}
            >
              Sign in
            </Link>{' '}
            to create one, or{' '}
            <Link
              to="/auth"
              className="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
              style={{ color: '#818cf8' }}
            >
              continue as guest.
            </Link>
          </p>
        </div>

        {/* Stats */}
        <div className="w-full max-w-lg">
          <StatsStrip />
        </div>

        {/* CTA pair */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Link to="/auth/register" className="flex-1">
            <button
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
                boxShadow: '0 4px 20px #6366f140',
              }}
            >
              Create your space →
            </button>
          </Link>
          <Link to="/auth" className="flex-1">
            <button
              className="w-full rounded-xl border py-3 text-sm font-medium transition-all duration-200 hover:bg-muted active:scale-95"
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              Join as guest
            </button>
          </Link>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t px-6 py-5 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Bedrud · Open source · Self-hosted
        </p>
      </footer>
    </div>
  )
}
