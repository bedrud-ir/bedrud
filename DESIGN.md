# Bedrud Design System

## Aesthetic — Rose + Teal (Retro, Sharp)

Sharp corners. Bold colors. No purple. Zero border-radius everywhere.

- **Primary** — rose: brand CTAs, links, focus rings
- **Accent** — teal: highlights, badges, secondary actions

Accessibility-first. Every status color pairs with an icon, label, or pattern — never color alone.

## Brand Tokens (Rose)

| Token | Hex | Use |
|-------|-----|-----|
| `--primary-50` | `#FFF1F2` | Light wash, hover bg |
| `--primary-100` | `#FFE4E6` | Subtle fills, chips |
| `--primary-200` | `#FECDD3` | Borders, dividers |
| `--primary-300` | `#FDA4AF` | Muted accents |
| `--primary-400` | `#FB7185` | Links (dark mode) |
| `--primary-500` | `#F43F5E` | Focus rings, info |
| `--primary-600` | `#E11D48` | Primary CTA (6.1:1 on white) |
| `--primary-700` | `#BE123C` | CTA hover, headings |
| `--primary-800` | `#9F1239` | Deep rose |
| `--primary-900` | `#881337` | Darkest rose |

## Accent Tokens (Teal)

| Token | Hex | Use |
|-------|-----|-----|
| `--accent-50` | `#F0FDFA` | Highlight wash |
| `--accent-100` | `#CCFBF1` | Chip bg, selection |
| `--accent-200` | `#99F6E4` | Badges |
| `--accent-300` | `#5EEAD4` | Raised hand bg |
| `--accent-400` | `#2DD4BF` | Accent borders |
| `--accent-500` | `#14B8A6` | Accent (always paired with ink text) |
| `--accent-600` | `#0D9488` | Accent text on light |
| `--accent-700` | `#0F766E` | Accent hover |
| `--accent-800` | `#115E59` | Deep teal |
| `--accent-900` | `#134E4A` | Darkest teal |

## Status Tokens

| Token | Hex | Use | Required pairing |
|-------|-----|-----|-----------------|
| `--success-500` | `#16A34A` | Connected, speaking | Check icon or audio-bar |
| `--destructive-500` | `#DC2626` | Leave call, delete (irreversible only) | Warning icon + label |

## Foreground & Chrome

| Token | Hex | Use |
|-------|-----|-----|
| `--fg-1` | `#1C1917` | Body text (14.5:1 on white) |
| `--fg-2` | `#57534E` | Muted/secondary text |
| `--fg-3` | `#A8A29E` | Disabled, placeholders |
| `--bg` | `#FFFBF9` | Page background (warm white) |
| `--bg-alt` | `#FFF1F2` | Cards, alt sections |
| `--line` | `#E7E5E4` | Borders, dividers |

## Dark Mode Overrides

| Token | Dark value |
|-------|-----------|
| `--bg` | `#0C0A09` |
| `--bg-alt` | `#1C1917` |
| `--fg-1` | `#FAFAF9` |
| `--fg-2` | `#A8A29E` |
| `--line` | `#292524` |
| `--primary-500` | `#FB7185` (lifted for AA on dark) |
| `--primary-600` | `#F43F5E` |

## Semantic Mapping

| UI element | Token | Style |
|-----------|-------|-------|
| CTA / primary button | `--primary` (`--primary-600`) | bg: primary, text: white, hover: primary-hover |
| Link / inline action | `--primary-500` | text: primary-500, underline on hover |
| "You" tile in call | `--primary-500` | 3px ring + "YOU" label badge |
| Active speaker | `--success-500` | 3px ring + audio-bar icon |
| Raised hand | `--accent-500` | Circle with hand icon, ink border |
| End / leave call | `--destructive` | bg: destructive, white icon |
| Connected / OK | `--success-500` | Dot + check icon + label |
| Warning | `--accent-500` | Warning icon + label |
| Info | `--primary-500` | Info icon |

## Accessibility Rules (Non-Negotiable)

1. **Color is never the only signal.** Every status must also have an icon, label, ring, or pattern.
2. **Body text** on `--bg` uses `--fg-1` (14.5:1). Muted text uses `--fg-2` (4.7:1).
3. **Primary CTA** is `--primary-600` (6.1:1 on white). Hover goes to `--primary-700`.
4. **Destructive** (`--destructive-500`) is reserved for: leave call, delete, irreversible actions. Never for emphasis.
5. **Accent teal** (`--accent-500`) ALWAYS pairs with ink text (`--fg-1`) — never white.
6. **Focus ring**: 3px `--primary-500` at 45% opacity on all interactive elements.

### Verification Checklist

- [ ] All text/bg combos pass WCAG AA
- [ ] Disable color in DevTools (grayscale) — every UI state still readable
- [ ] Test under protanopia + deuteranopia (Chrome DevTools → Rendering → Emulate vision)
- [ ] No raw hex literals outside `theme.css`

## Border Radius

**0px.** All components use sharp, square corners. This is enforced globally in `styles.css`:

```css
* { border-radius: 0 !important; }
```

Individual `rounded-*` Tailwind classes are stripped from all components. `rounded-full` is kept only for avatars and circular elements (which the global override doesn't affect due to `border-radius: 50%` being a different property level).

The `--radius` token is `0px`. All Tailwind radius scales (`--radius-sm/md/lg/xl`) are `0px`.

## Token Architecture

The palette is defined in `src/theme.css` — a single file self-hosters can edit or swap.

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

### Color Scale Utilities

The full rose and teal scales are available as Tailwind utilities:

| Prefix | Source |
|--------|--------|
| `bg-primary-{50-900}` | Rose scale via `--primary-*` |
| `bg-teal-{50-900}` | Teal scale via `--accent-*` |

## Typography

- **Font stack**: `font-sans` (system default via Tailwind)
- **Monospace**: `font-mono` — room codes, step numbers, technical labels
- **Heading weights**: `font-bold` (700), `font-semibold` (600)
- **Body weights**: `font-medium` (500), `font-normal` (400)
- **Label style**: `text-[10px] tracking-widest uppercase font-semibold` — section headers, nav categories

## Spacing & Layout

- **Radius**: `0px` — all corners sharp
- **Page padding**: `px-4 sm:px-8 md:px-16 lg:px-24`
- **Section spacing**: `space-y-20` between page sections
- **Component spacing**: `space-y-4` for list items, `gap-2` for inline groups
- **Sidebar width**: `w-52` (208px) — dashboard layout
- **Content max-width**: `max-w-xl` (pages), `max-w-md` (forms), `max-w-[360px]` (auth forms)

## Component Patterns

### Buttons
- Primary: `bg-primary text-primary-foreground hover:bg-primary-hover`
- Secondary: `variant="outline"` — border + transparent bg
- Destructive: `text-destructive hover:bg-destructive/10`

### Navigation
- Sidebar: fixed left, `bg-card` with `border-r`
- Mobile: `Sheet` slide-out from left
- Active state: `bg-primary/10 text-primary`
- Inactive: `text-muted-foreground hover:bg-accent`

### Cards
- Border-only, no shadow on rest state
- Hover: subtle lift (`hover:-translate-y-0.5`) with faint shadow

### Focus
- All interactive elements: `focus-visible:ring-2 focus-visible:ring-ring`
- Ring: 3px `--primary-500` at 45% opacity

### Inputs
- Bare: `border` only, no background fill
- Focus: `ring-2 ring-ring`
- No border-radius

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

- Do NOT add `rounded-*` classes — the design is sharp-cornered. The global `border-radius: 0 !important` enforces this.
- Do NOT use color alone for status signals — always pair with icons or labels.
- Do NOT use `--destructive-500` for emphasis — it's reserved for irreversible actions.
- Do NOT put white text on `--accent-500` — always use ink text (`--fg-1`).
- Do NOT add hardcoded hex colors outside `theme.css`.
- Do NOT change the meeting room always-dark theme.
