import { describe, it, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createUserService } from '../../../src/services/userService.js';

function createMockRepository() {
  const users = [];
  return {
    findByUsername(username) {
      return users.find((u) => u.username === username);
    },
    create({ username, password }) {
      const user = { id: users.length + 1, username, password };
      users.push(user);
      return { id: user.id, username: user.username };
    },
    _users: users,
  };
}

describe('userService', () => {
  let userService;
  let mockRepo;
  let originalJwtSecret;

  before(() => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-secret-key';
  });

  after(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  beforeEach(() => {
    mockRepo = createMockRepository();
    userService = createUserService(mockRepo);
  });

  describe('register', () => {
    it('should register a user successfully', () => {
      const result = userService.register({ username: 'john', password: 'Secret123' });
      assert.equal(result.id, 1);
      assert.equal(result.username, 'john');
    });

    it('should throw 409 for duplicate username', () => {
      userService.register({ username: 'john', password: 'Secret123' });

      assert.throws(
        () => userService.register({ username: 'john', password: 'Secret456' }),
        (err) => {
          assert.equal(err.status, 409);
          assert.equal(err.message, 'Username already exists');
          return true;
        },
      );
    });

    it('should throw 400 for password shorter than 8 characters', () => {
      assert.throws(
        () => userService.register({ username: 'john', password: 'Short1' }),
        (err) => {
          assert.equal(err.status, 400);
          assert.match(err.message, /at least 8 characters/);
          return true;
        },
      );
    });

    it('should throw 400 for password without numbers', () => {
      assert.throws(
        () => userService.register({ username: 'john', password: 'NoNumbers' }),
        (err) => {
          assert.equal(err.status, 400);
          assert.match(err.message, /at least one number/);
          return true;
        },
      );
    });

    it('should throw 400 for invalid username', () => {
      assert.throws(
        () => userService.register({ username: 'ab', password: 'Secret123' }),
        (err) => {
          assert.equal(err.status, 400);
          assert.match(err.message, /at least 3 characters/);
          return true;
        },
      );
    });
  });

  describe('login', () => {
    beforeEach(() => {
      userService.register({ username: 'john', password: 'Secret123' });
    });

    it('should return a JWT token for valid credentials', () => {
      const result = userService.login({ username: 'john', password: 'Secret123' });
      assert.ok(result.token);
      assert.equal(typeof result.token, 'string');
      assert.ok(result.token.split('.').length === 3);
    });

    it('should throw 401 for incorrect password', () => {
      assert.throws(
        () => userService.login({ username: 'john', password: 'WrongPass1' }),
        (err) => {
          assert.equal(err.status, 401);
          assert.equal(err.message, 'Invalid credentials');
          return true;
        },
      );
    });

    it('should throw 401 for non-existent username', () => {
      assert.throws(
        () => userService.login({ username: 'unknown', password: 'Secret123' }),
        (err) => {
          assert.equal(err.status, 401);
          assert.equal(err.message, 'Invalid credentials');
          return true;
        },
      );
    });
  });

  describe('JWT_SECRET', () => {
    it('should throw error when JWT_SECRET is not defined', () => {
      const savedSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      try {
        userService.register({ username: 'john', password: 'Secret123' });

        assert.throws(
          () => userService.login({ username: 'john', password: 'Secret123' }),
          (err) => {
            assert.match(err.message, /JWT_SECRET/);
            return true;
          },
        );
      } finally {
        process.env.JWT_SECRET = savedSecret;
      }
    });
  });
});
