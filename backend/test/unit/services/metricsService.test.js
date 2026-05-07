import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createMetricsService } from '../../../src/services/metricsService.js';

function createMockWorkoutRepository(data = {}) {
  return {
    async countByYear() {
      return data.countByYear ?? 0;
    },
    async countByYearGrouped() {
      return data.countByYearGrouped ?? [];
    },
  };
}

function createMockGoalRepository(data = {}) {
  let stored = data.goal ?? null;
  return {
    async findByUser() {
      return stored || undefined;
    },
    async upsert({ userId, goal, year }) {
      stored = { id: '1', userId, goal, year };
      return stored;
    },
  };
}

describe('metricsService', () => {
  describe('getMetrics', () => {
    it('should calculate totalYear correctly', async () => {
      const workoutRepo = createMockWorkoutRepository({ countByYear: 42 });
      const goalRepo = createMockGoalRepository();
      const service = createMetricsService(workoutRepo, goalRepo);

      const result = await service.getMetrics({ userId: '1', year: 2025 });
      assert.equal(result.totalYear, 42);
    });

    it('should return byMonth with 12 entries', async () => {
      const workoutRepo = createMockWorkoutRepository({
        countByYearGrouped: [
          { month: 1, count: 5 },
          { month: 3, count: 10 },
        ],
      });
      const goalRepo = createMockGoalRepository();
      const service = createMetricsService(workoutRepo, goalRepo);

      const result = await service.getMetrics({ userId: '1', year: 2025 });
      assert.equal(result.byMonth.length, 12);
      assert.equal(result.byMonth[0].month, 1);
      assert.equal(result.byMonth[0].count, 5);
      assert.equal(result.byMonth[1].month, 2);
      assert.equal(result.byMonth[1].count, 0);
      assert.equal(result.byMonth[2].month, 3);
      assert.equal(result.byMonth[2].count, 10);
    });

    it('should calculate goalProgress correctly when goal is set', async () => {
      const workoutRepo = createMockWorkoutRepository({ countByYear: 75 });
      const goalRepo = createMockGoalRepository({
        goal: { id: '1', userId: '1', goal: 150, year: 2025 },
      });
      const service = createMetricsService(workoutRepo, goalRepo);

      const result = await service.getMetrics({ userId: '1', year: 2025 });
      assert.equal(result.goal, 150);
      assert.equal(result.goalProgress, 50);
    });

    it('should return goal null and goalProgress null when no goal set', async () => {
      const workoutRepo = createMockWorkoutRepository({ countByYear: 10 });
      const goalRepo = createMockGoalRepository();
      const service = createMetricsService(workoutRepo, goalRepo);

      const result = await service.getMetrics({ userId: '1', year: 2025 });
      assert.equal(result.goal, null);
      assert.equal(result.goalProgress, null);
    });

    it('should allow goalProgress above 100% when exceeding goal', async () => {
      const workoutRepo = createMockWorkoutRepository({ countByYear: 200 });
      const goalRepo = createMockGoalRepository({
        goal: { id: '1', userId: '1', goal: 100, year: 2025 },
      });
      const service = createMetricsService(workoutRepo, goalRepo);

      const result = await service.getMetrics({ userId: '1', year: 2025 });
      assert.equal(result.goalProgress, 200);
    });

    it('should throw 400 for invalid year', async () => {
      const workoutRepo = createMockWorkoutRepository();
      const goalRepo = createMockGoalRepository();
      const service = createMetricsService(workoutRepo, goalRepo);

      await assert.rejects(
        async () => service.getMetrics({ userId: '1', year: 0 }),
        (err) => {
          assert.equal(err.status, 400);
          return true;
        },
      );
    });
  });

  describe('setGoal', () => {
    it('should persist and return goal for valid value', async () => {
      const workoutRepo = createMockWorkoutRepository();
      const goalRepo = createMockGoalRepository();
      const service = createMetricsService(workoutRepo, goalRepo);

      const result = await service.setGoal({ userId: '1', goal: 150, year: 2025 });
      assert.equal(result.goal, 150);
      assert.equal(result.year, 2025);
    });

    it('should throw 400 for zero goal', async () => {
      const workoutRepo = createMockWorkoutRepository();
      const goalRepo = createMockGoalRepository();
      const service = createMetricsService(workoutRepo, goalRepo);

      await assert.rejects(
        async () => service.setGoal({ userId: '1', goal: 0, year: 2025 }),
        (err) => {
          assert.equal(err.status, 400);
          assert.match(err.message, /positive integer/);
          return true;
        },
      );
    });

    it('should throw 400 for negative goal', async () => {
      const workoutRepo = createMockWorkoutRepository();
      const goalRepo = createMockGoalRepository();
      const service = createMetricsService(workoutRepo, goalRepo);

      await assert.rejects(
        async () => service.setGoal({ userId: '1', goal: -5, year: 2025 }),
        (err) => {
          assert.equal(err.status, 400);
          return true;
        },
      );
    });

    it('should throw 400 for non-integer goal', async () => {
      const workoutRepo = createMockWorkoutRepository();
      const goalRepo = createMockGoalRepository();
      const service = createMetricsService(workoutRepo, goalRepo);

      await assert.rejects(
        async () => service.setGoal({ userId: '1', goal: 3.5, year: 2025 }),
        (err) => {
          assert.equal(err.status, 400);
          return true;
        },
      );
    });
  });
});
