// OAuth redirects must be absolute — the browser navigates there directly.
// Prefer VITE_OAUTH_URL, fall back to VITE_API_URL, and never silently
// default to an insecure localhost URL in production.
const _EXPLICIT_OAUTH = import.meta.env['VITE_OAUTH_URL'] as string | undefined
const _API_URL = import.meta.env['VITE_API_URL'] as string | undefined

function resolveOAuthBase(): string {
  const base = _EXPLICIT_OAUTH || _API_URL || ''
  if (!base) {
    if (import.meta.env.DEV)
      console.error(
        'OAuthButtons: VITE_OAUTH_URL or VITE_API_URL must be configured. ' + 'OAuth login links will not work.',
      )
    return ''
  }
  // In production (page served over HTTPS), force the redirect URL to HTTPS
  // to avoid sending auth tokens over a plaintext connection.
  if (globalThis.location?.protocol === 'https:' && base.startsWith('http:')) {
    return base.replace(/^http:/, 'https:')
  }
  return base
}

const OAUTH_BASE = resolveOAuthBase()

const ALL_PROVIDERS = [
  {
    id: 'google',
    label: 'Continue with Google',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  {
    id: 'github',
    label: 'Continue with GitHub',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    id: 'twitter',
    label: 'Continue with Twitter / X',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
]

interface Props {
  availableProviders: string[]
}

export function OAuthButtons({ availableProviders }: Props) {
  if (!OAUTH_BASE) return null

  const filtered = ALL_PROVIDERS.filter((p) => availableProviders.includes(p.id))
  if (filtered.length === 0) return null

  return (
    <div className="space-y-2">
      {filtered.map(({ id, label, icon }) => (
        <a
          key={id}
          href={`${OAUTH_BASE}/api/auth/${id}/login`}
          className="flex w-full items-center justify-center gap-2 border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {icon}
          {label}
        </a>
      ))}
    </div>
  )
}
