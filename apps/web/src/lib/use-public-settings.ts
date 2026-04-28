import { api } from '#/lib/api'

export interface PublicSettings {
  registrationEnabled: boolean
  tokenRegistrationOnly: boolean
  passkeysEnabled: boolean
  oauthProviders: string[]
}

let cached: PublicSettings | null = null
let promise: Promise<PublicSettings> | null = null

export function getPublicSettings(): Promise<PublicSettings> {
  if (cached) return Promise.resolve(cached)
  if (promise) return promise
  promise = api.get<PublicSettings>('/api/auth/settings').then((s: PublicSettings) => {
    cached = s
    return s
  })
  return promise
}

export function usePublicSettings() {
  return { get: getPublicSettings }
}
