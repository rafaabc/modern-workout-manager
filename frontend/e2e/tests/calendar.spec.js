import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage.js';
import { createTestUser } from '../fixtures/test-data.js';

// Day 15 is always present in any month — safe for all test runs
const TEST_DAY = 15;
const UNMARKED_DAY = 14;

test.describe('Workout Calendar', () => {
  let token;
  let username;

  test.beforeAll(async ({ request }) => {
    const user = createTestUser();
    username = user.username;
    await request.post('/api/users/register', { data: user });
    const res = await request.post('/api/users/login', { data: user });
    ({ token } = await res.json());
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to /login first so localStorage.setItem runs in the correct origin
    await page.goto('/login');
    await page.evaluate(
      ({ token, username }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        localStorage.setItem('lastActivityAt', String(Date.now()));
      },
      { token, username },
    );
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test.afterEach(async ({ request }) => {
    const now = new Date();
    const res = await request.delete('/api/workouts/calendar', {
      headers: { Authorization: `Bearer ${token}` },
      data: { day: TEST_DAY, month: now.getMonth() + 1, year: now.getFullYear() },
    });
    // 404 is acceptable — workout may have already been removed by the test
    if (!res.ok() && res.status() !== 404) {
      throw new Error(`afterEach cleanup failed with status ${res.status()}`);
    }
  });

  test('should add a workout on a day and mark it visually', async ({ page }) => {
    const dashboard = new DashboardPage(page);

    await test.step('verify day 15 is initially unmarked', async () => {
      await expect(dashboard.getDayCell(TEST_DAY)).toBeVisible();
      await expect(dashboard.getDayCell(TEST_DAY)).not.toHaveClass(/workout-day/);
    });

    await test.step('click day 15 to add workout', async () => {
      await dashboard.clickDay(TEST_DAY);
    });

    await test.step('verify day 15 is now marked', async () => {
      await expect(dashboard.getDayCell(TEST_DAY)).toHaveClass(/workout-day/);
    });
  });

  test('should remove an existing workout and unmark the day', async ({ request, page }) => {
    const now = new Date();

    await test.step('add workout via API', async () => {
      await request.post('/api/workouts/calendar', {
        headers: { Authorization: `Bearer ${token}` },
        data: { day: TEST_DAY, month: now.getMonth() + 1, year: now.getFullYear() },
      });
    });

    await page.reload();
    const dashboard = new DashboardPage(page);
    await expect(dashboard.getDayCell(TEST_DAY)).toBeVisible();

    await test.step('verify day 15 is marked after reload', async () => {
      await expect(dashboard.getDayCell(TEST_DAY)).toHaveClass(/workout-day/);
    });

    await test.step('click day 15 to remove workout', async () => {
      await dashboard.clickDay(TEST_DAY);
    });

    await test.step('verify day 15 is now unmarked', async () => {
      await expect(dashboard.getDayCell(TEST_DAY)).not.toHaveClass(/workout-day/);
    });
  });

  test('marked days have a visually distinct style from unmarked days', async ({
    request,
    page,
  }) => {
    const now = new Date();

    await test.step('add workout on day 15 via API', async () => {
      await request.post('/api/workouts/calendar', {
        headers: { Authorization: `Bearer ${token}` },
        data: { day: TEST_DAY, month: now.getMonth() + 1, year: now.getFullYear() },
      });
    });

    await page.reload();
    const dashboard = new DashboardPage(page);
    await expect(dashboard.getDayCell(TEST_DAY)).toBeVisible();

    await test.step('marked day (15) has gradient background classes', async () => {
      const markedCell = dashboard.getDayCell(TEST_DAY);
      await expect(markedCell).toHaveClass(/workout-day/);
      await expect(markedCell).toHaveClass(/from-indigo-500/);
      await expect(markedCell).toHaveClass(/to-purple-600/);
    });

    await test.step('unmarked day (14) does not have workout gradient classes', async () => {
      const unmarkedCell = dashboard.getDayCell(UNMARKED_DAY);
      await expect(unmarkedCell).not.toHaveClass(/workout-day/);
      await expect(unmarkedCell).not.toHaveClass(/from-indigo-500/);
    });
  });
});
