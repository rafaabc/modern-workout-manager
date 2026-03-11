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

      // Verify user was persisted in the database
      const dbUser = testServer.app.db
        .prepare('SELECT * FROM users WHERE username = ?')
        .get('testuser');
      assert.ok(dbUser);
      assert.equal(dbUser.username, 'testuser');
      assert.ok(dbUser.password);
      assert.notEqual(dbUser.password, registerPassword); // should be hashed
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
});
