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

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp(dbPath) {
  const db = openDatabase(dbPath);

  const userRepository = createUserRepository(db);
  const userService = createUserService(userRepository);
  const userController = createUserController(userService);
  const userRoutes = createUserRoutes(userController);

  const app = express();

  app.use(cors());
  app.use(express.json());

  const swaggerPath = join(__dirname, '..', 'resources', 'swagger.json');
  const swaggerDocument = JSON.parse(readFileSync(swaggerPath, 'utf-8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use('/api/users', userRoutes);

  app.db = db;

  return app;
}
