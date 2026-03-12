import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from '../testDatabase.js';
import { createUserRepository } from '../../../src/repositories/userRepository.js';
import { createGoalRepository } from '../../../src/repositories/goalRepository.js';
import { randomHash } from '../../helpers/testCredentials.js';

describe('goalRepository', () => {
  let db;
  let goalRepository;
  let userId;

  let testPassword;
  beforeEach(() => {
    db = createTestDatabase();
    const userRepository = createUserRepository(db);
    goalRepository = createGoalRepository(db);
    testPassword = randomHash();
    const user = userRepository.create({ username: 'john', password: testPassword });
    userId = Number(user.id);
  });

  describe('upsert', () => {
    it('should create a goal when none exists', () => {
      const result = goalRepository.upsert({ userId, goal: 150, year: 2025 });
      assert.ok(result.id);
      assert.equal(result.goal, 150);
      assert.equal(result.year, 2025);
    });

    it('should update goal when one already exists for the user', () => {
      goalRepository.upsert({ userId, goal: 150, year: 2025 });
      const result = goalRepository.upsert({ userId, goal: 200, year: 2026 });
      assert.equal(result.goal, 200);
      assert.equal(result.year, 2026);
    });
  });

  describe('findByUser', () => {
    it('should return existing goal', () => {
      goalRepository.upsert({ userId, goal: 150, year: 2025 });
      const result = goalRepository.findByUser(userId);
      assert.ok(result);
      assert.equal(result.goal, 150);
      assert.equal(result.year, 2025);
    });

    it('should return undefined for user without goal', () => {
      const result = goalRepository.findByUser(userId);
      assert.equal(result, undefined);
    });
  });
});
