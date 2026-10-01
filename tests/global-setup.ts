import { startFakeBackend } from './mocks/fake-backend';
import { FAKE_BACKEND_PORT } from '../playwright.config';

export default async function globalSetup() {
  // La fonction renvoyée est appelée par Playwright à la fin des tests.
  return startFakeBackend(FAKE_BACKEND_PORT);
}
