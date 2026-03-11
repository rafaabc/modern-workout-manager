export function validateWorkoutDate(day, month, year) {
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return { valid: false, error: 'Day must be an integer between 1 and 31' };
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { valid: false, error: 'Month must be an integer between 1 and 12' };
  }
  if (!Number.isInteger(year) || year < 1) {
    return { valid: false, error: 'Year must be a positive integer' };
  }
  return { valid: true };
}

export function createWorkoutService(workoutRepository) {
  return {
    getCalendar({ userId, month, year }) {
      const validation = validateWorkoutDate(1, month, year);
      if (!validation.valid) {
        const error = new Error(validation.error);
        error.status = 400;
        throw error;
      }
      return workoutRepository.findByMonth({ userId, month, year });
    },

    scheduleWorkout({ userId, day, month, year }) {
      const validation = validateWorkoutDate(day, month, year);
      if (!validation.valid) {
        const error = new Error(validation.error);
        error.status = 400;
        throw error;
      }

      try {
        return workoutRepository.create({ userId, day, month, year });
      } catch (err) {
        if (err.message.includes('UNIQUE')) {
          const error = new Error('Workout already scheduled for this date');
          error.status = 409;
          throw error;
        }
        throw err;
      }
    },

    unscheduleWorkout({ userId, day, month, year }) {
      const validation = validateWorkoutDate(day, month, year);
      if (!validation.valid) {
        const error = new Error(validation.error);
        error.status = 400;
        throw error;
      }

      const removed = workoutRepository.remove({ userId, day, month, year });
      if (!removed) {
        const error = new Error('Workout not found for this date');
        error.status = 404;
        throw error;
      }
      return true;
    },
  };
}
