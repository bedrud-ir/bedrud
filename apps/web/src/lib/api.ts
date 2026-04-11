import { useAuthStore } from './auth.store'

// In dev, leave BASE_URL empty so requests go to /api/... and Vite's proxy
// forwards them to localhost:8090 — no CORS. In production, set VITE_API_URL
// to the absolute server origin (e.g. https://api.bedrud.com).
const BASE_URL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? ''

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

// Singleton refresh promise — multiple concurrent 401s share one refresh call
// instead of hammering the /refresh endpoint in parallel.
let refreshPromise: Promise<string | null> | null = null

async function doRefresh(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().tokens?.refreshToken
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // send the refresh_token HTTP-only cookie too
      body: JSON.stringify({ refresh_token: refreshToken ?? '' }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { access_token: string; refresh_token: string }
    useAuthStore.getState().setTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    })
    return data.access_token
  } catch {
    return null
  }
}

function redirectToAuth() {
  useAuthStore.getState().clear()
  if (typeof window !== 'undefined') {
    window.location.replace('/auth')
  }
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const tokens = useAuthStore.getState().tokens
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // always send HTTP-only cookies
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  // On 401, try to silently refresh once, then retry the original request.
  // Skip the interceptor on the refresh endpoint itself to avoid infinite loops,
  // and skip on retries (already refreshed once).
  if (res.status === 401 && !isRetry && path !== '/api/auth/refresh') {
    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => {
        refreshPromise = null
      })
    }

    const newToken = await refreshPromise

    if (!newToken) {
      // Refresh failed — session is truly expired
      redirectToAuth()
      throw new Error('Session expired')
    }

    // Retry with the new access token
    return request<T>(path, options, true)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),

  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
}

export const API_URL = BASE_URL
