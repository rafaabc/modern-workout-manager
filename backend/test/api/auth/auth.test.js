import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { createTestServer } from '../testServer.js';
import { randomPassword, randomSecret } from '../../helpers/testCredentials.js';

describe('Auth API', () => {
  let testServer;
  let baseUrl;
  const JWT_SECRET = randomSecret();
  const registerPassword = randomPassword();
  const loginPassword = randomPassword();
  const wrongPassword = randomPassword();
  const weakInput = 'short';

  before(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    testServer = createTestServer();
    baseUrl = await testServer.start();
  });

  after(async () => {
    await testServer.close();
    delete process.env.JWT_SECRET;
  });

  describe('POST /api/users/register', () => {
    it('should register a user with valid data and persist in database', async () => {
      const res = await fetch(`${baseUrl}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: registerPassword }),
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.username, 'testuser');
      assert.ok(body.id);

      // Verify user was persisted by logging in (proves password was hashed and stored)
      const loginRes = await fetch(`${baseUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: registerPassword }),
      });
      assert.equal(loginRes.status, 200);
      const loginBody = await loginRes.json();
      assert.ok(loginBody.token);
    });

    it('should return 409 for duplicate username', async () => {
      const res = await fetch(`${baseUrl}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: randomPassword() }),
      });

      assert.equal(res.status, 409);
      const body = await res.json();
      assert.ok(body.error);
    });

    it('should return 400 for weak password', async () => {
      const res = await fetch(`${baseUrl}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'newuser', password: weakInput }),
      });

      assert.equal(res.status, 400);
      const body = await res.json();
      assert.ok(body.error);
    });
  });

  describe('POST /api/users/login', () => {
    it('should return a valid JWT token for correct credentials', async () => {
      // Register first
      await fetch(`${baseUrl}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'loginuser', password: loginPassword }),
      });

      const res = await fetch(`${baseUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'loginuser', password: loginPassword }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.token);

      // Verify JWT is valid
      const decoded = jwt.verify(body.token, JWT_SECRET);
      assert.equal(decoded.username, 'loginuser');
      assert.ok(decoded.userId);
    });

    it('should return 401 for wrong password', async () => {
      const res = await fetch(`${baseUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'loginuser', password: wrongPassword }),
      });

      assert.equal(res.status, 401);
      const body = await res.json();
      assert.ok(body.error);
    });
  });

  describe('POST /api/users/logout', () => {
    it('should return 200 with success message', async () => {
      const res = await fetch(`${baseUrl}/api/users/logout`, {
        method: 'POST',
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.message);
    });
  });

  describe('PATCH /api/users/password', () => {
    const originalPassword = randomPassword();
    const newValidPassword = randomPassword();
    const anotherPassword = randomPassword();

    before(async () => {
      await fetch(`${baseUrl}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'changeuser', password: originalPassword }),
      });
    });

    it('should return 200 and update the password', async () => {
      const res = await fetch(`${baseUrl}/api/users/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'changeuser',
          currentPassword: originalPassword,
          newPassword: newValidPassword,
        }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.message, 'Password updated successfully');
    });

    it('should reject login with old password after change', async () => {
      const res = await fetch(`${baseUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'changeuser', password: originalPassword }),
      });
      assert.equal(res.status, 401);
    });

    it('should allow login with new password after change', async () => {
      const res = await fetch(`${baseUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'changeuser', password: newValidPassword }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.token);
    });

    it('should return 400 when username is missing', async () => {
      const res = await fetch(`${baseUrl}/api/users/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: newValidPassword, newPassword: anotherPassword }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.ok(body.error);
    });

    it('should return 401 for wrong current password', async () => {
      const res = await fetch(`${baseUrl}/api/users/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'changeuser',
          currentPassword: randomPassword(),
          newPassword: anotherPassword,
        }),
      });
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.ok(body.error);
    });

    it('should return 404 for non-existent username', async () => {
      const res = await fetch(`${baseUrl}/api/users/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'nobody',
          currentPassword: randomPassword(),
          newPassword: anotherPassword,
        }),
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.ok(body.error);
    });

    it('should return 400 for invalid new password', async () => {
      const res = await fetch(`${baseUrl}/api/users/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'changeuser',
          currentPassword: newValidPassword,
          newPassword: 'weak',
        }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.ok(body.error);
    });
  });
});
