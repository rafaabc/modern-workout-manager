import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createUserRepository } from './repositories/userRepository.js';
import { createUserService } from './services/userService.js';
import { createUserController } from './controllers/userController.js';
import { createUserRoutes } from './routes/userRoutes.js';
import { createWorkoutRepository } from './repositories/workoutRepository.js';
import { createWorkoutService } from './services/workoutService.js';
import { createWorkoutController } from './controllers/workoutController.js';
import { createWorkoutRoutes } from './routes/workoutRoutes.js';
import { createGoalRepository } from './repositories/goalRepository.js';
import { createMetricsService } from './services/metricsService.js';
import { createMetricsController } from './controllers/metricsController.js';
import { createMetricsRoutes } from './routes/metricsRoutes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Disabled under NODE_ENV=test so the API/E2E suites (many requests against one
// server instance) don't trip 429s. Real traffic always gets rate-limited.
function createLimiter(options) {
  if (process.env.NODE_ENV === 'test') {
    return (_req, _res, next) => next();
  }
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
}

export function createApp() {
  const userRepository = createUserRepository();
  const userService = createUserService(userRepository);
  const userController = createUserController(userService);
  const userRoutes = createUserRoutes(userController);

  const workoutRepository = createWorkoutRepository();
  const workoutService = createWorkoutService(workoutRepository);
  const workoutController = createWorkoutController(workoutService);
  const workoutRoutes = createWorkoutRoutes(workoutController);

  const goalRepository = createGoalRepository();
  const metricsService = createMetricsService(workoutRepository, goalRepository);
  const metricsController = createMetricsController(metricsService);
  const metricsRoutes = createMetricsRoutes(metricsController);

  const app = express();

  // Vercel (and most PaaS) put the app behind a reverse proxy; without this,
  // express-rate-limit sees every request as coming from the same IP.
  app.set('trust proxy', 1);

  const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean);
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json());

  const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: { error: 'Too many requests, please try again later' },
  });
  const generalLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: { error: 'Too many requests, please try again later' },
  });

  const swaggerPath = join(__dirname, '..', 'resources', 'swagger.json');
  const swaggerDocument = JSON.parse(readFileSync(swaggerPath, 'utf-8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use('/api/users', authLimiter, userRoutes);
  app.use('/api/workouts', generalLimiter, workoutRoutes);
  app.use('/api/metrics', generalLimiter, metricsRoutes);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, '../../frontend/dist')));
    app.get('*', generalLimiter, (req, res) => {
      res.sendFile(join(__dirname, '../../frontend/dist/index.html'));
    });
  }

  return app;
}
