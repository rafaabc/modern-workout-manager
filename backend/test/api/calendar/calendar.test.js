import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer } from '../testServer.js';
import { randomPassword, randomSecret } from '../../helpers/testCredentials.js';

describe('Calendar API', () => {
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
      body: JSON.stringify({ username: 'userA', password: passwordA }),
    });
    const loginA = await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'userA', password: passwordA }),
    });
    tokenA = (await loginA.json()).token;

    // Register and login user B
    await fetch(`${baseUrl}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'userB', password: passwordB }),
    });
    const loginB = await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'userB', password: passwordB }),
    });
    tokenB = (await loginB.json()).token;
  });

  after(async () => {
    await testServer.close();
    delete process.env.JWT_SECRET;
  });

  describe('GET /api/workouts/calendar', () => {
    it('should return 401 without token', async () => {
      const res = await fetch(`${baseUrl}/api/workouts/calendar?month=1&year=2025`);
      assert.equal(res.status, 401);
    });

    it('should return 200 with empty array for month with no workouts', async () => {
      const res = await fetch(`${baseUrl}/api/workouts/calendar?month=1&year=2025`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body));
      assert.equal(body.length, 0);
    });
  });

  describe('POST /api/workouts/calendar', () => {
    it('should schedule a workout and persist in database', async () => {
      const res = await fetch(`${baseUrl}/api/workouts/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ day: 15, month: 1, year: 2025 }),
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.day, 15);
      assert.equal(body.month, 1);
      assert.equal(body.year, 2025);
      assert.ok(body.id);

      // Verify persistence in database
      const dbWorkout = testServer.app.db
        .prepare('SELECT * FROM workouts WHERE id = ?')
        .get(body.id);
      assert.ok(dbWorkout);
      assert.equal(dbWorkout.day, 15);
    });

    it('should return 409 for duplicate workout', async () => {
      const res = await fetch(`${baseUrl}/api/workouts/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ day: 15, month: 1, year: 2025 }),
      });
      assert.equal(res.status, 409);
    });

    it('should return 400 for invalid month', async () => {
      const res = await fetch(`${baseUrl}/api/workouts/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ day: 15, month: 13, year: 2025 }),
      });
      assert.equal(res.status, 400);
    });
  });

  describe('DELETE /api/workouts/calendar', () => {
    it('should remove a workout and confirm deletion in database', async () => {
      // Schedule first
      const createRes = await fetch(`${baseUrl}/api/workouts/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ day: 20, month: 3, year: 2025 }),
      });
      const created = await createRes.json();

      const res = await fetch(`${baseUrl}/api/workouts/calendar`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ day: 20, month: 3, year: 2025 }),
      });
      assert.equal(res.status, 204);

      // Verify removal in database
      const dbWorkout = testServer.app.db
        .prepare('SELECT * FROM workouts WHERE id = ?')
        .get(created.id);
      assert.equal(dbWorkout, undefined);
    });

    it('should return 404 for non-existent workout', async () => {
      const res = await fetch(`${baseUrl}/api/workouts/calendar`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ day: 28, month: 6, year: 2025 }),
      });
      assert.equal(res.status, 404);
    });
  });

  describe('User isolation', () => {
    it('should not show user A workouts to user B', async () => {
      // User A schedules a workout
      await fetch(`${baseUrl}/api/workouts/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ day: 10, month: 6, year: 2025 }),
      });

      // User B queries the same month
      const res = await fetch(`${baseUrl}/api/workouts/calendar?month=6&year=2025`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.length, 0);
    });
  });
});
