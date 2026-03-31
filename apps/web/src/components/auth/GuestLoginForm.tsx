import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  onGuestLogin: (name: string) => Promise<void>
  isLoading: boolean
}

export function GuestLoginForm({ onGuestLogin, isLoading }: Props) {
  const [error, setError] = useState('')

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    const name = (fd.get('name') as string).trim()
    if (name.length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    setError('')
    await onGuestLogin(name)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join as Guest</CardTitle>
        <CardDescription>No account required — just enter your name</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="guest-name">Display Name</Label>
            <Input id="guest-name" name="name" placeholder="Your name" />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Joining…' : 'Continue as Guest'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
