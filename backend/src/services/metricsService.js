export function createMetricsService(workoutRepository, goalRepository) {
  return {
    getMetrics({ userId, year }) {
      if (!Number.isInteger(year) || year < 1) {
        const error = new Error('Year must be a positive integer');
        error.status = 400;
        throw error;
      }

      const totalYear = workoutRepository.countByYear({ userId, year });
      const grouped = workoutRepository.countByYearGrouped({ userId, year });

      const byMonth = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const found = grouped.find((g) => g.month === month);
        return { month, count: found ? found.count : 0 };
      });

      const goalRow = goalRepository.findByUser(userId);
      let goal = null;
      let goalProgress = null;

      if (goalRow && goalRow.year === year) {
        goal = goalRow.goal;
        goalProgress = Math.round((totalYear / goal) * 100);
      }

      return { totalYear, goal, goalProgress, byMonth };
    },

    setGoal({ userId, goal, year }) {
      if (!Number.isInteger(goal) || goal < 1) {
        const error = new Error('Goal must be a positive integer');
        error.status = 400;
        throw error;
      }
      if (!Number.isInteger(year) || year < 1) {
        const error = new Error('Year must be a positive integer');
        error.status = 400;
        throw error;
      }

      return goalRepository.upsert({ userId, goal, year });
    },
  };
}
