/**
 * Handlers pour mocker l'API dans les tests Playwright
 */

import { Page, Route } from '@playwright/test';
import { mockAuthResponse, mockExpenseReports, mockRefreshResponse } from './fixtures';

/**
 * Configure tous les mocks API pour une page
 */
export async function setupApiMocks(page: Page) {
  // Mock login API
  await page.route('**/api/auth/login', async (route: Route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    if (postData?.email === 'admin@clubalpinlyon.top') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, ...mockAuthResponse }),
      });
    } else if (postData?.email === 'invalid@test.com') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Email ou mot de passe incorrect' }),
      });
    }
  });

  // Mock external auth API (Symfony backend)
  await page.route('**/auth', async (route: Route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const postData = request.postDataJSON();
      if (postData?.email === 'admin@clubalpinlyon.top') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAuthResponse),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid credentials' }),
        });
      }
    } else {
      await route.continue();
    }
  });

  // Mock token refresh
  await page.route('**/token/refresh', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockRefreshResponse),
    });
  });

  // Mock expense reports list
  await page.route('**/expense-reports', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === 'GET') {
      let filteredReports = [...mockExpenseReports];

      // Filter by status
      const status = url.searchParams.get('status');
      if (status && status !== 'all') {
        filteredReports = filteredReports.filter(r => r.status === status);
      }

      // Filter by search term
      const search = url.searchParams.get('search');
      if (search) {
        const searchLower = search.toLowerCase();
        filteredReports = filteredReports.filter(r =>
          r.sortie.titre.toLowerCase().includes(searchLower) ||
          r.utilisateur.nom.toLowerCase().includes(searchLower) ||
          r.utilisateur.prenom.toLowerCase().includes(searchLower)
        );
      }

      // Filter by requester name
      const requester = url.searchParams.get('requester');
      if (requester) {
        const requesterLower = requester.toLowerCase();
        filteredReports = filteredReports.filter(r =>
          r.utilisateur.nom.toLowerCase().includes(requesterLower) ||
          r.utilisateur.prenom.toLowerCase().includes(requesterLower)
        );
      }

      // Filter by type (don/remboursement)
      const type = url.searchParams.get('type');
      if (type === 'don') {
        filteredReports = filteredReports.filter(r => !r.refundRequired);
      } else if (type === 'remboursement') {
        filteredReports = filteredReports.filter(r => r.refundRequired);
      }

      // Pagination
      const page_num = parseInt(url.searchParams.get('page') || '1');
      const perPage = parseInt(url.searchParams.get('itemsPerPage') || '10');
      const start = (page_num - 1) * perPage;
      const paginatedReports = filteredReports.slice(start, start + perPage);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          'hydra:member': paginatedReports,
          'hydra:totalItems': filteredReports.length,
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock single expense report
  await page.route('**/expense-reports/*', async (route: Route) => {
    const request = route.request();
    const url = request.url();
    const idMatch = url.match(/expense-reports\/(\d+)/);

    if (request.method() === 'GET' && idMatch) {
      const id = parseInt(idMatch[1]);
      const report = mockExpenseReports.find(r => r.id === id);

      if (report) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(report),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not found' }),
        });
      }
    } else if (request.method() === 'PATCH' && idMatch) {
      const id = parseInt(idMatch[1]);
      const report = mockExpenseReports.find(r => r.id === id);
      const postData = request.postDataJSON();

      if (report) {
        const updatedReport = { ...report, ...postData };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updatedReport),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not found' }),
        });
      }
    } else {
      await route.continue();
    }
  });

  // Mock API logout
  await page.route('**/api/auth/logout', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

/**
 * Configure les mocks avec une erreur serveur
 */
export async function setupApiMocksWithError(page: Page) {
  await page.route('**/api/auth/login', async (route: Route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  });

  await page.route('**/expense-reports', async (route: Route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  });
}
