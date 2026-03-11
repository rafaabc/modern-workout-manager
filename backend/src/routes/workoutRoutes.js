import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';

export function createWorkoutRoutes(workoutController) {
  const router = Router();

  router.use(authMiddleware);

  router.get('/calendar', workoutController.getCalendar);
  router.post('/calendar', workoutController.scheduleWorkout);
  router.delete('/calendar', workoutController.unscheduleWorkout);

  return router;
}
