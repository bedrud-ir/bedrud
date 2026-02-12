# Web Frontend

The Bedrud web frontend is a SvelteKit single-page application built with Svelte 5 and TailwindCSS. In production, it compiles to static files embedded in the Go server binary.

## Technology Stack

| Technology | Purpose |
|-----------|---------|
| SvelteKit 2.50 | Framework and routing |
| Svelte 5.46 | UI components (Runes for state management) |
| TailwindCSS 3.4 | Utility-first styling |
| Vite 7 | Build tool and dev server |
| LiveKit Client SDK 2.9 | WebRTC media handling |
| Zod | Schema validation |
| Lucide Svelte | Icon library |
| Bun | Package manager |

## Directory Structure

```
apps/web/
├── src/
│   ├── routes/                    # File-based routing
│   │   ├── +page.svelte           # Home / landing page
│   │   ├── +layout.svelte         # Root layout
│   │   ├── auth/
│   │   │   ├── login/             # Login page
│   │   │   └── register/          # Registration page
│   │   ├── m/[meetId]/            # Meeting room page
│   │   ├── c/[roomCode]/          # Alternative room join (by code)
│   │   ├── admin/                 # Admin dashboard
│   │   ├── about/                 # About page
│   │   ├── contact/               # Contact page
│   │   ├── privacy/               # Privacy policy
│   │   ├── terms/                 # Terms of service
│   │   ├── design-system/         # Component showcase
│   │   └── test/                  # Test pages
│   └── lib/
│       ├── api/                   # API client functions per endpoint
│       ├── api.ts                 # authFetch wrapper
│       ├── auth.ts                # Auth logic (login, register, passkeys)
│       ├── livekit.ts             # LiveKit connection helpers
│       ├── storage.ts             # LocalStorage utilities
│       ├── components/
│       │   ├── layout/            # Header, footer, navigation
│       │   ├── meeting/           # Video tiles, controls, chat
│       │   └── ui/                # Design system (buttons, inputs, cards)
│       ├── hooks/                 # Custom Svelte hooks
│       ├── models/                # TypeScript interfaces
│       ├── stores/                # Svelte stores (reactive state)
│       │   ├── user.store.ts      # Current user profile
│       │   └── auth.store.ts      # JWT token management
│       ├── types/                 # Shared type definitions
│       └── utils/                 # Utility functions
├── static/                        # Static assets
├── package.json
├── svelte.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Authentication Flow

The frontend manages JWT tokens using Svelte stores:

1. **Login** — User submits credentials to `POST /api/auth/login`
2. **Token Storage** — Access and refresh tokens saved to `localStorage`
3. **Automatic Injection** — `authFetch` wraps every API call, adding the `Authorization: Bearer` header
4. **Auto-Refresh** — When a request returns 401, `authFetch` attempts to refresh the token using the refresh token
5. **Logout** — Clears tokens and redirects to the login page

### authFetch

The `authFetch` function in `src/lib/api.ts` is a drop-in replacement for `fetch` that:

- Attaches the JWT access token to every request
- Catches 401 responses and attempts a token refresh
- Logs out the user if the refresh fails

All API client functions in `src/lib/api/` use `authFetch` instead of native `fetch`.

## Meeting Page

The meeting room at `/m/[meetId]` is the most complex page. It handles:

- **LiveKit connection** — Connects to the media server with the token from the join API
- **Track rendering** — Subscribes to audio/video tracks from other participants
- **Admin controls** — Room creator sees kick, mute, and video-off buttons
- **Admin crown** — Visual indicator next to the room creator's name
- **Chat** — In-room text chat (if enabled in room settings)
- **Screen sharing** — Publish screen as a track

## Design System

A custom design system in `src/routes/design-system/` provides a visual showcase of all UI components. The project uses:

- **Tailwind Variants** — for component variant management
- **Tailwind Merge** — for deduplicating class names
- **clsx** — for conditional class composition

## Build

### Development

```bash
cd apps/web
bun run dev      # Starts Vite dev server with HMR at localhost:5173
```

### Production

```bash
cd apps/web
bun run build    # Outputs static files to build/
```

The static adapter (`@sveltejs/adapter-static`) compiles the app to plain HTML/CSS/JS files. The Makefile copies these to `server/frontend/` for embedding.

### Type Checking

```bash
bun run check    # Runs svelte-check with TypeScript
```
