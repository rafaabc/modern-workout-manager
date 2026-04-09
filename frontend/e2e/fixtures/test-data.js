import crypto from 'node:crypto';

export function createTestUser() {
  return {
    username: `e2e_${Date.now()}`,
    password: 'P' + crypto.randomBytes(8).toString('hex') + '1',
  };
}

// Note: only valid for getDayCell() when the calendar is showing the current month (default).
// If tests navigate to a different month, use the specific month's days instead.
export function todayDate() {
  const d = new Date();
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
}

/**
 * Seeds auth state into localStorage so the app treats the page as authenticated.
 * Must navigate to an app page first so localStorage is scoped to the correct origin.
 */
export async function seedAuthState(page, token, username) {
  await page.goto('/login');
  await page.evaluate(
    ({ token, username }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      localStorage.setItem('lastActivityAt', String(Date.now()));
    },
    { token, username },
  );
}

/**
 * Registers a fresh user and logs them in via API, returning their token and username.
 */
export async function createAndLoginUser(request) {
  const user = createTestUser();
  await request.post('/api/users/register', { data: user });
  const res = await request.post('/api/users/login', { data: user });
  const { token } = await res.json();
  return { username: user.username, token };
}
