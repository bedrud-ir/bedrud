function parseErrorPayload(payload: string): string | null {
  const trimmed = payload.trim()
  if (!trimmed) return null

  try {
    const parsed = JSON.parse(trimmed) as unknown

    if (typeof parsed === 'string') {
      return parsed
    }

    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>
      const message = record.message ?? record.error ?? record.detail

      if (typeof message === 'string' && message.trim()) {
        return message.trim()
      }
    }
  } catch {
    return trimmed
  }

  return trimmed
}

export function getErrorMessage(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : ''

  const normalized = raw.replace(/^\d{3}:\s*/s, '').trim()

  return parseErrorPayload(normalized) ?? fallback
}
