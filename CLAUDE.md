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
pnpm test:e2e           # Run Playwright E2E tests (requires .env.test)
pnpm test:e2e:ui        # Run tests with Playwright UI
pnpm test:e2e:report    # Show test report
```

**Note**: E2E tests require `.env.test` with valid credentials:
```env
VALID_EMAIL=your-email@example.com
VALID_PASSWORD=your-password
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand (filters, pagination)
- **Auth**: JWT with refresh tokens stored in httpOnly cookies
- **Testing**: Playwright for E2E tests
- **Monitoring**: Sentry (production only)

### Key Architecture Patterns

#### 1. Authentication Flow
- Login via `/api/auth/login` route → external API (`NEXT_PUBLIC_API_URL/auth`)
- Tokens stored in httpOnly cookies (`access_token`, `refresh_token`)
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

- `app/lib/constants.ts`: Cookie names, API endpoints
- `app/config.ts`: Environment variables and API URLs
- `app/interfaces/noteDeFraisInterface.ts`: TypeScript types for expense reports
- `app/enums/ExpenseStatus.ts`: Status enum values
- `app/(private)/note-de-frais/ExpenseReportsClient.tsx`: Main expense reports component

## API Integration

External API: `https://www.clubalpinlyon.top/api` (or configured via `NEXT_PUBLIC_API_URL`)

Key endpoints:
- `POST /auth`: Login
- `POST /token/refresh`: Refresh token
- `GET /expense-reports`: List expense reports
- `PATCH /expense-reports/{id}`: Update expense report status

See `API.md` for complete API documentation.

## Development Guidelines

1. **Token Management**: Never expose tokens in client-side code. Use the provided fetch utilities.

2. **Error Handling**: All API calls should handle 401 (unauthorized) by attempting token refresh.

3. **TypeScript**: The project has `ignoreBuildErrors: true` in Next.js config but maintain type safety where possible.

4. **Component Structure**: 
   - Use Server Components by default
   - Client Components only when needed (interactivity, hooks, browser APIs)
   - Separate business logic into custom hooks (`app/lib/hooks/`)

5. **Styling**: Use Tailwind classes directly. UI components from shadcn/ui are in `components/ui/`.

## Environment Variables

Required in `.env`:
```env
NEXT_PUBLIC_BACKEND_BASE_URL=https://www.clubalpinlyon.top/api
NEXT_PUBLIC_WEBSITE_BASE_URL=https://compta.clubalpinlyon.top
NEXT_PUBLIC_API_URL=https://www.clubalpinlyon.top/api
```

For Sentry (production):
```env
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## Deployment

The application auto-deploys to Vercel when changes are pushed to `main`. Always run `pnpm build` locally to verify the build before pushing.