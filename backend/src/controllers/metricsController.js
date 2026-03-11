export function createMetricsController(metricsService) {
  return {
    getMetrics(req, res) {
      try {
        const year = Number.parseInt(req.query.year, 10);
        const { userId } = req.user;

        const metrics = metricsService.getMetrics({ userId, year });
        return res.status(200).json(metrics);
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
      }
    },

    setGoal(req, res) {
      try {
        const { goal, year } = req.body;
        const { userId } = req.user;

        const result = metricsService.setGoal({ userId, goal, year });
        return res.status(200).json(result);
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
      }
    },
  };
}
