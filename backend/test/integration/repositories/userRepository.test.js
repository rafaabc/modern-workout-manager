import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from '../testDatabase.js';
import { createUserRepository } from '../../../src/repositories/userRepository.js';
import { randomHash } from '../../helpers/testCredentials.js';

describe('userRepository', () => {
  let db;
  let userRepository;

  let testPassword;
  let testPassword2;
  let testPassword3;
  beforeEach(() => {
    db = createTestDatabase();
    userRepository = createUserRepository(db);
    testPassword = randomHash();
    testPassword2 = randomHash();
    testPassword3 = randomHash();
  });

  describe('create', () => {
    it('should persist a user correctly', () => {
      const result = userRepository.create({ username: 'john', password: testPassword });

      assert.equal(result.id, 1);
      assert.equal(result.username, 'john');
    });

    it('should throw on duplicate username (UNIQUE constraint)', () => {
      userRepository.create({ username: 'john', password: testPassword2 });

      assert.throws(
        () => userRepository.create({ username: 'john', password: testPassword3 }),
        (err) => {
          assert.ok(err.message.includes('UNIQUE'));
          return true;
        },
      );
    });
  });

  describe('findByUsername', () => {
    it('should return the user when found', () => {
      userRepository.create({ username: 'john', password: testPassword });

      const user = userRepository.findByUsername('john');
      assert.ok(user);
      assert.equal(user.username, 'john');
      assert.equal(user.password, testPassword);
      assert.ok(user.id);
      assert.ok(user.created_at);
    });

    it('should return undefined for non-existent user', () => {
      const user = userRepository.findByUsername('nonexistent');
      assert.equal(user, undefined);
    });
  });
});
