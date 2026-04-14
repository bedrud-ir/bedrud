import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import { useEffect } from 'react'
import { applyTheme, useThemeStore } from '#/lib/theme.store'
import appCss from '../styles.css?url'

// Inline script that runs before first paint to avoid theme flash.
// Reads the persisted Zustand value from localStorage directly.
const themeScript = `
(function(){
  try {
    var stored = JSON.parse(localStorage.getItem('theme') || '{}');
    var theme = stored.state?.theme || 'system';
    var dark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Bedrud' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
    scripts: [{ children: themeScript }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)

  // Re-sync whenever the stored theme changes (e.g. on another tab).
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Also re-sync when the OS preference changes while theme is 'system'.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme(useThemeStore.getState().theme)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
