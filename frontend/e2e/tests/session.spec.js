import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage.js';
import { createTestUser } from '../fixtures/test-data.js';

test.describe('Session Persistence', () => {
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
    // Navigate to any page first so that localStorage.setItem runs in the correct origin.
    // Playwright's page.evaluate can only access localStorage for the currently loaded URL.
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
