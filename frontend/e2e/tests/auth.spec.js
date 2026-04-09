import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { RegisterPage } from '../pages/RegisterPage.js';
import { createTestUser } from '../fixtures/test-data.js';

test.describe('Authentication', () => {
  test('should register a new user and redirect to login with success message', async ({
    page,
  }) => {
    const { username, password } = createTestUser();
    const registerPage = new RegisterPage(page);

    await test.step('navigate to register page', async () => {
      await registerPage.goto();
      await expect(page).toHaveURL('/register');
    });

    await test.step('submit valid registration form', async () => {
      await registerPage.register(username, password);
    });

    await test.step('verify redirect to login with success message', async () => {
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('.text-emerald-200')).toBeVisible();
    });
  });

  test('should login with valid credentials and redirect to dashboard', async ({
    page,
    request,
  }) => {
    const { username, password } = createTestUser();

    await request.post('/api/users/register', { data: { username, password } });

    const loginPage = new LoginPage(page);

    await test.step('navigate to login page', async () => {
      await loginPage.goto();
    });

    await test.step('submit valid credentials', async () => {
      await loginPage.login(username, password);
    });

    await test.step('verify redirect to dashboard', async () => {
      await expect(page).toHaveURL('/');
    });
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    const { username, password } = createTestUser();
    const loginPage = new LoginPage(page);

    await test.step('navigate to login page', async () => {
      await loginPage.goto();
    });

    await test.step('submit credentials for non-existent user', async () => {
      await loginPage.login(username, password);
    });

    await test.step('verify error message is visible', async () => {
      await expect(loginPage.errorMessage).toBeVisible();
    });
  });

  test('should redirect authenticated user from /login to dashboard', async ({ page, request }) => {
    const { username, password } = createTestUser();

    await request.post('/api/users/register', { data: { username, password } });
    const loginRes = await request.post('/api/users/login', { data: { username, password } });
    const { token } = await loginRes.json();

    await test.step('seed auth state into localStorage', async () => {
      await page.goto('/login');
      await page.evaluate(
        ({ token, username }) => {
          localStorage.setItem('token', token);
          localStorage.setItem('username', username);
          localStorage.setItem('lastActivityAt', String(Date.now()));
        },
        { token, username },
      );
    });

    await test.step('navigate to /login while authenticated', async () => {
      await page.goto('/login');
    });

    await test.step('verify redirect to dashboard', async () => {
      await expect(page).toHaveURL('/');
    });
  });
});
