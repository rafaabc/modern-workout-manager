export function createMetricsController(metricsService) {
  return {
    async getMetrics(req, res) {
      try {
        const year = Number.parseInt(req.query.year, 10);
        const { userId } = req.user;

        const metrics = await metricsService.getMetrics({ userId, year });
        return res.status(200).json(metrics);
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
      }
    },

    async setGoal(req, res) {
      try {
        const { goal, year } = req.body;
        const { userId } = req.user;

        const result = await metricsService.setGoal({ userId, goal, year });
        return res.status(200).json(result);
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
      }
    },
  };
}
