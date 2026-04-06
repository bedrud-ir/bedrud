import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { Radio } from 'lucide-react'
import { useAuthStore } from '#/lib/auth.store'
import { ThemeToggle } from '@/components/ThemeToggle'

export const Route = createFileRoute('/auth')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    if (useAuthStore.getState().tokens) throw redirect({ to: '/dashboard' })
  },
  component: AuthLayout,
})

function Waveform() {
  const bars = [3, 6, 9, 5, 8, 4, 7, 10, 6, 4, 8, 5, 9, 3, 7]
  return (
    <div className="flex items-end gap-[3px]" aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-white/30"
          style={{
            height: `${h * 4}px`,
            animation: `wave 1.4s ease-in-out ${(i * 0.09).toFixed(2)}s infinite alternate`,
          }}
        />
      ))}
    </div>
  )
}

function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.3); opacity: 0.3; }
          to   { transform: scaleY(1);   opacity: 1;   }
        }
        @keyframes blob {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50%       { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }
      `}</style>

      {/* ── Left brand panel (always dark) ─────────────────────────────── */}
      <div
        className="relative hidden w-[420px] shrink-0 flex-col justify-between overflow-hidden p-10 lg:flex"
        style={{ background: 'linear-gradient(160deg, #0f0f1a 0%, #0d0d1f 40%, #0a0a18 100%)' }}
      >
        {/* Grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
          aria-hidden
        />

        {/* Aurora blobs */}
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, #6366f130, transparent 70%)',
            animation: 'blob 9s ease-in-out infinite',
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, #8b5cf625, transparent 70%)',
            animation: 'blob 12s ease-in-out 3s infinite',
          }}
        />
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full blur-2xl"
          style={{
            background: 'radial-gradient(circle, #06b6d415, transparent 70%)',
            animation: 'blob 15s ease-in-out 6s infinite',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 2px 16px #6366f150',
            }}
          >
            <Radio className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">bedrud</span>
        </div>

        {/* Center content */}
        <div className="relative space-y-8">
          <Waveform />
          <div className="space-y-4">
            <p className="text-2xl font-bold leading-snug text-white">
              Voice-first meetings,
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #22d3ee 100%)' }}
              >
                built for humans.
              </span>
            </p>
            <p className="text-sm leading-relaxed text-white/40">
              Instant rooms. No installs. Just open a room and start talking — with anyone, anywhere.
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-col gap-2">
            {['End-to-end encrypted', 'Zero telemetry', 'Your infrastructure'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-white/40">
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
                />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="relative text-xs text-white/20">© {new Date().getFullYear()} Bedrud</p>
      </div>

      {/* ── Right form panel ───────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <Radio className="h-4 w-4" />
            bedrud
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="w-full max-w-[360px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
