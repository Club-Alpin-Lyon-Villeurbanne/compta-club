# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router (layouts, routes, `(public)`/`(private)` groups, `app/api/*`).
- `components/`: Reusable UI components (e.g., `components/ui/*`).
- `lib/`: Utilities and helpers (see `app/lib/*`, `lib/utils.ts`).
- `public/`: Static assets served at `/`.
- `tests/`: Playwright E2E specs and helpers.
- Config: `playwright.config.ts`, `tailwind.config.js`, `next.config.js`, `instrumentation.ts`, `sentry.*.config.ts`.
- Env: `.env.exemple` (template), `.env.local` (private, git‑ignored).

## Build, Test, and Development Commands
- `pnpm install`: Install dependencies.
- `pnpm dev`: Start the app at `http://localhost:3000`.
- `pnpm build`: Production build via Next.js.
- `pnpm start`: Serve the production build.
- `pnpm lint`: Lint with Next.js ESLint config.
- `pnpm test:e2e`: Run Playwright tests headless.
- `pnpm test:e2e:ui`: Open Playwright Test Runner UI.
- `pnpm test:e2e:report`: View the HTML report.
  Note: Playwright starts the dev server using `npm run dev` (see `playwright.config.ts`). Keep the `npm` alias available or update the config if standardizing on `pnpm`.

## Coding Style & Naming Conventions
- TypeScript + React (Next.js 15). Use functional components.
- Indentation: 2 spaces; files: kebab-case (e.g., `global-error.tsx`).
- Components: PascalCase; variables/functions: camelCase; env vars: SCREAMING_SNAKE_CASE.
- Follow ESLint rules (`pnpm lint`). Prefer small, typed modules under `app/*`, `components/*`, `lib/*`.
- TailwindCSS for styling; keep class lists readable and co-located with components.

## Testing Guidelines
- Framework: Playwright. Specs in `tests/*.spec.ts`.
- Base URL: `http://localhost:3000` (configured). Start app with `pnpm dev` before running tests locally.
- Prefer stable selectors (e.g., `data-testid`) for UI.
- Add tests for new user flows and bug fixes. Keep specs fast and independent.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, etc. Keep scope concise (e.g., `feat(ndf): ...`).
- One logical change per commit; write imperative, present-tense messages.
- PRs include: clear description, linked issue, screenshots for UI changes, and updates to `API.md`/`README.md` when relevant.
- Ensure `pnpm lint` and E2E tests pass before requesting review.

## Security & Configuration Tips
- Copy `.env.exemple` to `.env.local`; never commit secrets.
- Sentry is configured (`@sentry/nextjs`). Redact PII in logs and errors.
- Validate external inputs; avoid exposing private APIs in client code. Prefer server components or API routes under `app/api/*` for sensitive logic.

## Architecture Overview
- App Router with route groups and API routes in `app/api`.
- State management via `zustand` where needed.
- Utilities (`lib/*`) and typed interfaces under `app/interfaces` for consistency.
