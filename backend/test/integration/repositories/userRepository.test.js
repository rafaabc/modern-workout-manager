import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestDatabase, clearCollections, stopTestDatabase } from '../testDatabase.js';
import { createUserRepository } from '../../../src/repositories/userRepository.js';
import { randomHash } from '../../helpers/testCredentials.js';

describe('userRepository', () => {
  let userRepository;
  let testPassword;
  let testPassword2;
  let testPassword3;

  before(async () => {
    await startTestDatabase();
  });

  after(async () => {
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await clearCollections();
    userRepository = createUserRepository();
    testPassword = randomHash();
    testPassword2 = randomHash();
    testPassword3 = randomHash();
  });

  describe('create', () => {
    it('should persist a user correctly', async () => {
      const result = await userRepository.create({ username: 'john', password: testPassword });

      assert.ok(result.id);
      assert.match(result.id, /^[0-9a-f]{24}$/); // MongoDB ObjectId format
      assert.equal(result.username, 'john');
    });

    it('should throw on duplicate username (unique constraint)', async () => {
      await userRepository.create({ username: 'john', password: testPassword2 });

      await assert.rejects(
        async () => userRepository.create({ username: 'john', password: testPassword3 }),
        (err) => {
          assert.equal(err.code, 11000); // MongoDB duplicate key error
          return true;
        },
      );
    });
  });

  describe('findByUsername', () => {
    it('should return the user when found', async () => {
      await userRepository.create({ username: 'john', password: testPassword });

      const user = await userRepository.findByUsername('john');
      assert.ok(user);
      assert.equal(user.username, 'john');
      assert.equal(user.password, testPassword);
      assert.ok(user.id);
      assert.ok(user.createdAt); // Mongoose timestamps use camelCase
    });

    it('should return undefined for non-existent user', async () => {
      const user = await userRepository.findByUsername('nonexistent');
      assert.equal(user, undefined);
    });
  });

  describe('updatePassword', () => {
    it('should update the stored password hash', async () => {
      const original = randomHash();
      const updated = randomHash();
      await userRepository.create({ username: 'john', password: original });

      await userRepository.updatePassword('john', updated);

      const user = await userRepository.findByUsername('john');
      assert.equal(user.password, updated);
    });

    it('should do nothing when username does not exist', async () => {
      await assert.doesNotReject(() => userRepository.updatePassword('nobody', randomHash()));
    });
  });
});
