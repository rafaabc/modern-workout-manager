import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestDatabase, clearCollections, stopTestDatabase } from '../testDatabase.js';
import { createUserRepository } from '../../../src/repositories/userRepository.js';
import { createGoalRepository } from '../../../src/repositories/goalRepository.js';
import { randomHash } from '../../helpers/testCredentials.js';

describe('goalRepository', () => {
  let goalRepository;
  let userId;
  let testPassword;

  before(async () => {
    await startTestDatabase();
  });

  after(async () => {
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await clearCollections();
    const userRepository = createUserRepository();
    goalRepository = createGoalRepository();
    testPassword = randomHash();
    const user = await userRepository.create({ username: 'john', password: testPassword });
    userId = user.id;
  });

  describe('upsert', () => {
    it('should create a goal when none exists', async () => {
      const result = await goalRepository.upsert({ userId, goal: 150, year: 2025 });
      assert.ok(result.id);
      assert.equal(result.goal, 150);
      assert.equal(result.year, 2025);
    });

    it('should update goal when one already exists for the user', async () => {
      await goalRepository.upsert({ userId, goal: 150, year: 2025 });
      const result = await goalRepository.upsert({ userId, goal: 200, year: 2026 });
      assert.equal(result.goal, 200);
      assert.equal(result.year, 2026);
    });
  });

  describe('findByUser', () => {
    it('should return existing goal', async () => {
      await goalRepository.upsert({ userId, goal: 150, year: 2025 });
      const result = await goalRepository.findByUser(userId);
      assert.ok(result);
      assert.equal(result.goal, 150);
      assert.equal(result.year, 2025);
    });

    it('should return undefined for user without goal', async () => {
      const result = await goalRepository.findByUser(userId);
      assert.equal(result, undefined);
    });
  });
});
