import { useState } from 'react'
import { z } from 'zod/v4'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type FormErrors = Partial<Record<string, string>>

interface Props {
  onRegister: (data: { name: string; email: string; password: string }) => Promise<void>
  isLoading: boolean
}

export function RegisterForm({ onRegister, isLoading }: Props) {
  const [errors, setErrors] = useState<FormErrors>({})

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const raw = {
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      password: fd.get('password') as string,
      confirmPassword: fd.get('confirmPassword') as string,
    }
    const result = schema.safeParse(raw)
    if (!result.success) {
      const errs: FormErrors = {}
      result.error.issues.forEach((issue) => { errs[issue.path[0] as string] = issue.message })
      setErrors(errs)
      return
    }
    setErrors({})
    await onRegister({ name: result.data.name, email: result.data.email, password: result.data.password })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Join Bedrud to start meeting</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <Label htmlFor="reg-name">Name</Label>
            <Input id="reg-name" name="name" placeholder="Your name" />
            {errors['name'] && <p className="text-xs text-destructive">{errors['name']}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="reg-email">Email</Label>
            <Input id="reg-email" name="email" type="email" placeholder="you@example.com" />
            {errors['email'] && <p className="text-xs text-destructive">{errors['email']}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="reg-password">Password</Label>
            <Input id="reg-password" name="password" type="password" />
            {errors['password'] && <p className="text-xs text-destructive">{errors['password']}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="reg-confirm">Confirm Password</Label>
            <Input id="reg-confirm" name="confirmPassword" type="password" />
            {errors['confirmPassword'] && <p className="text-xs text-destructive">{errors['confirmPassword']}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
