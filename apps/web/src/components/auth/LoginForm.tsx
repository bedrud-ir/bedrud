import { useState } from 'react'
import { z } from 'zod/v4'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormErrors = Partial<Record<keyof z.infer<typeof schema>, string>>

interface Props {
  onLogin: (data: { email: string; password: string }) => Promise<void>
  isLoading: boolean
}

export function LoginForm({ onLogin, isLoading }: Props) {
  const [errors, setErrors] = useState<FormErrors>({})

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const raw = { email: fd.get('email') as string, password: fd.get('password') as string }
    const result = schema.safeParse(raw)
    if (!result.success) {
      const errs: FormErrors = {}
      result.error.issues.forEach((issue) => {
        errs[issue.path[0] as keyof FormErrors] = issue.message
      })
      setErrors(errs)
      return
    }
    setErrors({})
    await onLogin(result.data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" name="email" type="email" placeholder="you@example.com" />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="login-password">Password</Label>
            <Input id="login-password" name="password" type="password" />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
