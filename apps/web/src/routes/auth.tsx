import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuthStore } from '#/lib/auth.store'

export const Route = createFileRoute('/auth')({
  beforeLoad: () => {
    if (useAuthStore.getState().tokens) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Bedrud</h1>
        <p className="mt-1 text-sm text-muted-foreground">Voice-first meetings</p>
      </div>
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  )
}
