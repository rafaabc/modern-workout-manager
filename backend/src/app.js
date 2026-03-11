import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './database/database.js';
import { createUserRepository } from './repositories/userRepository.js';
import { createUserService } from './services/userService.js';
import { createUserController } from './controllers/userController.js';
import { createUserRoutes } from './routes/userRoutes.js';
import { createWorkoutRepository } from './repositories/workoutRepository.js';
import { createWorkoutService } from './services/workoutService.js';
import { createWorkoutController } from './controllers/workoutController.js';
import { createWorkoutRoutes } from './routes/workoutRoutes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp(dbPath) {
  const db = openDatabase(dbPath);

  const userRepository = createUserRepository(db);
  const userService = createUserService(userRepository);
  const userController = createUserController(userService);
  const userRoutes = createUserRoutes(userController);

  const workoutRepository = createWorkoutRepository(db);
  const workoutService = createWorkoutService(workoutRepository);
  const workoutController = createWorkoutController(workoutService);
  const workoutRoutes = createWorkoutRoutes(workoutController);

  const app = express();

  app.use(cors());
  app.use(express.json());

  const swaggerPath = join(__dirname, '..', 'resources', 'swagger.json');
  const swaggerDocument = JSON.parse(readFileSync(swaggerPath, 'utf-8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use('/api/users', userRoutes);
  app.use('/api/workouts', workoutRoutes);

  app.db = db;

  return app;
}
