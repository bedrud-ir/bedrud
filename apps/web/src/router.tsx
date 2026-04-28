import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { ErrorPage } from '@/components/ErrorPage'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: () => <ErrorPage variant="not-found" />,
    defaultErrorComponent: ({ error }: { error: unknown }) => {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.startsWith('404')) {
        return <ErrorPage variant="not-found" />
      }
      return <ErrorPage variant="server" error={msg} />
    },
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
