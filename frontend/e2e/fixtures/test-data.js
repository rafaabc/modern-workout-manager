import crypto from 'crypto';

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
