# Bedrud Web — UI & Design System

This document is the source of truth for all frontend design decisions.
Every agent or engineer touching the web app must follow these guidelines.

---

## Brand Palette

The app uses a purple-indigo-cyan gradient identity. These are the canonical brand stops:

| Token | Hex | Use |
|---|---|---|
| `brand-indigo` | `#6366f1` | Primary accent, CTAs, focus rings |
| `brand-violet` | `#8b5cf6` | Gradient midpoint, hover states |
| `brand-purple` | `#a855f7` | Decorative, secondary gradient stop |
| `brand-cyan` | `#06b6d4` | Gradient endpoint, highlights |
| `brand-pink` | `#ec4899` | Decorative blobs, stat accents |

The canonical gradient (used on primary buttons, headings, icons):
```css
linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)
```

Glow shadow for branded elements:
```css
box-shadow: 0 4px 20px #6366f140;
```

---

## Dark Mode

- Class-based: `.dark` on `<html>` activates dark tokens
- All colors MUST use shadcn's CSS variable system (`hsl(var(--background))` etc.)
- Brand gradient blobs use reduced opacity in dark mode (`dark:opacity-15` vs `opacity-25`)
- Never hardcode light or dark hex colors for structural UI — only for brand accents and decorative elements

---

## Layout Patterns

### Pages with a background
Most full-page routes use the **aurora mesh** background:
- 3–4 `position: absolute` blurred radial gradient orbs (indigo, violet, cyan, pink)
- Each orb drifts with `animation: aurora-drift` — staggered delays, alternating direction
- A subtle `80px × 80px` grid overlay at `opacity: 0.015` (light) / `opacity: 0.03` (dark)
- All orbs are `pointer-events-none` and `aria-hidden`

```tsx
// Canonical aurora orb style
<div
  className="pointer-events-none absolute rounded-full blur-[120px] opacity-30 dark:opacity-20"
  style={{
    background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
    animation: 'aurora-drift 14s ease-in-out infinite alternate',
  }}
/>
```

```css
@keyframes aurora-drift {
  0%   { transform: translate(0px, 0px) scale(1); }
  33%  { transform: translate(60px, -40px) scale(1.1); }
  66%  { transform: translate(-30px, 60px) scale(0.95); }
  100% { transform: translate(40px, 20px) scale(1.05); }
}
```

### App shell (dashboard, admin)
- **Sidebar** (desktop `lg+`): fixed left, `w-60`, dark background using `hsl(var(--card))`, branded logo at top
- **Top bar** (all breakpoints): `h-14`, sticky, `bg-background/90 backdrop-blur`, brand logo left, user avatar dropdown right
- **Content area**: `flex-1`, `p-6 lg:p-8`, max-width constraint per section

---

## Typography

- Headings: `font-bold` or `font-extrabold`, `tracking-tight`
- Gradient headings: use `bg-clip-text text-transparent` with brand gradient
- Body: `text-muted-foreground`, `leading-relaxed`
- Monospace labels (room names, codes, status): `font-mono text-sm`
- Stat values: `text-2xl font-bold`, colored with brand accent

```tsx
// Gradient text pattern
<span
  className="bg-clip-text text-transparent"
  style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #06b6d4 100%)' }}
>
  Your rules.
</span>
```

---

## Interactive Elements

### Primary button
```tsx
<button
  style={{
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    boxShadow: '0 4px 14px #6366f140',
  }}
  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
>
```

### Ghost / outline button
Use shadcn `<Button variant="outline">` or `<Button variant="ghost">` — they auto-adapt to theme.

### Focus rings / glow on inputs
When an input is focused, show a soft brand-colored border + shadow:
```tsx
style={{
  borderColor: focused ? '#6366f150' : 'hsl(var(--border))',
  boxShadow: focused ? '0 0 0 1px #6366f130, 0 8px 32px #6366f118' : undefined,
}}
```

---

## Cards & Surfaces

Cards use `hsl(var(--card))` background with `hsl(var(--border))` border, `border-radius: 1rem` (`rounded-2xl`).

For **accent cards** (room cards, feature tiles):
- Left border stripe using brand gradient: `border-l-2`, `style={{ borderLeftColor: '#6366f1' }}`
- Hover lift: `hover:-translate-y-0.5 hover:shadow-lg transition-all`
- Active/live rooms get a glowing green dot: `bg-emerald-500 animate-pulse`

---

## Status Indicators

| State | Color | Pattern |
|---|---|---|
| Online / active | `#10b981` (emerald-500) | Pulsing dot |
| Inactive / idle | `hsl(var(--muted-foreground))` | Static dot |
| Brand accent | `#6366f1` | Solid/gradient |
| Destructive | `hsl(var(--destructive))` | shadcn token |

---

## Animations

All animations defined as `@keyframes` in `<style>` JSX tags or in `styles.css`:

| Name | Purpose | Duration |
|---|---|---|
| `aurora-drift` | Background orb float | 14–26s |
| `beacon` | Radiating rings on Radio icon | 2.4–2.8s |
| `float` | Gentle vertical bob | 4s |
| `wave` | Waveform bars in auth panel | 1.4s |
| `blob` | Organic shape morph (border-radius) | 8–15s |
| `shimmer` | Loading shimmer | 2s |

Keep animations subtle — they should feel alive, not distracting.

---

## Iconography

Use **Lucide React** exclusively. Brand-adjacent icons:
- `Radio` — the bedrud logo icon
- `Zap` — speed / features
- `Lock` — encryption / privacy
- `Server` — self-hosted
- `Users` — participants
- `Mic` / `MicOff` — audio state
- `Video` / `VideoOff` — camera state

---

## Do / Don't

**Do:**
- Use CSS variables for all structural colors (border, background, text)
- Use inline `style` for brand gradients and exact hex values (cleaner than arbitrary Tailwind values)
- Add `backdrop-blur-sm` to floating surfaces (nav, modals, tooltips)
- Use `transition-all duration-200` on interactive elements
- Keep the aurora blobs on any full-page background

**Don't:**
- Hardcode `bg-white` or `bg-gray-900` for structural surfaces
- Use more than 4 brand gradient stops in one element
- Stack too many glowing shadows (max 1–2 per element)
- Use emojis in UI (unless explicitly requested)
- Add gradients to every element — reserve them for hierarchy-defining elements (logo, CTAs, hero text)
