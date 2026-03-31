import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '#/lib/auth.store'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const tokens = useAuthStore.getState().tokens
    if (!tokens) {
      throw redirect({ to: '/auth' })
    }
    throw redirect({ to: '/dashboard' })
  },
  component: () => null,
})
