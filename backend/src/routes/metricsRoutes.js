import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';

export function createMetricsRoutes(metricsController) {
  const router = Router();

  router.use(authMiddleware);

  router.get('/', metricsController.getMetrics);
  router.post('/goal', metricsController.setGoal);

  return router;
}
