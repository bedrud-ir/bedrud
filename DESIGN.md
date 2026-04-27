# Bedrud Design System

## Palette — Cobalt + Gold (Accessible)

Accessibility-first. Every status color pairs with an icon, label, or pattern — never color alone.

### Brand Tokens

| Token | Hex | OKLCH | Use |
|-------|-----|-------|-----|
| `--primary-50` | `#F2F4FB` | 0.97 0.018 250 | App bg, hover wash |
| `--primary-100` | `#DDE3F4` | 0.93 0.040 250 | Subtle fills, chips |
| `--primary-300` | `#8FA1D8` | 0.78 0.10 250 | Borders, dividers |
| `--primary-500` | `#3B5BD9` | 0.55 0.18 255 | Links, focus, info |
| `--primary-600` | `#2A47C8` | 0.45 0.16 255 | Primary CTA (7.2:1 on white) |
| `--primary-700` | `#1F37A8` | 0.36 0.15 258 | CTA hover, headings |
| `--primary-900` | `#13256E` | 0.22 0.10 260 | Deep ink on light |

### Accent Tokens (Gold)

| Token | Hex | OKLCH | Use |
|-------|-----|-------|-----|
| `--accent-100` | `#FBEFD2` | 0.95 0.07 75 | Highlight wash |
| `--accent-300` | `#F2C66B` | 0.86 0.14 75 | Badges, raised hand bg |
| `--accent-500` | `#F59E0B` | 0.78 0.17 75 | Accent (always paired with ink text) |
| `--accent-700` | `#A66A1D` | 0.55 0.15 65 | Accent text on light |

### Status Tokens

| Token | Hex | Use | Required pairing |
|-------|-----|-----|-----------------|
| `--success-500` | `#22A06B` | Connected, speaking | Check icon or audio-bar |
| `--destructive-500` | `#DC2626` | Leave call, delete (irreversible only) | Warning icon + label |

### Foreground & Chrome

| Token | Hex | Contrast | Use |
|-------|-----|----------|-----|
| `--fg-1` | `#1A1F2E` | 14.5:1 on white | Body text |
| `--fg-2` | `#6B7488` | 4.7:1 on white | Muted/secondary text |
| `--fg-3` | `#9AA0AE` | — | Disabled, placeholders |
| `--bg` | `#FFFFFF` | — | Page background |
| `--bg-alt` | `#F7F8FB` | — | Cards, alt sections |
| `--line` | `#E6E8EE` | — | Borders, dividers |

### Dark Mode Overrides

| Token | Dark value |
|-------|-----------|
| `--bg` | `#0E1220` |
| `--bg-alt` | `#161B2E` |
| `--fg-1` | `#EEF1F8` |
| `--fg-2` | `#A6ADC0` |
| `--line` | `#2A3047` |
| `--primary-500` | `#7A8FE8` (lifted for AA on dark) |
| `--primary-600` | `#5C76DD` |

## Semantic Mapping

| UI element | Token | Style |
|-----------|-------|-------|
| CTA / primary button | `--primary-600` | bg: primary-600, text: white, hover: primary-700 |
| Link / inline action | `--primary-500` | text: primary-500, underline on hover |
| "You" tile in call | `--primary-500` | 3px ring + "YOU" label badge |
| Active speaker | `--success-500` | 3px ring + audio-bar icon |
| Raised hand | `--accent-500` | Circle with hand icon, ink border |
| End / leave call | `--destructive-500` | bg: destructive, white icon |
| Connected / OK | `--success-500` | Dot + check icon + label |
| Warning | `--accent-500` | Warning icon + label |
| Info | `--primary-500` | Info icon |

## Accessibility Rules (Non-Negotiable)

1. **Color is never the only signal.** Every status must also have an icon, label, ring, or pattern.
2. **Body text** on `--bg` uses `--fg-1` (14.5:1). Muted text uses `--fg-2` (4.7:1).
3. **Primary CTA** is `--primary-600` (7.2:1 on white). Hover goes to `--primary-700`.
4. **Destructive** (`--destructive-500`) is reserved for: leave call, delete, irreversible actions. Never for emphasis.
5. **Accent gold** (`--accent-500`) ALWAYS pairs with ink text (`--fg-1`) — never white.
6. **Focus ring**: 3px `--primary-500` at 45% opacity on all interactive elements.

### Verification Checklist

- [ ] All text/bg combos pass WCAG AA
- [ ] Disable color in DevTools (grayscale) — every UI state still readable
- [ ] Test under protanopia + deuteranopia (Chrome DevTools → Rendering → Emulate vision)
- [ ] No raw hex literals outside `theme.css`

## Token Architecture

The palette is defined in `src/theme.css` — a single file self-hosters can edit or swap.

### Tailwind Compat Names

Legacy token names are preserved for backwards compatibility:

| Token prefix | Actual color | Purpose |
|-------------|-------------|---------|
| `--sky-*` (50–900) | Primary cobalt scale | Brand colors |
| `--cyan-*` (50–900) | Blue-violet secondary | Secondary ramp |
| `--fuchsia-*` (50–900) | Amber/gold accent | Highlight colors |

These map to Tailwind utilities: `bg-sky-500`, `text-fuchsia-500`, etc.

### Semantic Tokens → Tailwind Classes

| CSS variable | Tailwind class | Usage |
|-------------|---------------|-------|
| `--primary` | `bg-primary`, `text-primary` | Buttons, links, active states |
| `--foreground` | `text-foreground` | Body text |
| `--background` | `bg-background` | Page bg |
| `--muted-foreground` | `text-muted-foreground` | Secondary text |
| `--destructive` | `bg-destructive`, `text-destructive` | Error/delete states |
| `--border` | `border-border` | Borders |
| `--ring` | `ring-ring` | Focus rings |

## Typography

- **Font stack**: `font-sans` (system default via Tailwind)
- **Monospace**: `font-mono` — room codes, step numbers, technical labels
- **Heading weights**: `font-semibold` (600)
- **Body weights**: `font-medium` (500), `font-normal` (400)
- **Label style**: `text-xs tracking-widest uppercase` — section headers, nav categories

## Spacing & Layout

- **Radius**: `--radius: 0.5rem` (8px). Components use `radius-sm/md/lg/xl` variants.
- **Page padding**: `px-4 sm:px-8 md:px-16 lg:px-24`
- **Section spacing**: `space-y-20` between page sections
- **Component spacing**: `space-y-4` for list items, `gap-2` for inline groups
- **Sidebar width**: `w-52` (208px) — dashboard layout
- **Content max-width**: `max-w-xl` (pages), `max-w-md` (forms), `max-w-[360px]` (auth forms)

## Component Patterns

### Buttons
- Primary: `bg-primary text-primary-foreground hover:opacity-90`
- Secondary: `variant="outline"` — border + transparent bg
- Destructive: `text-destructive hover:bg-destructive/10`

### Navigation
- Sidebar: fixed left, `bg-card` with `border-r`
- Mobile: `Sheet` slide-out from left
- Active state: `bg-primary/10 text-primary`
- Inactive: `text-muted-foreground hover:bg-accent`

### Focus
- All interactive elements: `focus-visible:ring-2 focus-visible:ring-ring`
- Ring: 3px `--primary-500` at 45% opacity

## Dark Mode

- Class-based: `.dark` on `<html>`
- Anti-flash script inlined in `<head>` (reads localStorage)
- All tokens have `:root` (light) and `.dark` overrides
- Meeting room UI is always dark regardless of theme
- Auth left panel is always dark

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|-----------|-------|-------|
| Default | 0–639px | Mobile: compact padding, hidden sidebar |
| `sm` | 640px+ | Tablet: larger text, show hostname prefix |
| `md` | 768px+ | Desktop: full headline size |
| `lg` | 1024px+ | Wide: show sidebar, auth brand panel |

## Self-Hosting Customization

Edit `src/theme.css` to rebrand. One file controls all colors. See `theme.example-blue.css` for an example of a complete brand swap.

## What NOT to Do

- Do NOT rename `--sky-*`, `--cyan-*`, `--fuchsia-*` token names. Only values change.
- Do NOT use color alone for status signals — always pair with icons or labels.
- Do NOT use `--destructive-500` for emphasis — it's reserved for irreversible actions.
- Do NOT put white text on `--accent-500` — always use ink text (`--fg-1`).
- Do NOT add hardcoded hex colors outside `theme.css`.
- Do NOT change the meeting room always-dark theme.
