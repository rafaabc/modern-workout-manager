import { describe, it, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createUserService } from '../../../src/services/userService.js';
import { randomPassword, randomSecret } from '../../helpers/testCredentials.js';

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
  const validPassword = randomPassword();
  const anotherPassword = randomPassword();
  const wrongPassword = randomPassword();
  const tooShort = 'Short1';
  const noDigits = 'NoNumbers';
  const testSecret = randomSecret();

  before(() => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = testSecret;
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
      const result = userService.register({ username: 'john', password: validPassword });
      assert.equal(result.id, 1);
      assert.equal(result.username, 'john');
    });

    it('should throw 409 for duplicate username', () => {
      userService.register({ username: 'john', password: validPassword });

      assert.throws(
        () => userService.register({ username: 'john', password: anotherPassword }),
        (err) => {
          assert.equal(err.status, 409);
          assert.equal(err.message, 'Username already exists');
          return true;
        },
      );
    });

    it('should throw 400 for password shorter than 8 characters', () => {
      assert.throws(
        () => userService.register({ username: 'john', password: tooShort }),
        (err) => {
          assert.equal(err.status, 400);
          assert.match(err.message, /at least 8 characters/);
          return true;
        },
      );
    });

    it('should throw 400 for password without numbers', () => {
      assert.throws(
        () => userService.register({ username: 'john', password: noDigits }),
        (err) => {
          assert.equal(err.status, 400);
          assert.match(err.message, /at least one number/);
          return true;
        },
      );
    });

    it('should throw 400 for invalid username', () => {
      assert.throws(
        () => userService.register({ username: 'ab', password: validPassword }),
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
      userService.register({ username: 'john', password: validPassword });
    });

    it('should return a JWT token for valid credentials', () => {
      const result = userService.login({ username: 'john', password: validPassword });
      assert.ok(result.token);
      assert.equal(typeof result.token, 'string');
      assert.ok(result.token.split('.').length === 3);
    });

    it('should throw 401 for incorrect password', () => {
      assert.throws(
        () => userService.login({ username: 'john', password: wrongPassword }),
        (err) => {
          assert.equal(err.status, 401);
          assert.equal(err.message, 'Invalid credentials');
          return true;
        },
      );
    });

    it('should throw 401 for non-existent username', () => {
      assert.throws(
        () => userService.login({ username: 'unknown', password: validPassword }),
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
        userService.register({ username: 'john', password: validPassword });

        assert.throws(
          () => userService.login({ username: 'john', password: validPassword }),
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
