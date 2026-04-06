import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useUserStore } from '#/lib/user.store'

export const Route = createFileRoute('/dashboard/admin')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    const user = useUserStore.getState().user
    if (user !== null && !user.isAdmin) throw redirect({ to: '/dashboard' })
  },
  component: AdminGuard,
})

function AdminGuard() {
  const user = useUserStore((s) => s.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (user !== null && !user.isAdmin) {
      navigate({ to: '/dashboard' })
    }
  }, [user, navigate])

  return <Outlet />
}
