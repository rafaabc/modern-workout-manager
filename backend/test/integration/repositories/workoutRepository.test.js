import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from '../testDatabase.js';
import { createUserRepository } from '../../../src/repositories/userRepository.js';
import { createWorkoutRepository } from '../../../src/repositories/workoutRepository.js';
import { randomHash } from '../../helpers/testCredentials.js';

describe('workoutRepository', () => {
  let db;
  let workoutRepository;
  let userRepository;
  let userId;

  beforeEach(() => {
    db = createTestDatabase();
    userRepository = createUserRepository(db);
    workoutRepository = createWorkoutRepository(db);
    const user = userRepository.create({ username: 'john', password: randomHash() });
    userId = Number(user.id);
  });

  describe('create', () => {
    it('should persist a workout and return correct data', () => {
      const result = workoutRepository.create({ userId, day: 15, month: 1, year: 2025 });
      assert.ok(result.id);
      assert.equal(result.day, 15);
      assert.equal(result.month, 1);
      assert.equal(result.year, 2025);
    });

    it('should throw on duplicate (userId, day, month, year) UNIQUE constraint', () => {
      workoutRepository.create({ userId, day: 15, month: 1, year: 2025 });
      assert.throws(
        () => workoutRepository.create({ userId, day: 15, month: 1, year: 2025 }),
        (err) => {
          assert.ok(err.message.includes('UNIQUE'));
          return true;
        },
      );
    });
  });

  describe('findByMonth', () => {
    it('should return only workouts for the given month/year/user', () => {
      workoutRepository.create({ userId, day: 5, month: 1, year: 2025 });
      workoutRepository.create({ userId, day: 10, month: 1, year: 2025 });
      workoutRepository.create({ userId, day: 20, month: 2, year: 2025 });

      const result = workoutRepository.findByMonth({ userId, month: 1, year: 2025 });
      assert.equal(result.length, 2);
      assert.equal(result[0].day, 5);
      assert.equal(result[1].day, 10);
    });

    it('should not return workouts from another user', () => {
      const userB = userRepository.create({ username: 'jane', password: randomHash() });
      const userBId = Number(userB.id);
      workoutRepository.create({ userId, day: 5, month: 1, year: 2025 });
      workoutRepository.create({ userId: userBId, day: 10, month: 1, year: 2025 });

      const result = workoutRepository.findByMonth({ userId, month: 1, year: 2025 });
      assert.equal(result.length, 1);
      assert.equal(result[0].day, 5);
    });
  });

  describe('remove', () => {
    it('should delete the workout and return true', () => {
      workoutRepository.create({ userId, day: 15, month: 1, year: 2025 });
      const result = workoutRepository.remove({ userId, day: 15, month: 1, year: 2025 });
      assert.equal(result, true);

      const remaining = workoutRepository.findByMonth({ userId, month: 1, year: 2025 });
      assert.equal(remaining.length, 0);
    });

    it('should return false for non-existent workout', () => {
      const result = workoutRepository.remove({ userId, day: 15, month: 1, year: 2025 });
      assert.equal(result, false);
    });
  });

  describe('countByYear', () => {
    it('should return correct count', () => {
      workoutRepository.create({ userId, day: 5, month: 1, year: 2025 });
      workoutRepository.create({ userId, day: 10, month: 2, year: 2025 });
      workoutRepository.create({ userId, day: 20, month: 3, year: 2026 });

      const count = workoutRepository.countByYear({ userId, year: 2025 });
      assert.equal(count, 2);
    });
  });
});
