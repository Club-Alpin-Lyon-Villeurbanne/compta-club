import { Page } from '@playwright/test';

export async function setupExpenseReportsMocks(page: Page) {
  await page.route('**/api/expense-reports', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([
        {
          id: 1,
          date: '2024-03-15',
          description: 'Transport',
          amount: 50.00,
          status: 'pending'
        },
        {
          id: 2,
          date: '2024-03-16',
          description: 'Hébergement',
          amount: 150.00,
          status: 'approved'
        }
      ])
    });
  });
} 