import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer } from '../testServer.js';
import { randomPassword, randomSecret } from '../../helpers/testCredentials.js';

describe('Metrics API', () => {
  let testServer;
  let baseUrl;
  let tokenA;
  let tokenB;
  const JWT_SECRET = randomSecret();
  const passwordA = randomPassword();
  const passwordB = randomPassword();

  before(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    testServer = createTestServer();
    baseUrl = await testServer.start();

    // Register and login user A
    await fetch(`${baseUrl}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'metricA', password: passwordA }),
    });
    const loginA = await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'metricA', password: passwordA }),
    });
    tokenA = (await loginA.json()).token;

    // Register and login user B
    await fetch(`${baseUrl}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'metricB', password: passwordB }),
    });
    const loginB = await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'metricB', password: passwordB }),
    });
    tokenB = (await loginB.json()).token;
  });

  after(async () => {
    await testServer.close();
    delete process.env.JWT_SECRET;
  });

  describe('GET /api/metrics', () => {
    it('should return 401 without token', async () => {
      const res = await fetch(`${baseUrl}/api/metrics?year=2025`);
      assert.equal(res.status, 401);
    });

    it('should return 200 with totalYear 0 and zeroed byMonth when no workouts', async () => {
      const res = await fetch(`${baseUrl}/api/metrics?year=2025`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.totalYear, 0);
      assert.equal(body.byMonth.length, 12);
      assert.ok(body.byMonth.every((m) => m.count === 0));
      assert.equal(body.goal, null);
      assert.equal(body.goalProgress, null);
    });
  });

  describe('POST /api/metrics/goal', () => {
    it('should set goal and persist in database', async () => {
      const res = await fetch(`${baseUrl}/api/metrics/goal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ goal: 150, year: 2025 }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.goal, 150);
      assert.equal(body.year, 2025);

      // Verify persistence in database
      const dbGoal = testServer.app.db
        .prepare('SELECT * FROM goals WHERE user_id = ?')
        .get(body.user_id);
      assert.ok(dbGoal);
      assert.equal(dbGoal.goal, 150);
    });

    it('should return 400 for invalid goal', async () => {
      const res = await fetch(`${baseUrl}/api/metrics/goal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ goal: 0, year: 2025 }),
      });
      assert.equal(res.status, 400);
    });
  });

  describe('GET /api/metrics after scheduling workouts', () => {
    it('should reflect totalYear and byMonth from database', async () => {
      // Schedule workouts for user A
      await fetch(`${baseUrl}/api/workouts/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ day: 1, month: 1, year: 2025 }),
      });
      await fetch(`${baseUrl}/api/workouts/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ day: 5, month: 1, year: 2025 }),
      });
      await fetch(`${baseUrl}/api/workouts/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ day: 10, month: 3, year: 2025 }),
      });

      const res = await fetch(`${baseUrl}/api/metrics?year=2025`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.totalYear, 3);
      assert.equal(body.byMonth[0].count, 2); // January
      assert.equal(body.byMonth[2].count, 1); // March
    });

    it('should calculate goalProgress correctly after setting goal', async () => {
      const res = await fetch(`${baseUrl}/api/metrics?year=2025`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      // 3 workouts, goal 150 → Math.round(3/150 * 100) = 2
      assert.equal(body.goal, 150);
      assert.equal(body.goalProgress, 2);
    });
  });

  describe('User isolation', () => {
    it('should not show user A metrics to user B', async () => {
      const res = await fetch(`${baseUrl}/api/metrics?year=2025`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.totalYear, 0);
      assert.equal(body.goal, null);
    });
  });
});
