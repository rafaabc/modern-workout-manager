import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage.js';
import { createAndLoginUser, seedAuthState } from '../fixtures/test-data.js';

test.describe('Session Persistence', () => {
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

  test('should keep user logged in after page reload', async ({ page }) => {
    await test.step('reload the page', async () => {
      await page.reload();
    });

    await test.step('verify still on dashboard with logout button visible', async () => {
      await expect(page).toHaveURL('/');
      await expect(page.locator('.logout-button')).toBeVisible();
    });
  });

  test('should logout and redirect to login, then block protected route', async ({ page }) => {
    const dashboard = new DashboardPage(page);

    await test.step('click logout', async () => {
      await dashboard.logout();
    });

    await test.step('verify redirect to /login', async () => {
      await expect(page).toHaveURL(/\/login/);
    });

    await test.step('verify protected route is blocked after logout', async () => {
      await page.goto('/');
      await expect(page).toHaveURL('/login');
    });
  });
});
