# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
pnpm dev                # Start development server on http://localhost:3000
pnpm build              # Build for production (verify before deployment)
pnpm start              # Start production server
pnpm lint               # Run ESLint
```

### Testing
```bash
pnpm test:unit          # Run Vitest unit tests
pnpm test:unit:watch    # Run unit tests in watch mode
pnpm test:e2e           # Run Playwright E2E tests
pnpm test:e2e:ui        # Run tests with Playwright UI
pnpm test:e2e:report    # Show test report
```

**Note**: E2E tests need no backend nor credentials. Playwright builds the app for production, serves it on port 3100 and points it to a fake Symfony API (`tests/mocks/fake-backend.ts`, data from `tests/mocks/fixtures.ts`). The fake mirrors the production API formats (JWT expiry, `details` as a JSON string, `problem+json` errors, manager status transitions) and isolates each test in its own session; tests read what it received through `backendReceived()`. Next.js calls the API server-side, so `page.route()` cannot replace this fake. The build overwrites `.next`: do not run `pnpm dev` at the same time.

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand (filters, pagination)
- **Auth**: JWT with refresh tokens stored in httpOnly cookies
- **Testing**: Vitest (unit tests) + Playwright (E2E)
- **Monitoring**: Sentry (production only)

### Key Architecture Patterns

#### 1. Authentication Flow
- Login via `/api/auth/login` route → external API (`NEXT_PUBLIC_API_URL/auth`)
- Tokens stored in httpOnly cookies (`access_token`, `refresh_token`)
- Session refresh on page loads: `middleware.ts` refreshes an expired access token before rendering (server components cannot set cookies)
- Server-side auth check: `app/lib/auth.server.ts`
- Client-side auth check: `app/lib/auth.client.ts`
- Automatic token refresh on 401 responses

#### 2. Data Fetching Pattern
- **Server Components**: Use `fetchServer` from `app/lib/fetchServer.ts`
- **Client Components**: Use `fetchClient` from `app/lib/fetchClient.ts`
- Both utilities handle auth headers and token refresh automatically

#### 3. Route Organization
- `/(public)`: Unauthenticated pages (home, about, help)
- `/(private)`: Protected pages requiring authentication
- `/api`: Internal API routes proxying to external backend

#### 4. Expense Reports State Management
The application uses Zustand store (`app/store/useStore.ts`) for:
- Filter state (status, search, date, requester, type)
- Pagination (currentPage, itemsPerPage)
- Expense reports data cache

## Critical Files & Their Purpose

- `app/lib/constants.ts`: Cookie names
- `app/config.ts`: Club name and expense calculation rates (mileage rates, nightly cap, toll split), mirrored from the backend
- `app/interfaces/noteDeFraisInterface.ts`: TypeScript types for expense reports
- `app/enums/ExpenseStatus.ts`: Status enum values
- `app/(private)/note-de-frais/ExpenseReportsClient.tsx`: Main expense reports component

## API Integration

External API, configured via `NEXT_PUBLIC_API_URL`: `https://www.clubalpinlyon.fr/api` in production, `https://www.clubalpinlyon.top/api` on staging.

Key endpoints:
- `POST /auth`: Login
- `POST /token/refresh`: Refresh token
- `GET /admin/notes-de-frais`: List expense reports (admins and expense report managers only; also used as the auth check)
- `PATCH /notes-de-frais/{id}`: Update expense report status

See `API.md` for API documentation (note: this doc may move to the backend repo in the future).

## Development Guidelines

1. **Token Management**: Never expose tokens in client-side code. Use the provided fetch utilities.

2. **Error Handling**: Client API calls handle 401 (unauthorized) by attempting token refresh (`fetchClient` → `/api/auth/check`). Page loads are refreshed beforehand by `middleware.ts`: server components cannot set cookies, so `isAuthenticated()` only checks the token.

3. **TypeScript**: The project has `ignoreBuildErrors: true` in Next.js config but maintain type safety where possible.

4. **Component Structure**: 
   - Use Server Components by default
   - Client Components only when needed (interactivity, hooks, browser APIs)
   - Separate business logic into custom hooks (`app/hooks/`, `app/lib/hooks/`)

5. **Styling**: Use Tailwind classes directly. UI components from shadcn/ui are in `components/ui/`.

## Environment Variables

In `.env.local` (copied from `.env.exemple`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api  # staging: https://www.clubalpinlyon.top/api
NEXT_PUBLIC_CLUB_NAME=                         # optional, defaults to "CLUB ALPIN DE LYON"
```

For Sentry (production):
```env
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## Deployment

The application auto-deploys to Vercel when changes are pushed to `main`. Always run `pnpm build` locally to verify the build before pushing.