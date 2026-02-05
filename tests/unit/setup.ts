// Setup file for Vitest unit tests
import { afterEach, vi } from 'vitest';

// Set env vars needed by API routes and lib modules
process.env.NEXT_PUBLIC_API_URL = 'https://api.test.local';
process.env.NODE_ENV = 'test';

// Save original fetch to restore it after each test
const originalFetch = global.fetch;

// Restore all mocks after each test to avoid leaking state
afterEach(() => {
  vi.restoreAllMocks();
  global.fetch = originalFetch;
});
