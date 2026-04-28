import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft, Home, Radio, Server, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Parse raw API error strings like "404: {\"error\":\"Room not found\"}"
 * into human-readable messages.
 */
export function parseApiError(raw: string): { code?: number; message: string } {
  const match = raw.match(/^(\d{3}):\s*(.*)$/s)
  if (!match) return { message: raw }

  const code = Number(match[1])
  const body = match[2].trim()
  try {
    const parsed = JSON.parse(body) as { error?: string; message?: string }
    return { code, message: parsed.error ?? parsed.message ?? body }
  } catch {
    return { code, message: body }
  }
}

/** Map of known error codes to friendly descriptions. */
const FRIENDLY_ERRORS: Record<number, { title: string; description: string }> = {
  400: { title: 'Bad request', description: 'The request was invalid. Please check your input and try again.' },
  401: { title: 'Not authenticated', description: 'You need to sign in to access this.' },
  403: { title: 'Access denied', description: "You don't have permission to access this." },
  404: { title: 'Not found', description: "The resource you're looking for doesn't exist." },
  410: { title: 'No longer available', description: 'This room has been closed.' },
  429: { title: 'Too many requests', description: 'Please wait a moment and try again.' },
  500: { title: 'Server error', description: 'Something went wrong on our end. Please try again later.' },
}

/** Room-specific overrides for error codes. */
const ROOM_FRIENDLY_ERRORS: Record<number, { title: string; description: string }> = {
  404: { title: 'Room not found', description: "This room doesn't exist or has been deleted." },
  410: { title: 'Room closed', description: 'This room is no longer active.' },
  403: { title: 'Room access denied', description: "You don't have permission to join this room." },
}

type ErrorVariant = 'not-found' | 'room-error' | 'kicked' | 'session' | 'server'

interface ErrorPageProps {
  variant?: ErrorVariant
  title?: string
  description?: string
  error?: string
  showHome?: boolean
  showBack?: boolean
  className?: string
}

const VARIANT_CONFIG: Record<
  ErrorVariant,
  { icon: typeof AlertTriangle; defaultTitle: string; defaultDescription: string }
> = {
  'not-found': {
    icon: Radio,
    defaultTitle: 'Nothing here',
    defaultDescription: "The page you're looking for doesn't exist or has been moved.",
  },
  'room-error': {
    icon: WifiOff,
    defaultTitle: 'Failed to join room',
    defaultDescription: 'The room may not exist or has been closed.',
  },
  kicked: {
    icon: Server,
    defaultTitle: 'You were removed',
    defaultDescription: 'A moderator removed you from this room.',
  },
  session: {
    icon: AlertTriangle,
    defaultTitle: 'Session expired',
    defaultDescription: 'Your session has ended. Please sign in again.',
  },
  server: {
    icon: AlertTriangle,
    defaultTitle: 'Something went wrong',
    defaultDescription: 'An unexpected error occurred. Please try again.',
  },
}

export function ErrorPage({
  variant = 'not-found',
  title,
  description,
  error,
  showHome = true,
  showBack = true,
  className,
}: ErrorPageProps) {
  const config = VARIANT_CONFIG[variant]
  const Icon = config.icon

  // Parse raw API error into a human-readable message
  const parsed = error ? parseApiError(error) : null
  const lookup = variant === 'room-error' ? ROOM_FRIENDLY_ERRORS : FRIENDLY_ERRORS
  const friendly = parsed?.code ? lookup[parsed.code] : undefined
  const displayTitle = title ?? friendly?.title ?? config.defaultTitle
  const displayDescription = description ?? friendly?.description ?? config.defaultDescription

  return (
    <div className={cn('flex min-h-screen flex-col bg-background', className)}>
      {/* Header */}
      <header className="flex items-center gap-2 border-b px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center bg-primary">
            <Radio className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="font-mono text-xs font-semibold tracking-tight">bedrud</span>
        </Link>
      </header>

      {/* Body */}
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20">
        {/* Icon in a bordered square */}
        <div className="flex h-16 w-16 items-center justify-center border text-muted-foreground">
          <Icon className="h-7 w-7" strokeWidth={1.5} />
        </div>

        {/* Error code badge */}
        {(variant === 'not-found' || parsed?.code) && (
          <span className="border bg-background px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {parsed?.code ?? 404}
          </span>
        )}

        {/* Text */}
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold">{displayTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{displayDescription}</p>
        </div>

        {/* Parsed error detail */}
        {parsed?.message && !friendly && (
          <div className="max-w-md border bg-background px-4 py-3">
            <p className="break-words text-xs text-muted-foreground/80">{parsed.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          {showBack && (
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex h-9 items-center gap-2 border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Go back
            </button>
          )}
          {showHome && (
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-2 bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
