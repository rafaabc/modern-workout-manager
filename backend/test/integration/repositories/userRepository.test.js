import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from '../testDatabase.js';
import { createUserRepository } from '../../../src/repositories/userRepository.js';

describe('userRepository', () => {
  let db;
  let userRepository;

  beforeEach(() => {
    db = createTestDatabase();
    userRepository = createUserRepository(db);
  });

  describe('create', () => {
    it('should persist a user correctly', () => {
      const result = userRepository.create({ username: 'john', password: 'hashedpass' });

      assert.equal(result.id, 1);
      assert.equal(result.username, 'john');
    });

    it('should throw on duplicate username (UNIQUE constraint)', () => {
      userRepository.create({ username: 'john', password: 'hashedpass1' });

      assert.throws(
        () => userRepository.create({ username: 'john', password: 'hashedpass2' }),
        (err) => {
          assert.ok(err.message.includes('UNIQUE'));
          return true;
        },
      );
    });
  });

  describe('findByUsername', () => {
    it('should return the user when found', () => {
      userRepository.create({ username: 'john', password: 'hashedpass' });

      const user = userRepository.findByUsername('john');
      assert.ok(user);
      assert.equal(user.username, 'john');
      assert.equal(user.password, 'hashedpass');
      assert.ok(user.id);
      assert.ok(user.created_at);
    });

    it('should return undefined for non-existent user', () => {
      const user = userRepository.findByUsername('nonexistent');
      assert.equal(user, undefined);
    });
  });
});
