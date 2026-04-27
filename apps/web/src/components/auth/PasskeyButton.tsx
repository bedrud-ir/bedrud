import { Fingerprint } from 'lucide-react'
import { useState } from 'react'
import { api } from '#/lib/api'
import {
  base64ToBuffer,
  bufferToBase64,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '#/lib/webauthn'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AuthResponse {
  user: { id: string; email: string; name: string; provider: string; accesses: string[] | null; avatarUrl?: string }
  tokens: { accessToken: string; refreshToken: string }
}

interface Props {
  onSuccess: (res: AuthResponse) => void
}

export function PasskeyButton({ onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    setIsLoading(true)
    setError(null)
    try {
      const opts = await api.post<PublicKeyCredentialRequestOptionsJSON>('/api/auth/passkey/login/begin')
      const cred = (await navigator.credentials.get({
        publicKey: {
          challenge: base64ToBuffer(opts.challenge as unknown as string),
          timeout: (opts as unknown as { timeout?: number }).timeout,
          rpId: (opts as unknown as { rpId?: string }).rpId,
          userVerification: (opts as unknown as { userVerification?: UserVerificationRequirement }).userVerification,
          allowCredentials: (opts.allowCredentials as unknown as Array<{ id: string; type: 'public-key' }>)?.map(
            (c) => ({
              id: base64ToBuffer(c.id),
              type: c.type,
            }),
          ),
        },
      })) as PublicKeyCredential

      const assertion = cred.response as AuthenticatorAssertionResponse
      const res = await api.post<AuthResponse>('/api/auth/passkey/login/finish', {
        credentialId: bufferToBase64(cred.rawId),
        clientDataJSON: bufferToBase64(assertion.clientDataJSON),
        authenticatorData: bufferToBase64(assertion.authenticatorData),
        signature: bufferToBase64(assertion.signature),
      })
      onSuccess(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Passkey login failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSignup(name: string, email: string) {
    setIsLoading(true)
    setError(null)
    try {
      const opts = await api.post<PublicKeyCredentialCreationOptionsJSON>('/api/auth/passkey/signup/begin', {
        name,
        email,
      })
      const optsRaw = opts as unknown as {
        rp: PublicKeyCredentialRpEntity
        user: { id: string; name: string; displayName: string }
        challenge: string
        pubKeyCredParams: PublicKeyCredentialParameters[]
        timeout?: number
        attestation?: AttestationConveyancePreference
        authenticatorSelection?: AuthenticatorSelectionCriteria
      }
      const cred = (await navigator.credentials.create({
        publicKey: {
          rp: optsRaw.rp,
          user: { id: base64ToBuffer(optsRaw.user.id), name: optsRaw.user.name, displayName: optsRaw.user.displayName },
          challenge: base64ToBuffer(optsRaw.challenge),
          pubKeyCredParams: optsRaw.pubKeyCredParams,
          timeout: optsRaw.timeout,
          attestation: optsRaw.attestation,
          authenticatorSelection: optsRaw.authenticatorSelection,
        },
      })) as PublicKeyCredential

      const att = cred.response as AuthenticatorAttestationResponse
      const res = await api.post<AuthResponse>('/api/auth/passkey/signup/finish', {
        clientDataJSON: bufferToBase64(att.clientDataJSON),
        attestationObject: bufferToBase64(att.attestationObject),
      })
      onSuccess(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Passkey signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Passkey
        </CardTitle>
        <CardDescription>Sign in or sign up using a biometric authenticator</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{error}</div>}
        <Tabs defaultValue="login">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              Login
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Sign up
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="pt-4">
            <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
              <Fingerprint className="mr-2 h-4 w-4" />
              {isLoading ? 'Authenticating…' : 'Sign in with Passkey'}
            </Button>
          </TabsContent>
          <TabsContent value="signup" className="pt-4">
            <PasskeySignupForm onSignup={handleSignup} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function PasskeySignupForm({
  onSignup,
  isLoading,
}: {
  onSignup: (name: string, email: string) => Promise<void>
  isLoading: boolean
}) {
  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    await onSignup(fd.get('name') as string, fd.get('email') as string)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="pk-name">Name</Label>
        <Input id="pk-name" name="name" placeholder="Your name" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="pk-email">Email</Label>
        <Input id="pk-email" name="email" type="email" placeholder="you@example.com" required />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        <Fingerprint className="mr-2 h-4 w-4" />
        {isLoading ? 'Setting up…' : 'Sign up with Passkey'}
      </Button>
    </form>
  )
}
