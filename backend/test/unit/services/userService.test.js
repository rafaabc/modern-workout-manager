import { describe, it, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createUserService } from '../../../src/services/userService.js';
import { randomPassword, randomSecret } from '../../helpers/testCredentials.js';

function createMockRepository() {
  const users = [];
  return {
    async findByUsername(username) {
      return users.find((u) => u.username === username);
    },
    async create({ username, password }) {
      const user = { id: String(users.length + 1), username, password };
      users.push(user);
      return { id: user.id, username: user.username };
    },
    async updatePassword(username, hashedPassword) {
      const user = users.find((u) => u.username === username);
      if (user) user.password = hashedPassword;
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
    it('should register a user successfully', async () => {
      const result = await userService.register({ username: 'john', password: validPassword });
      assert.ok(result.id);
      assert.equal(result.username, 'john');
    });

    it('should throw 409 for duplicate username', async () => {
      await userService.register({ username: 'john', password: validPassword });

      await assert.rejects(
        async () => userService.register({ username: 'john', password: anotherPassword }),
        (err) => {
          assert.equal(err.status, 409);
          assert.equal(err.message, 'Username already exists');
          return true;
        },
      );
    });

    it('should throw 400 for password shorter than 8 characters', async () => {
      await assert.rejects(
        async () => userService.register({ username: 'john', password: tooShort }),
        (err) => {
          assert.equal(err.status, 400);
          assert.match(err.message, /at least 8 characters/);
          return true;
        },
      );
    });

    it('should throw 400 for password without numbers', async () => {
      await assert.rejects(
        async () => userService.register({ username: 'john', password: noDigits }),
        (err) => {
          assert.equal(err.status, 400);
          assert.match(err.message, /at least one number/);
          return true;
        },
      );
    });

    it('should throw 400 for invalid username', async () => {
      await assert.rejects(
        async () => userService.register({ username: 'ab', password: validPassword }),
        (err) => {
          assert.equal(err.status, 400);
          assert.match(err.message, /at least 3 characters/);
          return true;
        },
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await userService.register({ username: 'john', password: validPassword });
    });

    it('should return a JWT token for valid credentials', async () => {
      const result = await userService.login({ username: 'john', password: validPassword });
      assert.ok(result.token);
      assert.equal(typeof result.token, 'string');
      assert.ok(result.token.split('.').length === 3);
    });

    it('should throw 401 for incorrect password', async () => {
      await assert.rejects(
        async () => userService.login({ username: 'john', password: wrongPassword }),
        (err) => {
          assert.equal(err.status, 401);
          assert.equal(err.message, 'Invalid credentials');
          return true;
        },
      );
    });

    it('should throw 401 for non-existent username', async () => {
      await assert.rejects(
        async () => userService.login({ username: 'unknown', password: validPassword }),
        (err) => {
          assert.equal(err.status, 401);
          assert.equal(err.message, 'Invalid credentials');
          return true;
        },
      );
    });
  });

  describe('changePassword', () => {
    beforeEach(async () => {
      await userService.register({ username: 'john', password: validPassword });
    });

    it('should change the password successfully', async () => {
      await assert.doesNotReject(() =>
        userService.changePassword({
          username: 'john',
          currentPassword: validPassword,
          newPassword: anotherPassword,
        }),
      );
    });

    it('should allow login with new password after change', async () => {
      await userService.changePassword({
        username: 'john',
        currentPassword: validPassword,
        newPassword: anotherPassword,
      });

      const result = await userService.login({ username: 'john', password: anotherPassword });
      assert.ok(result.token);
    });

    it('should reject login with old password after change', async () => {
      await userService.changePassword({
        username: 'john',
        currentPassword: validPassword,
        newPassword: anotherPassword,
      });

      await assert.rejects(
        () => userService.login({ username: 'john', password: validPassword }),
        (err) => {
          assert.equal(err.status, 401);
          return true;
        },
      );
    });

    it('should throw 401 for wrong current password', async () => {
      await assert.rejects(
        () =>
          userService.changePassword({
            username: 'john',
            currentPassword: wrongPassword,
            newPassword: anotherPassword,
          }),
        (err) => {
          assert.equal(err.status, 401);
          assert.equal(err.message, 'Invalid credentials');
          return true;
        },
      );
    });

    it('should throw 400 for new password shorter than 8 characters', async () => {
      await assert.rejects(
        () =>
          userService.changePassword({
            username: 'john',
            currentPassword: validPassword,
            newPassword: 'Short1',
          }),
        (err) => {
          assert.equal(err.status, 400);
          assert.match(err.message, /at least 8 characters/);
          return true;
        },
      );
    });

    it('should throw 400 for new password without numbers', async () => {
      await assert.rejects(
        () =>
          userService.changePassword({
            username: 'john',
            currentPassword: validPassword,
            newPassword: 'NoNumbers',
          }),
        (err) => {
          assert.equal(err.status, 400);
          assert.match(err.message, /at least one number/);
          return true;
        },
      );
    });

    it('should throw 400 when newPassword is missing', async () => {
      await assert.rejects(
        () =>
          userService.changePassword({
            username: 'john',
            currentPassword: validPassword,
            newPassword: undefined,
          }),
        (err) => {
          assert.equal(err.status, 400);
          return true;
        },
      );
    });

    it('should throw 400 when username is missing', async () => {
      await assert.rejects(
        () =>
          userService.changePassword({
            username: undefined,
            currentPassword: validPassword,
            newPassword: anotherPassword,
          }),
        (err) => {
          assert.equal(err.status, 400);
          return true;
        },
      );
    });

    it('should throw 404 when user does not exist', async () => {
      await assert.rejects(
        () =>
          userService.changePassword({
            username: 'nonexistent',
            currentPassword: validPassword,
            newPassword: anotherPassword,
          }),
        (err) => {
          assert.equal(err.status, 404);
          assert.equal(err.message, 'User not found');
          return true;
        },
      );
    });
  });

  describe('JWT_SECRET', () => {
    it('should throw error when JWT_SECRET is not defined', async () => {
      const savedSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      try {
        await userService.register({ username: 'john', password: validPassword });

        await assert.rejects(
          async () => userService.login({ username: 'john', password: validPassword }),
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
