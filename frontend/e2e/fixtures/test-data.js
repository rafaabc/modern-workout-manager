import crypto from 'crypto';

export function createTestUser() {
  return {
    username: `e2e_${Date.now()}`,
    password: 'P' + crypto.randomBytes(8).toString('hex') + '1',
  };
}

export function todayDate() {
  const d = new Date();
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
}
