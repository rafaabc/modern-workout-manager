import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkoutService, validateWorkoutDate } from '../../../src/services/workoutService.js';

function createMockRepository() {
  const workouts = [];
  return {
    findByMonth({ userId, month, year }) {
      return workouts.filter((w) => w.userId === userId && w.month === month && w.year === year);
    },
    create({ userId, day, month, year }) {
      const existing = workouts.find(
        (w) => w.userId === userId && w.day === day && w.month === month && w.year === year,
      );
      if (existing) {
        throw new Error('UNIQUE constraint failed');
      }
      const workout = { id: workouts.length + 1, userId, day, month, year };
      workouts.push(workout);
      return { id: workout.id, day, month, year };
    },
    remove({ userId, day, month, year }) {
      const index = workouts.findIndex(
        (w) => w.userId === userId && w.day === day && w.month === month && w.year === year,
      );
      if (index === -1) return false;
      workouts.splice(index, 1);
      return true;
    },
    countByYear({ userId, year }) {
      return workouts.filter((w) => w.userId === userId && w.year === year).length;
    },
  };
}

describe('validateWorkoutDate', () => {
  it('should return valid for correct date', () => {
    assert.deepEqual(validateWorkoutDate(15, 6, 2025), { valid: true });
  });

  it('should return invalid for day < 1', () => {
    const result = validateWorkoutDate(0, 6, 2025);
    assert.equal(result.valid, false);
    assert.match(result.error, /Day/);
  });

  it('should return invalid for day > 31', () => {
    const result = validateWorkoutDate(32, 6, 2025);
    assert.equal(result.valid, false);
  });

  it('should return invalid for non-integer day', () => {
    const result = validateWorkoutDate(1.5, 6, 2025);
    assert.equal(result.valid, false);
  });

  it('should return invalid for month < 1', () => {
    const result = validateWorkoutDate(15, 0, 2025);
    assert.equal(result.valid, false);
    assert.match(result.error, /Month/);
  });

  it('should return invalid for month > 12', () => {
    const result = validateWorkoutDate(15, 13, 2025);
    assert.equal(result.valid, false);
  });

  it('should return invalid for non-integer month', () => {
    const result = validateWorkoutDate(15, 1.5, 2025);
    assert.equal(result.valid, false);
  });

  it('should return invalid for year < 1', () => {
    const result = validateWorkoutDate(15, 6, 0);
    assert.equal(result.valid, false);
    assert.match(result.error, /Year/);
  });

  it('should return invalid for non-integer year', () => {
    const result = validateWorkoutDate(15, 6, 2025.5);
    assert.equal(result.valid, false);
  });
});

describe('workoutService', () => {
  let workoutService;
  let mockRepo;

  beforeEach(() => {
    mockRepo = createMockRepository();
    workoutService = createWorkoutService(mockRepo);
  });

  describe('getCalendar', () => {
    it('should return list of workout days for the month', () => {
      mockRepo.create({ userId: 1, day: 5, month: 1, year: 2025 });
      mockRepo.create({ userId: 1, day: 10, month: 1, year: 2025 });

      const result = workoutService.getCalendar({ userId: 1, month: 1, year: 2025 });
      assert.equal(result.length, 2);
    });

    it('should return empty array when no workouts', () => {
      const result = workoutService.getCalendar({ userId: 1, month: 1, year: 2025 });
      assert.deepEqual(result, []);
    });

    it('should throw 400 for invalid month', () => {
      assert.throws(
        () => workoutService.getCalendar({ userId: 1, month: 13, year: 2025 }),
        (err) => {
          assert.equal(err.status, 400);
          return true;
        },
      );
    });
  });

  describe('scheduleWorkout', () => {
    it('should schedule a workout with valid data', () => {
      const result = workoutService.scheduleWorkout({
        userId: 1,
        day: 15,
        month: 1,
        year: 2025,
      });
      assert.equal(result.day, 15);
      assert.equal(result.month, 1);
      assert.equal(result.year, 2025);
      assert.ok(result.id);
    });

    it('should throw 409 for duplicate workout', () => {
      workoutService.scheduleWorkout({ userId: 1, day: 15, month: 1, year: 2025 });

      assert.throws(
        () => workoutService.scheduleWorkout({ userId: 1, day: 15, month: 1, year: 2025 }),
        (err) => {
          assert.equal(err.status, 409);
          assert.match(err.message, /already scheduled/);
          return true;
        },
      );
    });

    it('should throw 400 for invalid day', () => {
      assert.throws(
        () => workoutService.scheduleWorkout({ userId: 1, day: 0, month: 1, year: 2025 }),
        (err) => {
          assert.equal(err.status, 400);
          return true;
        },
      );
    });

    it('should throw 400 for invalid month', () => {
      assert.throws(
        () => workoutService.scheduleWorkout({ userId: 1, day: 15, month: 13, year: 2025 }),
        (err) => {
          assert.equal(err.status, 400);
          return true;
        },
      );
    });

    it('should throw 400 for invalid year', () => {
      assert.throws(
        () => workoutService.scheduleWorkout({ userId: 1, day: 15, month: 1, year: -1 }),
        (err) => {
          assert.equal(err.status, 400);
          return true;
        },
      );
    });
  });

  describe('unscheduleWorkout', () => {
    it('should unschedule an existing workout', () => {
      workoutService.scheduleWorkout({ userId: 1, day: 15, month: 1, year: 2025 });
      const result = workoutService.unscheduleWorkout({
        userId: 1,
        day: 15,
        month: 1,
        year: 2025,
      });
      assert.equal(result, true);
    });

    it('should throw 404 for non-existent workout', () => {
      assert.throws(
        () => workoutService.unscheduleWorkout({ userId: 1, day: 15, month: 1, year: 2025 }),
        (err) => {
          assert.equal(err.status, 404);
          assert.match(err.message, /not found/);
          return true;
        },
      );
    });

    it('should throw 400 for invalid date', () => {
      assert.throws(
        () => workoutService.unscheduleWorkout({ userId: 1, day: 32, month: 1, year: 2025 }),
        (err) => {
          assert.equal(err.status, 400);
          return true;
        },
      );
    });
  });
});
