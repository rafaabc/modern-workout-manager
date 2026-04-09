import { test, expect } from '@playwright/test';

test.describe('Authorization', () => {
  // Each test file runs in a fresh browser context (empty localStorage).
  // No manual localStorage clearing needed — no auth token is present by default.
  test('should redirect unauthenticated user from dashboard to login', async ({ page }) => {
    await test.step('navigate to dashboard without auth token', async () => {
      await page.goto('/');
    });

    await test.step('verify redirect to /login', async () => {
      await expect(page).toHaveURL('/login');
    });
  });
});
