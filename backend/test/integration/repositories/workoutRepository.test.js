import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestDatabase, clearCollections, stopTestDatabase } from '../testDatabase.js';
import { createUserRepository } from '../../../src/repositories/userRepository.js';
import { createWorkoutRepository } from '../../../src/repositories/workoutRepository.js';
import { randomHash } from '../../helpers/testCredentials.js';

describe('workoutRepository', () => {
  let workoutRepository;
  let userRepository;
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
    userRepository = createUserRepository();
    workoutRepository = createWorkoutRepository();
    testPassword = randomHash();
    const user = await userRepository.create({ username: 'john', password: testPassword });
    userId = user.id;
  });

  describe('create', () => {
    it('should persist a workout and return correct data', async () => {
      const result = await workoutRepository.create({ userId, day: 15, month: 1, year: 2025 });
      assert.ok(result.id);
      assert.equal(result.day, 15);
      assert.equal(result.month, 1);
      assert.equal(result.year, 2025);
    });

    it('should throw on duplicate (userId, day, month, year) unique constraint', async () => {
      await workoutRepository.create({ userId, day: 15, month: 1, year: 2025 });
      await assert.rejects(
        async () => workoutRepository.create({ userId, day: 15, month: 1, year: 2025 }),
        (err) => {
          assert.equal(err.code, 11000); // MongoDB duplicate key error
          return true;
        },
      );
    });
  });

  describe('findByMonth', () => {
    it('should return only workouts for the given month/year/user', async () => {
      await workoutRepository.create({ userId, day: 5, month: 1, year: 2025 });
      await workoutRepository.create({ userId, day: 10, month: 1, year: 2025 });
      await workoutRepository.create({ userId, day: 20, month: 2, year: 2025 });

      const result = await workoutRepository.findByMonth({ userId, month: 1, year: 2025 });
      assert.equal(result.length, 2);
      assert.equal(result[0].day, 5);
      assert.equal(result[1].day, 10);
    });

    it('should not return workouts from another user', async () => {
      const testPasswordB = randomHash();
      const userB = await userRepository.create({ username: 'jane', password: testPasswordB });
      const userBId = userB.id;
      await workoutRepository.create({ userId, day: 5, month: 1, year: 2025 });
      await workoutRepository.create({ userId: userBId, day: 10, month: 1, year: 2025 });

      const result = await workoutRepository.findByMonth({ userId, month: 1, year: 2025 });
      assert.equal(result.length, 1);
      assert.equal(result[0].day, 5);
    });
  });

  describe('remove', () => {
    it('should delete the workout and return true', async () => {
      await workoutRepository.create({ userId, day: 15, month: 1, year: 2025 });
      const result = await workoutRepository.remove({ userId, day: 15, month: 1, year: 2025 });
      assert.equal(result, true);

      const remaining = await workoutRepository.findByMonth({ userId, month: 1, year: 2025 });
      assert.equal(remaining.length, 0);
    });

    it('should return false for non-existent workout', async () => {
      const result = await workoutRepository.remove({ userId, day: 15, month: 1, year: 2025 });
      assert.equal(result, false);
    });
  });

  describe('countByYear', () => {
    it('should return correct count', async () => {
      await workoutRepository.create({ userId, day: 5, month: 1, year: 2025 });
      await workoutRepository.create({ userId, day: 10, month: 2, year: 2025 });
      await workoutRepository.create({ userId, day: 20, month: 3, year: 2026 });

      const count = await workoutRepository.countByYear({ userId, year: 2025 });
      assert.equal(count, 2);
    });
  });

  describe('countByYearGrouped', () => {
    it('should return count grouped by month', async () => {
      await workoutRepository.create({ userId, day: 1, month: 1, year: 2025 });
      await workoutRepository.create({ userId, day: 5, month: 1, year: 2025 });
      await workoutRepository.create({ userId, day: 10, month: 3, year: 2025 });

      const grouped = await workoutRepository.countByYearGrouped({ userId, year: 2025 });
      assert.equal(grouped.length, 2);
      assert.equal(grouped[0].month, 1);
      assert.equal(grouped[0].count, 2);
      assert.equal(grouped[1].month, 3);
      assert.equal(grouped[1].count, 1);
    });
  });
});
