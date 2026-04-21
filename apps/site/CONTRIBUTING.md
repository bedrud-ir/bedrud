# Contributing to Bedrud Site

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `bun install`
4. Start the dev server: `bun dev`

## Development

- Type check: `bun run typecheck:astro`
- Lint + format check: `bun run check`
- Auto-format: `bun run format`
- Build: `bun run build`

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Ensure Biome passes (`bun run check`)
4. Ensure types check (`bun run typecheck:astro`)
5. Open a pull request against `main`

## Code Style

- TypeScript strict mode
- Biome handles formatting and linting (double quotes, semicolons, 2-space indent)
- Use `~/` path alias for imports from `src/`
- Use shadcn/ui components and patterns

## i18n

- Translations live in `src/i18n/locales/{lang}.ts`
- Add new translation keys to both `en.ts` and `fa.ts`
- Use `t()` function from `~/i18n/utils` in components
