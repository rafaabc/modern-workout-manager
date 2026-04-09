import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage.js';
import { createAndLoginUser, seedAuthState } from '../fixtures/test-data.js';

// Day 15 is always present in any month — safe for all test runs
const TEST_DAY = 15;
const UNMARKED_DAY = 14;

function currentMonthPayload(day) {
  const now = new Date();
  return { day, month: now.getMonth() + 1, year: now.getFullYear() };
}

async function addWorkoutAndReload(request, page, token, stepLabel) {
  await test.step(stepLabel, async () => {
    await request.post('/api/workouts/calendar', {
      headers: { Authorization: `Bearer ${token}` },
      data: currentMonthPayload(TEST_DAY),
    });
  });
  await page.reload();
  const dashboard = new DashboardPage(page);
  await expect(dashboard.getDayCell(TEST_DAY)).toBeVisible();
  return dashboard;
}

test.describe('Workout Calendar', () => {
  let token;
  let username;

  test.beforeAll(async ({ request }) => {
    ({ token, username } = await createAndLoginUser(request));
  });

  test.beforeEach(async ({ page }) => {
    await seedAuthState(page, token, username);
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test.afterEach(async ({ request }) => {
    const res = await request.delete('/api/workouts/calendar', {
      headers: { Authorization: `Bearer ${token}` },
      data: currentMonthPayload(TEST_DAY),
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
    const dashboard = await addWorkoutAndReload(request, page, token, 'add workout via API');

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
    const dashboard = await addWorkoutAndReload(
      request,
      page,
      token,
      'add workout on day 15 via API',
    );

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
