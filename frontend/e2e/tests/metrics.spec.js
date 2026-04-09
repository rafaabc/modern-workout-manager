import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage.js';
import { createAndLoginUser, seedAuthState } from '../fixtures/test-data.js';

const WORKOUTS_TO_ADD = 3;

test.describe('Workout Metrics', () => {
  let token;
  let username;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  test.beforeAll(async ({ request }) => {
    ({ token, username } = await createAndLoginUser(request));

    // Add 3 workouts via API on days 1, 2, 3 of the current month
    for (let day = 1; day <= WORKOUTS_TO_ADD; day++) {
      await request.post('/api/workouts/calendar', {
        headers: { Authorization: `Bearer ${token}` },
        data: { day, month, year },
      });
    }
  });

  test.afterAll(async ({ request }) => {
    for (let day = 1; day <= WORKOUTS_TO_ADD; day++) {
      const res = await request.delete('/api/workouts/calendar', {
        headers: { Authorization: `Bearer ${token}` },
        data: { day, month, year },
      });
      // 404 is acceptable — workout may have already been removed
      if (!res.ok() && res.status() !== 404) {
        throw new Error(`afterAll cleanup failed for day ${day} with status ${res.status()}`);
      }
    }
  });

  test('should display the correct total number of workouts for the year', async ({ page }) => {
    await seedAuthState(page, token, username);
    await page.goto('/');
    await expect(page).toHaveURL('/');

    const dashboard = new DashboardPage(page);

    await test.step('verify year total matches workouts added via API', async () => {
      await expect(dashboard.yearTotal).toBeVisible();
      const total = await dashboard.getYearTotal();
      expect(total).toBe(WORKOUTS_TO_ADD);
    });
  });
});
